import assert from 'node:assert/strict';
import { ACHIEVEMENTS, computeStreak, isUnlocked } from '../src/lib/achievements';
import type { Trade } from '../src/lib/store';

const t = (date: string, pl = 10): Trade => ({ id: date + pl, date, symbol: 'XAUUSD', direction: 'BUY', lot: 0.01, pl, createdAt: 0 });
const wed = new Date(2026, 8, 30, 15); // Rabu 30 Sep 2026

assert.equal(computeStreak([], wed).current, 0);
// Senin & Selasa tercatat, Rabu (hari ini) belum → streak 2, belum putus
assert.equal(computeStreak([t('2026-09-28'), t('2026-09-29')], wed).current, 2);
// Jumat + Senin + Selasa → akhir pekan tidak memutus → 3
let s = computeStreak([t('2026-09-25'), t('2026-09-28'), t('2026-09-29')], wed);
assert.equal(s.current, 3);
// termasuk hari ini → 4, today=true
s = computeStreak([t('2026-09-25'), t('2026-09-28'), t('2026-09-29'), t('2026-09-30')], wed);
assert.equal(s.current, 4); assert.equal(s.today, true);
// Selasa kosong → putus, hanya Rabu dihitung
assert.equal(computeStreak([t('2026-09-28'), t('2026-09-30')], wed).current, 1);
// Senin kemarin bolong (hari ini Rabu, terakhir Senin) → 0
assert.equal(computeStreak([t('2026-09-28')], wed).current, 0);
// best streak dari masa lalu
s = computeStreak([t('2026-09-14'), t('2026-09-15'), t('2026-09-16'), t('2026-09-17'), t('2026-09-29')], wed);
assert.equal(s.best, 4); assert.equal(s.current, 1);
// catatan di hari Minggu tetap dihitung
const sun = new Date(2026, 8, 27, 15);
assert.equal(computeStreak([t('2026-09-27')], sun).current, 1);
assert.equal(computeStreak([t('2026-09-25'), t('2026-09-27')], sun).current, 2);
// Sabtu: streak Jumat tetap berjalan
const sat = new Date(2026, 9, 3, 10);
assert.equal(computeStreak([t('2026-10-01'), t('2026-10-02')], sat).current, 2);
// minggu ini: Sen..Jum
assert.deepEqual(computeStreak([t('2026-09-28')], wed).week.map((w) => w.done), [true, false, false, false, false]);

// achievements
const ctx = { trades: [t('2026-09-28')], completed: {}, settings: { welcomed: true }, streakBest: 1 };
const un = ACHIEVEMENTS.filter((a) => isUnlocked(a, ctx)).map((a) => a.id);
assert.deepEqual(un.sort(), ['first-trade', 'first-win', 'welcome'].sort());
console.log('Tes streak & pencapaian lulus ✓');
