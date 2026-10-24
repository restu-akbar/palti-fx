import { describe, expect, it } from 'vitest';
import { MODULES } from '../src/data/modules';
import type { Settings } from '../src/core/domain/settings';
import type { Trade } from '../src/core/domain/trade';
import { ACHIEVEMENTS, AchievementCtx, computeStreak, isUnlocked } from '../src/lib/achievements';

const trade = (id: string, date: string, extra: Partial<Trade> = {}): Trade => ({
  id,
  date,
  symbol: 'EURUSD',
  direction: 'BUY',
  lot: 0.1,
  pl: 1,
  createdAt: 1,
  ...extra,
});

const ctx = (over: Partial<AchievementCtx> = {}): AchievementCtx => ({
  trades: [],
  completed: {},
  settings: {} as Settings,
  streakBest: 0,
  ...over,
});

const byId = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)!;

describe('daftar pencapaian', () => {
  it('id unik dan target positif', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    ACHIEVEMENTS.forEach((a) => expect(a.progress(ctx())[1]).toBeGreaterThan(0));
  });

  it('tidak ada yang terbuka pada konteks kosong kecuali tidak ada syarat', () => {
    expect(ACHIEVEMENTS.filter((a) => isUnlocked(a, ctx()))).toEqual([]);
  });
});

describe('syarat pencapaian', () => {
  it('welcome mengikuti settings.welcomed', () => {
    expect(isUnlocked(byId('welcome'), ctx({ settings: { welcomed: true } }))).toBe(true);
  });

  it('first-trade dan first-win', () => {
    const loss = trade('1', '2026-01-05', { pl: -3 });
    expect(isUnlocked(byId('first-trade'), ctx({ trades: [loss] }))).toBe(true);
    expect(isUnlocked(byId('first-win'), ctx({ trades: [loss] }))).toBe(false);
    expect(isUnlocked(byId('first-win'), ctx({ trades: [loss, trade('2', '2026-01-06')] }))).toBe(true);
  });

  it('jumlah trade dibatasi pada target', () => {
    const many = Array.from({ length: 60 }, (_, i) => trade(String(i), '2026-01-05'));
    expect(byId('trades-10').progress(ctx({ trades: many }))).toEqual([10, 10]);
    expect(byId('trades-50').progress(ctx({ trades: many }))).toEqual([50, 50]);
    expect(isUnlocked(byId('trades-50'), ctx({ trades: many.slice(0, 49) }))).toBe(false);
  });

  it('streak memakai streakBest', () => {
    expect(isUnlocked(byId('streak-3'), ctx({ streakBest: 3 }))).toBe(true);
    expect(isUnlocked(byId('streak-7'), ctx({ streakBest: 6 }))).toBe(false);
    expect(byId('streak-20').progress(ctx({ streakBest: 99 }))).toEqual([20, 20]);
  });

  it('reflect-5 hanya menghitung trade yang punya catatan', () => {
    const noted = Array.from({ length: 4 }, (_, i) => trade(`n${i}`, '2026-01-05', { notes: 'pelajaran' }));
    const empty = trade('e', '2026-01-05', { notes: '' });
    expect(byId('reflect-5').progress(ctx({ trades: [...noted, empty] }))).toEqual([4, 5]);
    expect(isUnlocked(byId('reflect-5'), ctx({ trades: [...noted, trade('x', '2026-01-05', { notes: 'ok' })] }))).toBe(true);
  });

  it('lot-5 memakai lotCalcCount', () => {
    expect(byId('lot-5').progress(ctx())).toEqual([0, 5]);
    expect(isUnlocked(byId('lot-5'), ctx({ settings: { lotCalcCount: 5 } }))).toBe(true);
  });

  it('pencapaian edukasi: lesson-1, module-1, academy', () => {
    const first = MODULES[0];
    const oneLesson = { [first.lessons[0].id]: true };
    expect(isUnlocked(byId('lesson-1'), ctx({ completed: oneLesson }))).toBe(true);
    expect(isUnlocked(byId('module-1'), ctx({ completed: oneLesson }))).toBe(first.lessons.length === 1);

    const wholeModule = Object.fromEntries(first.lessons.map((l) => [l.id, true]));
    expect(isUnlocked(byId('module-1'), ctx({ completed: wholeModule }))).toBe(true);

    const all = Object.fromEntries(MODULES.flatMap((m) => m.lessons.map((l) => [l.id, true])));
    expect(isUnlocked(byId('academy'), ctx({ completed: all }))).toBe(true);
    expect(isUnlocked(byId('academy'), ctx({ completed: wholeModule }))).toBe(MODULES.length === 1);
  });

  it('bab yang ditandai belum selesai tidak dihitung', () => {
    const c = ctx({ completed: { [MODULES[0].lessons[0].id]: false } });
    expect(isUnlocked(byId('lesson-1'), c)).toBe(false);
  });
});

describe('computeStreak', () => {
  const monday = new Date(2026, 0, 12, 9);

  it('akhir pekan tanpa catatan tidak memutus streak', () => {
    const info = computeStreak([trade('1', '2026-01-09'), trade('2', '2026-01-12')], monday);
    expect(info.current).toBe(2);
    expect(info.best).toBe(2);
    expect(info.today).toBe(true);
  });

  it('hari kerja yang kosong memutus streak', () => {
    const wed = new Date(2026, 0, 14, 9);
    const info = computeStreak([trade('1', '2026-01-12'), trade('2', '2026-01-14')], wed);
    expect(info.current).toBe(1);
    expect(info.best).toBe(1);
  });

  it('hari ini belum mencatat tidak memutus streak berjalan', () => {
    const tue = new Date(2026, 0, 13, 9);
    const info = computeStreak([trade('1', '2026-01-12')], tue);
    expect(info.current).toBe(1);
    expect(info.today).toBe(false);
  });

  it('tanpa trade semua nol', () => {
    const info = computeStreak([], monday);
    expect(info.current).toBe(0);
    expect(info.best).toBe(0);
  });

  it('status minggu ini Senin–Jumat', () => {
    const wed = new Date(2026, 0, 14, 9);
    const info = computeStreak([trade('1', '2026-01-12'), trade('2', '2026-01-14')], wed);
    expect(info.week.map((d) => d.label)).toEqual(['Sen', 'Sel', 'Rab', 'Kam', 'Jum']);
    expect(info.week.map((d) => d.done)).toEqual([true, false, true, false, false]);
    expect(info.week.map((d) => d.isToday)).toEqual([false, false, true, false, false]);
    expect(info.week.map((d) => d.future)).toEqual([false, false, false, true, true]);
  });

  it('menandai akhir pekan', () => {
    const sat = new Date(2026, 0, 17, 9);
    expect(computeStreak([], sat).isWeekend).toBe(true);
    expect(computeStreak([], monday).isWeekend).toBe(false);
  });
});
