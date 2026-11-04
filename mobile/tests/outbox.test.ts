import { describe, expect, it } from 'vitest';
import {
  clearLesson, clearTrade, emptyOutbox, isOutboxEmpty, markLesson, markTrade, sanitizeOutbox,
} from '../src/core/domain/outbox';

describe('outbox', () => {
  it('menandai dan membersihkan operasi trade', () => {
    const o = markTrade(emptyOutbox(), 't1', 'upsert');
    expect(o.trades).toEqual({ t1: 'upsert' });
    expect(isOutboxEmpty(clearTrade(o, 't1', 'upsert'))).toBe(true);
  });

  it('operasi lebih baru tidak terhapus oleh penyelesaian operasi lama', () => {
    const o = markTrade(markTrade(emptyOutbox(), 't1', 'upsert'), 't1', 'delete');
    expect(clearTrade(o, 't1', 'upsert')).toBe(o);
    expect(clearTrade(o, 't1', 'delete').trades).toEqual({});
  });

  it('mencatat dan membersihkan status bab (termasuk pembatalan)', () => {
    const o = markLesson(emptyOutbox(), 'l1', false);
    expect(o.lessons).toEqual({ l1: false });
    expect(clearLesson(o, 'l1', true)).toBe(o);
    expect(isOutboxEmpty(clearLesson(o, 'l1', false))).toBe(true);
  });

  it('sanitizeOutbox tahan data rusak dan membuang nilai tidak valid', () => {
    expect(sanitizeOutbox(null)).toEqual(emptyOutbox());
    expect(sanitizeOutbox('x')).toEqual(emptyOutbox());
    expect(sanitizeOutbox({ trades: { a: 'upsert', b: 'zzz' }, lessons: { l: true, m: 'x' } })).toEqual({
      trades: { a: 'upsert' },
      lessons: { l: true },
    });
  });
});
