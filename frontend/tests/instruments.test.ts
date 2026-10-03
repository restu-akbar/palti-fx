import { describe, expect, it } from 'vitest';
import { conversionPair, findInstrument, neededPair, usdPerUnit } from '../src/lib/instruments';

describe('instruments', () => {
  it('findInstrument fallback ke pertama bila tak dikenal', () => {
    expect(findInstrument('NOPE').symbol).toBe('XAUUSD');
  });
  it('conversionPair USD => null', () => {
    expect(conversionPair('USD')).toBeNull();
    expect(conversionPair('EUR')).toBe('EURUSD');
    expect(conversionPair('JPY')).toBe('USDJPY');
  });
  it('usdPerUnit arah benar', () => {
    expect(usdPerUnit('USD', 999)).toBe(1);
    expect(usdPerUnit('EUR', 1.1)).toBeCloseTo(1.1, 6);
    expect(usdPerUnit('JPY', 150)).toBeCloseTo(1 / 150, 8);
  });
  it('neededPair quote/base', () => {
    expect(neededPair(findInstrument('EURUSD'), 'quote')).toBeNull();
    expect(neededPair(findInstrument('USDJPY'), 'quote')).toBe('USDJPY');
    expect(neededPair(findInstrument('EURJPY'), 'base')).toBe('EURUSD');
  });
});
