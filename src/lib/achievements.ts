import type { Ionicons } from '@expo/vector-icons';
import { MODULES } from '../data/modules';
import type { Settings, Trade } from './store';

/* ------------------------------------------------------------------ */
/* Streak: hari berturut-turut ada catatan jurnal.                      */
/* Sabtu & Minggu tanpa catatan tidak memutus streak (pasar tutup),     */
/* tapi kalau ada catatan di akhir pekan tetap dihitung.                */
/* ------------------------------------------------------------------ */

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // tengah hari: aman dari pergeseran zona waktu
};
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const prevDay = (d: Date) => {
  const x = new Date(d);
  x.setDate(x.getDate() - 1);
  return x;
};
/** true bila semua hari di antara a dan b (eksklusif) adalah akhir pekan */
const onlyWeekendBetween = (a: Date, b: Date) => {
  for (let x = prevDay(b); toKey(x) > toKey(a); x = prevDay(x)) if (!isWeekend(x)) return false;
  return true;
};

export type StreakInfo = {
  current: number;
  best: number;
  /** Sudah mencatat hari ini? */
  today: boolean;
  /** Status Senin–Jumat minggu ini: true = ada catatan, null = belum lewat */
  week: { label: string; done: boolean; isToday: boolean; future: boolean }[];
};

export function computeStreak(trades: Trade[], now = new Date()): StreakInfo {
  const days = new Set(trades.map((t) => t.date));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);

  // streak berjalan (hari ini belum mencatat tidak memutus streak)
  let cur = 0;
  let d = days.has(toKey(today)) ? today : prevDay(today);
  for (let guard = 0; guard < 3660; guard++) {
    if (days.has(toKey(d))) cur++;
    else if (!isWeekend(d)) break;
    d = prevDay(d);
  }

  // streak terbaik sepanjang waktu
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sorted) {
    const x = fromKey(k);
    run = prev && onlyWeekendBetween(prev, x) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = x;
  }
  best = Math.max(best, cur);

  // Senin–Jumat minggu ini
  const monday = new Date(today);
  const dow = today.getDay() === 0 ? 7 : today.getDay();
  monday.setDate(today.getDate() - (dow - 1));
  const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
  const week = labels.map((label, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return {
      label,
      done: days.has(toKey(x)),
      isToday: toKey(x) === toKey(today),
      future: x.getTime() > today.getTime(),
    };
  });

  return { current: cur, best, today: days.has(toKey(today)), week };
}

/* ------------------------------------------------------------------ */
/* Pencapaian                                                          */
/* ------------------------------------------------------------------ */

export type Tier = 'bronze' | 'silver' | 'gold';
type IconName = keyof typeof Ionicons.glyphMap;

export type AchievementCtx = {
  trades: Trade[];
  completed: Record<string, boolean>;
  settings: Settings;
  streakBest: number;
};

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  icon: IconName;
  tier: Tier;
  /** progres [sekarang, target] */
  progress: (c: AchievementCtx) => [number, number];
};

const lessonsDone = (c: AchievementCtx) => Object.values(c.completed).filter(Boolean).length;
const totalLessons = MODULES.reduce((n, m) => n + m.lessons.length, 0);
const modulesDone = (c: AchievementCtx) =>
  MODULES.filter((m) => m.lessons.every((l) => c.completed[l.id])).length;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'welcome',
    title: 'Inner Circle',
    desc: 'Resmi bergabung dengan komunitas VIP',
    icon: 'diamond',
    tier: 'gold',
    progress: (c) => [c.settings.welcomed ? 1 : 0, 1],
  },
  {
    id: 'first-trade',
    title: 'Langkah Pertama',
    desc: 'Catat trade pertama di jurnal',
    icon: 'create',
    tier: 'bronze',
    progress: (c) => [Math.min(c.trades.length, 1), 1],
  },
  {
    id: 'first-win',
    title: 'Profit Pertama',
    desc: 'Catat trade pertama yang profit',
    icon: 'trending-up',
    tier: 'bronze',
    progress: (c) => [c.trades.some((t) => t.pl > 0) ? 1 : 0, 1],
  },
  {
    id: 'trades-10',
    title: 'Pencatat Rajin',
    desc: 'Catat 10 trade',
    icon: 'albums',
    tier: 'silver',
    progress: (c) => [Math.min(c.trades.length, 10), 10],
  },
  {
    id: 'trades-50',
    title: 'Jurnal Master',
    desc: 'Catat 50 trade',
    icon: 'library',
    tier: 'gold',
    progress: (c) => [Math.min(c.trades.length, 50), 50],
  },
  {
    id: 'streak-3',
    title: 'Mulai Disiplin',
    desc: 'Mencatat 3 hari trading berturut-turut',
    icon: 'flame',
    tier: 'bronze',
    progress: (c) => [Math.min(c.streakBest, 3), 3],
  },
  {
    id: 'streak-7',
    title: 'Disiplin Seminggu',
    desc: 'Mencatat 7 hari trading berturut-turut',
    icon: 'flame',
    tier: 'silver',
    progress: (c) => [Math.min(c.streakBest, 7), 7],
  },
  {
    id: 'streak-20',
    title: 'Disiplin Sebulan',
    desc: 'Mencatat 20 hari trading berturut-turut',
    icon: 'flame',
    tier: 'gold',
    progress: (c) => [Math.min(c.streakBest, 20), 20],
  },
  {
    id: 'reflect-5',
    title: 'Evaluator',
    desc: 'Tulis catatan & pelajaran di 5 trade',
    icon: 'bulb',
    tier: 'silver',
    progress: (c) => [Math.min(c.trades.filter((t) => t.notes && t.notes.length > 0).length, 5), 5],
  },
  {
    id: 'lot-5',
    title: 'Hitung Dulu, Baru Entry',
    desc: 'Gunakan kalkulator Lot Size 5 kali',
    icon: 'calculator',
    tier: 'bronze',
    progress: (c) => [Math.min(c.settings.lotCalcCount ?? 0, 5), 5],
  },
  {
    id: 'lesson-1',
    title: 'Pelajar Baru',
    desc: 'Selesaikan materi pertama',
    icon: 'book',
    tier: 'bronze',
    progress: (c) => [Math.min(lessonsDone(c), 1), 1],
  },
  {
    id: 'module-1',
    title: 'Modul Tuntas',
    desc: 'Selesaikan satu modul penuh',
    icon: 'ribbon',
    tier: 'silver',
    progress: (c) => [Math.min(modulesDone(c), 1), 1],
  },
  {
    id: 'academy',
    title: 'Lulus Akademi',
    desc: 'Selesaikan semua materi edukasi',
    icon: 'school',
    tier: 'gold',
    progress: (c) => [lessonsDone(c), totalLessons],
  },
];

export const isUnlocked = (a: Achievement, c: AchievementCtx) => {
  const [v, t] = a.progress(c);
  return v >= t;
};

export const TIER_COLORS: Record<Tier, { grad: readonly [string, string, string]; ink: string; label: string }> = {
  bronze: { grad: ['#F2C29A', '#C98A4B', '#8A5527'], ink: '#2A160A', label: 'Perunggu' },
  silver: { grad: ['#F4F6F9', '#C3C9D2', '#7E8793'], ink: '#15181C', label: 'Perak' },
  gold: { grad: ['#FCE39A', '#EDC13A', '#B3861A'], ink: '#16110A', label: 'Emas' },
};
