import { afterEach, describe, expect, it, vi } from 'vitest';
import { fmt, fmtDate, parseNum, pct, signedUsd, todayIso, usd } from '../src/lib/format';

describe('parseNum', () => {
  it('menerima koma desimal dan spasi', () => {
    expect(parseNum('1,5')).toBe(1.5);
    expect(parseNum(' 1 000,5 ')).toBe(1000.5);
    expect(parseNum('12')).toBe(12);
  });
  it('mengembalikan NaN untuk input kosong atau tidak valid', () => {
    expect(parseNum('')).toBeNaN();
    expect(parseNum('   ')).toBeNaN();
    expect(parseNum('abc')).toBeNaN();
    expect(parseNum(null as unknown as string)).toBeNaN();
  });
});

describe('fmt', () => {
  it('memakai pemisah ribuan titik dan desimal koma', () => {
    expect(fmt(1234567.891)).toBe('1.234.567,89');
    expect(fmt(0)).toBe('0,00');
    expect(fmt(999.5, 0)).toBe('1.000');
    expect(fmt(12.3456, 3)).toBe('12,346');
  });
  it('menandai angka negatif', () => {
    expect(fmt(-1234.5)).toBe('-1.234,50');
  });
  it('menampilkan strip untuk nilai tidak valid', () => {
    expect(fmt(null)).toBe('—');
    expect(fmt(undefined)).toBe('—');
    expect(fmt(Infinity)).toBe('—');
    expect(fmt(NaN)).toBe('—');
  });
});

describe('usd, signedUsd, pct', () => {
  it('usd', () => {
    expect(usd(1234.5)).toBe('$1.234,50');
    expect(usd(-5)).toBe('-$5,00');
    expect(usd(null)).toBe('—');
  });
  it('signedUsd menambah plus hanya untuk nilai positif', () => {
    expect(signedUsd(5)).toBe('+$5,00');
    expect(signedUsd(0)).toBe('$0,00');
    expect(signedUsd(-5)).toBe('-$5,00');
    expect(signedUsd(undefined)).toBe('—');
  });
  it('pct', () => {
    expect(pct(0.1234)).toBe('12,3%');
    expect(pct(1, 0)).toBe('100%');
    expect(pct(NaN)).toBe('—');
  });
});

describe('tanggal', () => {
  afterEach(() => vi.useRealTimers());

  it('fmtDate memakai nama bulan Indonesia', () => {
    expect(fmtDate('2026-03-05T12:00:00')).toBe('5 Mar 2026');
    expect(fmtDate('2026-05-20T12:00:00')).toBe('20 Mei 2026');
    expect(fmtDate('2026-08-01T12:00:00')).toBe('1 Agu 2026');
  });
  it('fmtDate mengembalikan input bila tidak valid', () => {
    expect(fmtDate('bukan-tanggal')).toBe('bukan-tanggal');
  });
  it('todayIso memakai tanggal lokal dengan nol di depan', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 10, 0, 0));
    expect(todayIso()).toBe('2026-01-05');
  });
});
