import assert from 'node:assert/strict';
import { lotSize, margin, pipValuePerLot, profitLoss, riskReward, compounding } from '../src/lib/calc';
import { findInstrument, POINTS_PER_PIP } from '../src/lib/instruments';

const close = (a: number | null | undefined, b: number, eps = 1e-6) =>
  assert.ok(a != null && Math.abs(a - b) < eps, `expected ${b}, got ${a}`);

const EURUSD = findInstrument('EURUSD'), USDJPY = findInstrument('USDJPY'),
  XAU = findInstrument('XAUUSD'), EURJPY = findInstrument('EURJPY'), EURGBP = findInstrument('EURGBP');

// pip value
close(pipValuePerLot(EURUSD, {}), 10);
close(pipValuePerLot(XAU, {}), 10);
assert.equal(pipValuePerLot(USDJPY, {}), null);
close(pipValuePerLot(USDJPY, { USDJPY: 150 }), 1000 / 150);
close(pipValuePerLot(EURJPY, { USDJPY: 160 }), 6.25);
close(pipValuePerLot(EURGBP, { GBPUSD: 1.25 }), 12.5);
close(pipValuePerLot(findInstrument('USDCAD'), { USDCAD: 1.25 }), 8);

// lot size: $1000, 1%, SL 20 pips EURUSD => 10/(20*10)=0.05
let r = lotSize({ inst: EURUSD, rates: {}, balance: 1000, riskPercent: 1, slPips: 20 })!;
close(r.lot, 0.05); close(r.riskAmount, 10); close(r.actualRisk, 10);
// round down: $1000 2% SL 30 => 20/300=0.0667 -> 0.06
r = lotSize({ inst: EURUSD, rates: {}, balance: 1000, riskPercent: 2, slPips: 30 })!;
close(r.lot, 0.06);
// gold: risk $50, SL 50 pips ($5 move) -> 50/(50*10)=0.1
r = lotSize({ inst: XAU, rates: {}, balance: 0, riskAmount: 50, slPips: 50 })!;
close(r.lot, 0.1);
// exact float cases like 0.29 shouldn't round down to 0.28
r = lotSize({ inst: EURUSD, rates: {}, balance: 0, riskAmount: 29, slPips: 10 })!;
close(r.lot, 0.29);

// margin: 1 lot EURUSD @1.1, 1:100 => 1100
close(margin({ inst: EURUSD, rates: { EURUSD: 1.1 }, lot: 1, leverage: 100 }), 1100);
close(margin({ inst: USDJPY, rates: {}, lot: 1, leverage: 500 }), 200);
close(margin({ inst: XAU, rates: { XAUUSD: 2000 }, lot: 0.1, leverage: 500 }), 40);
assert.equal(margin({ inst: EURUSD, rates: {}, lot: 1, leverage: 100 }), null);

// risk reward
const rr = riskReward({ inst: EURUSD, rates: {}, entry: 1.1, sl: 1.098, tp: 1.104, lot: 1 })!;
assert.equal(rr.direction, 'BUY'); close(rr.slPips, 20, 1e-6); close(rr.tpPips, 40, 1e-6);
close(rr.ratio, 2, 1e-6); close(rr.breakevenWinRate, 1 / 3, 1e-6); close(rr.riskUsd!, 200, 1e-6);
const rs = riskReward({ inst: XAU, rates: {}, entry: 2000, sl: 2005, tp: 1990 })!;
assert.equal(rs.direction, 'SELL'); close(rs.slPips, 50, 1e-6); close(rs.tpPips, 100, 1e-6);
assert.equal(riskReward({ inst: EURUSD, rates: {}, entry: 1.1, sl: 1.12, tp: 1.13 }), null);

// P/L
const pl = profitLoss({ inst: XAU, rates: {}, direction: 'SELL', lot: 0.1, open: 2000, close: 1990 })!;
close(pl.pips, 100, 1e-6); close(pl.usd!, 100, 1e-6);
const pl2 = profitLoss({ inst: USDJPY, rates: {}, direction: 'BUY', lot: 1, open: 150, close: 149.5 })!;
close(pl2.pips, -50, 1e-6); close(pl2.usd!, -50 * 1000 / 149.5, 1e-6);

// compounding
const c = compounding({ initial: 1000, percent: 10, periods: 2 });
close(c[1].end, 1210);

// konvensi PALTI FX: 100 point = 10 pips = $1 pada 0.01 lot (XAUUSD & pair xxxUSD)
for (const sym of ['XAUUSD', 'EURUSD', 'GBPUSD']) {
  const inst = findInstrument(sym);
  const pips = 100 / POINTS_PER_PIP;
  close(pips, 10);
  close(pipValuePerLot(inst, {})! * 0.01 * pips, 1);
}
// XAUUSD: harga bergerak 1.00 = 100 point = 10 pips
close(profitLoss({ inst: XAU, rates: {}, direction: 'BUY', lot: 0.01, open: 2000, close: 2001 })!.pips, 10, 1e-6);
close(profitLoss({ inst: XAU, rates: {}, direction: 'BUY', lot: 0.01, open: 2000, close: 2001 })!.usd!, 1, 1e-6);

console.log('Semua tes kalkulator lulus ✓');
