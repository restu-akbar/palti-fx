import assert from 'node:assert/strict';
import { mergeCompleted, mergeTrades, mergeUnlocked } from '../src/core/domain/syncMerge';
import { computeStats, upsertTrade, Trade } from '../src/core/domain/trade';

const t = (id: string, date: string, createdAt: number, pl = 1): Trade => ({
  id, date, symbol: 'EURUSD', direction: 'BUY', lot: 0.1, pl, createdAt,
});

{
  const r = mergeCompleted({ a: true }, { a: true, b: true, c: false });
  assert.deepEqual(r.merged, { a: true, b: true, c: false });
  assert.deepEqual(r.toUpload, ['b']);
}

{
  const r = mergeUnlocked({ x: 1 }, { x: 9, y: 2 });
  assert.deepEqual(r.merged, { x: 9, y: 2 });
  assert.deepEqual(r.toUpload, [['y', 2]]);
  assert.deepEqual(mergeUnlocked({ x: 1 }, undefined).merged, { x: 1 });
}

{
  const cloud = [t('1', '2026-01-01', 1, 5), t('2', '2026-01-02', 1)];
  const local = [t('1', '2026-01-01', 1, 9), t('3', '2026-01-02', 5)];
  const r = mergeTrades(cloud, local);
  assert.deepEqual(r.merged.map((x) => x.id), ['3', '2', '1']);
  assert.equal(r.merged.find((x) => x.id === '1')!.pl, 9);
  assert.deepEqual(r.toUpload.map((x) => x.id), ['3']);
}

{
  const base = [t('1', '2026-01-01', 1)];
  const out = upsertTrade(base, t('1', '2026-01-01', 1, 7));
  assert.equal(out.length, 1);
  assert.equal(out[0].pl, 7);
  assert.equal(base[0].pl, 1);
  assert.equal(upsertTrade(base, t('2', '2026-02-01', 1))[0].id, '2');
}

assert.equal(computeStats([t('1', '2026-01-01', 1, 10), t('2', '2026-01-02', 1, -5)]).net, 5);
console.log('Semua tes syncMerge & domain trade lulus ✓');
