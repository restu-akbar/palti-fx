import { describe, expect, it } from 'vitest';
import { computeStats } from '../src/lib/store';

const t = (pl: number, date = '2026-01-01', id = Math.random().toString()) => ({
  id,
  date,
  symbol: 'EURUSD',
  direction: 'BUY' as const,
  lot: 0.1,
  pl,
  createdAt: 1,
});

describe('computeStats', () => {
  it('kosong => nol aman', () => {
    const s = computeStats([]);
    expect(s.count).toBe(0);
    expect(s.winRate).toBe(0);
    expect(s.net).toBe(0);
    expect(s.equity).toEqual([0]);
  });
  it('win rate = menang / total (impas menurunkan rate)', () => {
    const s = computeStats([t(10, '2026-01-01', 'a'), t(0, '2026-01-02', 'b'), t(-5, '2026-01-03', 'c')]);
    expect(s.count).toBe(3);
    expect(s.wins).toBe(1);
    expect(s.losses).toBe(1);
    expect(s.winRate).toBeCloseTo(1 / 3, 6);
    expect(s.net).toBeCloseTo(5, 6);
  });
  it('profit factor null (∞) bila belum pernah rugi', () => {
    const s = computeStats([t(10, '2026-01-01', 'a'), t(20, '2026-01-02', 'b')]);
    expect(s.profitFactor).toBeNull();
  });
  it('profit factor angka bila ada rugi', () => {
    const s = computeStats([t(20, '2026-01-01', 'a'), t(-10, '2026-01-02', 'b')]);
    expect(s.profitFactor).toBeCloseTo(2, 6);
    expect(s.avgWin).toBeCloseTo(20, 6);
    expect(s.avgLoss).toBeCloseTo(10, 6);
  });
  it('equity kumulatif kronologis dari 0', () => {
    const s = computeStats([t(-5, '2026-01-02', 'b'), t(10, '2026-01-01', 'a')]);
    expect(s.equity).toEqual([0, 10, 5]);
    expect(s.best).toBe(10);
    expect(s.worst).toBe(-5);
  });
});
