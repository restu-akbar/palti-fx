import { describe, expect, it } from 'vitest';
import { greeting, marketStatus } from '../src/lib/sessions';

describe('marketStatus', () => {
  it('akhir pekan tutup: Sabtu siang UTC', () => {
    const s = marketStatus(new Date(Date.UTC(2026, 8, 26, 12, 0)));
    expect(s.weekend).toBe(true);
    expect(s.active).toEqual([]);
  });
  it('Jumat 22 UTC sudah tutup', () => {
    const s = marketStatus(new Date(Date.UTC(2026, 8, 25, 22, 0)));
    expect(s.weekend).toBe(true);
  });
  it('Senin 10 UTC buka + overlap London-NewYork', () => {
    // 10 UTC = sesi London (7-16) + NewYork (12-21)? 10 UTC hanya London.
    const morning = marketStatus(new Date(Date.UTC(2026, 8, 28, 10, 0)));
    expect(morning.weekend).toBe(false);
    expect(morning.active.some((a) => a.key === 'ldn')).toBe(true);
    const overlap = marketStatus(new Date(Date.UTC(2026, 8, 28, 13, 0)));
    expect(overlap.overlapLN).toBe(true);
  });
});

describe('greeting (WIB)', () => {
  it('pagi/siang/sore/malam', () => {
    // WIB = UTC+7. 02 UTC = 09 WIB pagi.
    expect(greeting(new Date(Date.UTC(2026, 0, 1, 2, 0)))).toBe('Selamat pagi');
    expect(greeting(new Date(Date.UTC(2026, 0, 1, 6, 0)))).toBe('Selamat siang');
    expect(greeting(new Date(Date.UTC(2026, 0, 1, 9, 0)))).toBe('Selamat sore');
    expect(greeting(new Date(Date.UTC(2026, 0, 1, 15, 0)))).toBe('Selamat malam');
  });
});
