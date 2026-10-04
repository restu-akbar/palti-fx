export type Instrument = {
  symbol: string;
  base: string;
  quote: string;
  /** Unit per 1 lot standar */
  contract: number;
  /** Besar 1 pip dalam satuan harga */
  pipSize: number;
  /** Jumlah desimal harga */
  digits: number;
  group: 'Major' | 'Minor' | 'Komoditas';
};

const fx = (base: string, quote: string, group: 'Major' | 'Minor'): Instrument => {
  const jpy = quote === 'JPY';
  return {
    symbol: base + quote,
    base,
    quote,
    contract: 100000,
    pipSize: jpy ? 0.01 : 0.0001,
    digits: jpy ? 3 : 5,
    group,
  };
};

export const INSTRUMENTS: Instrument[] = [
  { symbol: 'XAUUSD', base: 'XAU', quote: 'USD', contract: 100, pipSize: 0.1, digits: 2, group: 'Komoditas' },
  { symbol: 'XAGUSD', base: 'XAG', quote: 'USD', contract: 5000, pipSize: 0.01, digits: 3, group: 'Komoditas' },
  fx('EUR', 'USD', 'Major'),
  fx('GBP', 'USD', 'Major'),
  fx('AUD', 'USD', 'Major'),
  fx('NZD', 'USD', 'Major'),
  fx('USD', 'JPY', 'Major'),
  fx('USD', 'CHF', 'Major'),
  fx('USD', 'CAD', 'Major'),
  fx('EUR', 'JPY', 'Minor'),
  fx('GBP', 'JPY', 'Minor'),
  fx('AUD', 'JPY', 'Minor'),
  fx('CAD', 'JPY', 'Minor'),
  fx('CHF', 'JPY', 'Minor'),
  fx('EUR', 'GBP', 'Minor'),
  fx('EUR', 'AUD', 'Minor'),
  fx('EUR', 'CHF', 'Minor'),
  fx('EUR', 'CAD', 'Minor'),
  fx('GBP', 'AUD', 'Minor'),
  fx('GBP', 'CHF', 'Minor'),
  fx('GBP', 'CAD', 'Minor'),
  fx('AUD', 'CAD', 'Minor'),
  fx('AUD', 'NZD', 'Minor'),
];

/** 1 point = 1/10 pip (digit terakhir harga di MT4/MT5). 10 point = 1 pip. */
export const POINTS_PER_PIP = 10;
export const pointSize = (i: Instrument) => i.pipSize / POINTS_PER_PIP;

export const findInstrument = (symbol: string) =>
  INSTRUMENTS.find((i) => i.symbol === symbol) ?? INSTRUMENTS[0];

/** Mata uang yang dikutip sebagai CCYUSD (bukan USDCCY) */
const USD_QUOTED = ['EUR', 'GBP', 'AUD', 'NZD', 'XAU', 'XAG'];

/** Nama pasangan konvensional untuk mengonversi mata uang ke USD, atau null jika USD. */
export function conversionPair(ccy: string): string | null {
  if (ccy === 'USD') return null;
  return USD_QUOTED.includes(ccy) ? ccy + 'USD' : 'USD' + ccy;
}

/** Nilai 1 unit mata uang dalam USD, dari harga pasangan konvensional. */
export function usdPerUnit(ccy: string, pairPrice: number): number {
  if (ccy === 'USD') return 1;
  return USD_QUOTED.includes(ccy) ? pairPrice : 1 / pairPrice;
}

/**
 * Kurs yang dibutuhkan untuk konversi ke USD.
 * - untuk nilai pip: mata uang quote
 * - untuk margin: mata uang base
 * Jika pasangan konversinya sama dengan instrumen itu sendiri, pakai harga instrumen.
 */
export function neededPair(inst: Instrument, which: 'quote' | 'base'): string | null {
  return conversionPair(which === 'quote' ? inst.quote : inst.base);
}
