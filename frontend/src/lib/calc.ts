import { Instrument, neededPair, usdPerUnit } from './instruments';

/** Harga pasangan yang sudah diketahui, mis. { USDJPY: 150.2, EURJPY: 162.1 } */
export type Rates = Record<string, number | undefined>;

const valid = (n: number | undefined): n is number => typeof n === 'number' && isFinite(n) && n > 0;

/** Konversi 1 unit mata uang quote/base instrumen ke USD. null bila kurs belum diisi. */
export function toUsdFactor(inst: Instrument, which: 'quote' | 'base', rates: Rates): number | null {
  const ccy = which === 'quote' ? inst.quote : inst.base;
  const pair = neededPair(inst, which);
  if (!pair) return 1;
  const p = rates[pair];
  if (!valid(p)) return null;
  return usdPerUnit(ccy, p);
}

/** Pasangan harga yang harus diisi user untuk perhitungan tertentu. */
export function requiredPairs(inst: Instrument, which: ('quote' | 'base')[]): string[] {
  const out: string[] = [];
  for (const w of which) {
    const p = neededPair(inst, w);
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}

/** Nilai 1 pip (USD) untuk 1 lot standar. */
export function pipValuePerLot(inst: Instrument, rates: Rates): number | null {
  const f = toUsdFactor(inst, 'quote', rates);
  if (f == null) return null;
  return inst.contract * inst.pipSize * f;
}

export function priceDiffToPips(inst: Instrument, a: number, b: number): number {
  return Math.abs(a - b) / inst.pipSize;
}

export const floorLot = (lot: number, step = 0.01) => Math.floor(lot / step + 1e-9) * step;

export type LotResult = {
  riskAmount: number;
  pipValue: number;
  rawLot: number;
  lot: number;
  actualRisk: number;
};

export function lotSize(params: {
  inst: Instrument;
  rates: Rates;
  balance: number;
  riskPercent?: number;
  riskAmount?: number;
  slPips: number;
}): LotResult | null {
  const { inst, rates, balance, riskPercent, slPips } = params;
  const pv = pipValuePerLot(inst, rates);
  if (pv == null || !valid(slPips)) return null;
  const riskAmount = valid(params.riskAmount)
    ? params.riskAmount
    : valid(balance) && valid(riskPercent)
      ? (balance * riskPercent) / 100
      : NaN;
  if (!valid(riskAmount)) return null;
  const rawLot = riskAmount / (slPips * pv);
  const lot = floorLot(rawLot);
  return { riskAmount, pipValue: pv, rawLot, lot, actualRisk: lot * slPips * pv };
}

export function margin(params: { inst: Instrument; rates: Rates; lot: number; leverage: number }): number | null {
  const { inst, rates, lot, leverage } = params;
  if (!valid(lot) || !valid(leverage)) return null;
  const f = toUsdFactor(inst, 'base', rates);
  if (f == null) return null;
  return (lot * inst.contract * f) / leverage;
}

export type RRResult = {
  direction: 'BUY' | 'SELL';
  slPips: number;
  tpPips: number;
  ratio: number;
  breakevenWinRate: number;
  riskUsd: number | null;
  rewardUsd: number | null;
};

export function riskReward(params: {
  inst: Instrument;
  rates: Rates;
  entry: number;
  sl: number;
  tp: number;
  lot?: number;
}): RRResult | null {
  const { inst, rates, entry, sl, tp, lot } = params;
  if (!valid(entry) || !valid(sl) || !valid(tp)) return null;
  const buy = tp > entry && sl < entry;
  const sell = tp < entry && sl > entry;
  if (!buy && !sell) return null;
  const slPips = priceDiffToPips(inst, entry, sl);
  const tpPips = priceDiffToPips(inst, entry, tp);
  const ratio = tpPips / slPips;
  const pv = pipValuePerLot(inst, { ...rates, [inst.symbol]: rates[inst.symbol] ?? entry });
  const hasLot = valid(lot) && pv != null;
  return {
    direction: buy ? 'BUY' : 'SELL',
    slPips,
    tpPips,
    ratio,
    breakevenWinRate: 1 / (1 + ratio),
    riskUsd: hasLot ? lot! * slPips * pv! : null,
    rewardUsd: hasLot ? lot! * tpPips * pv! : null,
  };
}

export function profitLoss(params: {
  inst: Instrument;
  rates: Rates;
  direction: 'BUY' | 'SELL';
  lot: number;
  open: number;
  close: number;
}): { pips: number; usd: number | null } | null {
  const { inst, rates, direction, lot, open, close } = params;
  if (!valid(open) || !valid(close) || !valid(lot)) return null;
  const sign = direction === 'BUY' ? 1 : -1;
  const pips = ((close - open) * sign) / inst.pipSize;
  // untuk pasangan USD/XXX, nilai pip dihitung pada harga penutupan
  const pv = pipValuePerLot(inst, { ...rates, [inst.symbol]: rates[inst.symbol] ?? close });
  return { pips, usd: pv == null ? null : pips * pv * lot };
}

export type CompoundRow = { period: number; start: number; profit: number; end: number };

export function compounding(params: {
  initial: number;
  percent: number;
  periods: number;
  addPerPeriod?: number;
}): CompoundRow[] {
  const { initial, percent, periods } = params;
  const add = params.addPerPeriod && isFinite(params.addPerPeriod) ? params.addPerPeriod : 0;
  if (!valid(initial) || !isFinite(percent) || !valid(periods)) return [];
  const rows: CompoundRow[] = [];
  let bal = initial;
  const n = Math.min(Math.floor(periods), 120);
  for (let i = 1; i <= n; i++) {
    const profit = (bal * percent) / 100;
    const end = bal + profit + add;
    rows.push({ period: i, start: bal, profit, end });
    bal = end;
  }
  return rows;
}
