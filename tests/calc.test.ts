import { describe, expect, it } from 'vitest';
import { compounding, lotSize, margin, pipValuePerLot, profitLoss, riskReward } from '../src/lib/calc';
import { POINTS_PER_PIP, findInstrument } from '../src/lib/instruments';

const EURUSD = findInstrument('EURUSD');
const USDJPY = findInstrument('USDJPY');
const XAU = findInstrument('XAUUSD');
const EURJPY = findInstrument('EURJPY');
const EURGBP = findInstrument('EURGBP');

describe('pip value', () => {
  it('xxx/USD dan XAUUSD = $10 per lot tanpa kurs tambahan', () => {
    expect(pipValuePerLot(EURUSD, {})).toBeCloseTo(10, 6);
    expect(pipValuePerLot(XAU, {})).toBeCloseTo(10, 6);
  });
  it('USDJPY butuh kurs manual', () => {
    expect(pipValuePerLot(USDJPY, {})).toBeNull();
    expect(pipValuePerLot(USDJPY, { USDJPY: 150 })).toBeCloseTo(1000 / 150, 6);
  });
  it('cross pair via konversi', () => {
    expect(pipValuePerLot(EURJPY, { USDJPY: 160 })).toBeCloseTo(6.25, 6);
    expect(pipValuePerLot(EURGBP, { GBPUSD: 1.25 })).toBeCloseTo(12.5, 6);
    expect(pipValuePerLot(findInstrument('USDCAD'), { USDCAD: 1.25 })).toBeCloseTo(8, 6);
  });
});

describe('lot size', () => {
  it('$1000 1% SL 20 pips EURUSD => 0.05', () => {
    const r = lotSize({ inst: EURUSD, rates: {}, balance: 1000, riskPercent: 1, slPips: 20 })!;
    expect(r.lot).toBeCloseTo(0.05, 6);
    expect(r.riskAmount).toBeCloseTo(10, 6);
  });
  it('dibulatkan ke bawah 0.01', () => {
    const r = lotSize({ inst: EURUSD, rates: {}, balance: 1000, riskPercent: 2, slPips: 30 })!;
    expect(r.lot).toBeCloseTo(0.06, 6);
  });
  it('gold risk $50 SL 50 pips => 0.1', () => {
    const r = lotSize({ inst: XAU, rates: {}, balance: 0, riskAmount: 50, slPips: 50 })!;
    expect(r.lot).toBeCloseTo(0.1, 6);
  });
  it('kasus float 0.29 tidak turun ke 0.28', () => {
    const r = lotSize({ inst: EURUSD, rates: {}, balance: 0, riskAmount: 29, slPips: 10 })!;
    expect(r.lot).toBeCloseTo(0.29, 6);
  });
});

describe('margin', () => {
  it('1 lot EURUSD @1.1 lev 100 => 1100', () => {
    expect(margin({ inst: EURUSD, rates: { EURUSD: 1.1 }, lot: 1, leverage: 100 })).toBeCloseTo(1100, 6);
  });
  it('USDJPY tanpa kurs pakai nominal kontrak', () => {
    expect(margin({ inst: USDJPY, rates: {}, lot: 1, leverage: 500 })).toBeCloseTo(200, 6);
  });
  it('gold 0.1 @2000 lev 500 => 40', () => {
    expect(margin({ inst: XAU, rates: { XAUUSD: 2000 }, lot: 0.1, leverage: 500 })).toBeCloseTo(40, 6);
  });
  it('null bila kurs base belum diisi', () => {
    expect(margin({ inst: EURUSD, rates: {}, lot: 1, leverage: 100 })).toBeNull();
  });
});

describe('risk reward', () => {
  it('BUY EURUSD SL 20 TP 40 => RR 2, BE 1/3', () => {
    const rr = riskReward({ inst: EURUSD, rates: {}, entry: 1.1, sl: 1.098, tp: 1.104, lot: 1 })!;
    expect(rr.direction).toBe('BUY');
    expect(rr.ratio).toBeCloseTo(2, 6);
    expect(rr.breakevenWinRate).toBeCloseTo(1 / 3, 6);
    expect(rr.riskUsd!).toBeCloseTo(200, 4);
  });
  it('SELL XAU', () => {
    const rs = riskReward({ inst: XAU, rates: {}, entry: 2000, sl: 2005, tp: 1990 })!;
    expect(rs.direction).toBe('SELL');
    expect(rs.slPips).toBeCloseTo(50, 4);
    expect(rs.tpPips).toBeCloseTo(100, 4);
  });
  it('null bila arah tidak konsisten', () => {
    expect(riskReward({ inst: EURUSD, rates: {}, entry: 1.1, sl: 1.12, tp: 1.13 })).toBeNull();
  });
});

describe('profit/loss', () => {
  it('SELL XAU 0.1 2000->1990 => 100 pips $100', () => {
    const pl = profitLoss({ inst: XAU, rates: {}, direction: 'SELL', lot: 0.1, open: 2000, close: 1990 })!;
    expect(pl.pips).toBeCloseTo(100, 4);
    expect(pl.usd!).toBeCloseTo(100, 4);
  });
});

describe('compounding', () => {
  it('1000 +10% 2 periode => 1210', () => {
    const c = compounding({ initial: 1000, percent: 10, periods: 2 });
    expect(c[1].end).toBeCloseTo(1210, 6);
  });
});

describe('konvensi PALTI FX 100 point = 10 pips = $1 @0.01', () => {
  it.each(['XAUUSD', 'EURUSD', 'GBPUSD'])('%s memenuhi konvensi', (sym) => {
    const inst = findInstrument(sym);
    expect(100 / POINTS_PER_PIP).toBeCloseTo(10, 6);
    expect(pipValuePerLot(inst, {})! * 0.01 * 10).toBeCloseTo(1, 6);
  });
  it('XAUUSD gerak 1.00 = 10 pips = $1 @0.01', () => {
    const r = profitLoss({ inst: XAU, rates: {}, direction: 'BUY', lot: 0.01, open: 2000, close: 2001 })!;
    expect(r.pips).toBeCloseTo(10, 4);
    expect(r.usd!).toBeCloseTo(1, 4);
  });
});
