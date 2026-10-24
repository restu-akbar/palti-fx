import assert from 'node:assert/strict';
import { Trade } from '../src/core/domain/trade';
import { reconcileUserData } from '../src/core/usecases/reconcileUserData';

const t = (id: string, date: string, pl = 1): Trade => ({
  id, date, symbol: 'EURUSD', direction: 'BUY', lot: 0.1, pl, createdAt: 1,
});

const r = reconcileUserData(
  { completed: { l1: true }, unlocked: { a1: 1 }, trades: [t('1', '2026-01-01')] },
  { completed: { l1: true, l2: true }, unlocked: { a2: 2 }, trades: [t('2', '2026-01-02')] }
);

assert.deepEqual(r.completed, { l1: true, l2: true });
assert.deepEqual(r.unlocked, { a1: 1, a2: 2 });
assert.deepEqual(r.trades.map((x) => x.id), ['2', '1']);
assert.deepEqual(r.uploads.lessons, ['l2']);
assert.deepEqual(r.uploads.achievements, [['a2', 2]]);
assert.deepEqual(r.uploads.trades.map((x) => x.id), ['2']);

const empty = reconcileUserData({ completed: {}, unlocked: {}, trades: [] }, { completed: {}, unlocked: undefined, trades: [] });
assert.deepEqual(empty.unlocked, {});
console.log('Semua tes reconcileUserData lulus ✓');
