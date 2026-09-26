/** Sesi pasar forex (perkiraan, jam UTC). Ditampilkan dalam WIB (UTC+7). */
export type Session = { key: string; name: string; city: string; start: number; end: number; color: string };

export const SESSIONS: Session[] = [
  { key: 'syd', name: 'Sydney', city: 'SYD', start: 21, end: 6, color: '#6AA8FF' },
  { key: 'tyo', name: 'Tokyo', city: 'TYO', start: 0, end: 9, color: '#F0625C' },
  { key: 'ldn', name: 'London', city: 'LDN', start: 7, end: 16, color: '#E3B64F' },
  { key: 'nyc', name: 'New York', city: 'NYC', start: 12, end: 21, color: '#35C98A' },
];

export const WIB_OFFSET = 7;

const inRange = (h: number, s: number, e: number) => (s < e ? h >= s && h < e : h >= s || h < e);

export function marketStatus(now = new Date()) {
  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
  const day = now.getUTCDay(); // 0 Minggu
  // Pasar tutup: Jumat 21:00 UTC – Minggu 21:00 UTC
  const weekend = (day === 5 && utcH >= 21) || day === 6 || (day === 0 && utcH < 21);
  const active = weekend ? [] : SESSIONS.filter((s) => inRange(utcH, s.start, s.end));
  const wibH = (utcH + WIB_OFFSET) % 24;
  const overlapLN = active.some((s) => s.key === 'ldn') && active.some((s) => s.key === 'nyc');
  return { utcH, wibH, weekend, active, overlapLN };
}

export const toWib = (utcHour: number) => (utcHour + WIB_OFFSET) % 24;
export const hh = (h: number) => String(Math.floor(h)).padStart(2, '0') + '.00';

export function greeting(now = new Date()) {
  const h = (now.getUTCHours() + WIB_OFFSET) % 24;
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}
