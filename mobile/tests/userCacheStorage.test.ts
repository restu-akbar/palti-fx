import assert from 'node:assert/strict';
import {
  normalizeUserKey,
  getUserStorageKey,
} from '../src/lib/userCacheStorage';
import type { Trade } from '../src/lib/store';

async function run() {
  // 1. Normalisasi user key
  assert.equal(normalizeUserKey('UserA@gmail.com'), 'usera@gmail.com');
  assert.equal(normalizeUserKey('  UserB@Domain.COM  '), 'userb@domain.com');
  assert.equal(normalizeUserKey('PFX-98765432'), 'pfx-98765432');
  assert.equal(normalizeUserKey(''), 'guest');
  assert.equal(normalizeUserKey(null), 'guest');
  assert.equal(normalizeUserKey(undefined), 'guest');

  // 2. Storage key generation
  assert.equal(getUserStorageKey('trades', 'UserA@gmail.com'), '@pfx_user_trades_usera@gmail.com');
  assert.equal(getUserStorageKey('completed', 'UserA@gmail.com'), '@pfx_user_completed_usera@gmail.com');
  assert.equal(getUserStorageKey('achievements', 'UserA@gmail.com'), '@pfx_achievements_user_usera@gmail.com');
  assert.equal(getUserStorageKey('settings', 'UserA@gmail.com'), '@pfx_user_settings_usera@gmail.com');
  assert.equal(getUserStorageKey('trades', null), '@pfx_user_trades_guest');

  // 3. Simulasi penyimpanan terisolasi per akun (AsyncStorage mock)
  const mockAsyncStorage = new Map<string, string>();

  async function mockSaveTrades(user: string | null | undefined, trades: Trade[]) {
    const key = getUserStorageKey('trades', user);
    mockAsyncStorage.set(key, JSON.stringify(trades));
  }

  async function mockGetTrades(user: string | null | undefined): Promise<Trade[]> {
    const key = getUserStorageKey('trades', user);
    const raw = mockAsyncStorage.get(key);
    return raw ? JSON.parse(raw) : [];
  }

  async function mockSaveCompleted(user: string | null | undefined, completed: Record<string, boolean>) {
    const key = getUserStorageKey('completed', user);
    mockAsyncStorage.set(key, JSON.stringify(completed));
  }

  async function mockGetCompleted(user: string | null | undefined): Promise<Record<string, boolean>> {
    const key = getUserStorageKey('completed', user);
    const raw = mockAsyncStorage.get(key);
    return raw ? JSON.parse(raw) : {};
  }

  // Skenario: User 1 (Trader A) mencatat jurnal trade
  const tradeA1: Trade = { id: 't-a1', date: '2026-10-01', symbol: 'XAUUSD', direction: 'BUY', lot: 0.1, pl: 50, createdAt: 1000 };
  const tradeA2: Trade = { id: 't-a2', date: '2026-10-02', symbol: 'EURUSD', direction: 'SELL', lot: 0.2, pl: -20, createdAt: 2000 };
  await mockSaveTrades('traderA@palti.id', [tradeA1, tradeA2]);
  await mockSaveCompleted('traderA@palti.id', { 'lesson-1': true, 'lesson-2': true });

  // Skenario: User 2 (Trader B) mencatat jurnal trade berbeda
  const tradeB1: Trade = { id: 't-b1', date: '2026-10-05', symbol: 'GBPUSD', direction: 'BUY', lot: 0.05, pl: 120, createdAt: 3000 };
  await mockSaveTrades('traderB@palti.id', [tradeB1]);
  await mockSaveCompleted('traderB@palti.id', { 'lesson-5': true });

  // Validasi Akun A tidak tertimpa data Akun B
  const tradesA = await mockGetTrades('traderA@palti.id');
  assert.equal(tradesA.length, 2);
  assert.equal(tradesA[0].id, 't-a1');
  assert.equal(tradesA[1].id, 't-a2');

  const completedA = await mockGetCompleted('traderA@palti.id');
  assert.deepEqual(completedA, { 'lesson-1': true, 'lesson-2': true });

  // Validasi Akun B memiliki data tersendiri
  const tradesB = await mockGetTrades('traderB@palti.id');
  assert.equal(tradesB.length, 1);
  assert.equal(tradesB[0].id, 't-b1');

  const completedB = await mockGetCompleted('traderB@palti.id');
  assert.deepEqual(completedB, { 'lesson-5': true });

  // Skenario: Logout Akun A
  // Sesuai requirement, saat logout in-memory state dikosongkan tapi AsyncStorage milik Akun A TIDAK BOLEH dihapus!
  let inMemoryTrades: Trade[] = [...tradesA];
  inMemoryTrades = []; // Cleared in-memory
  assert.equal(inMemoryTrades.length, 0);

  // Storage di disk untuk Akun A tetap utuh
  const persistentTradesAAfterLogout = await mockGetTrades('traderA@palti.id');
  assert.equal(persistentTradesAAfterLogout.length, 2, 'Data cache Akun A di lokal tidak boleh dihapus saat logout');

  // Skenario: Akun B login kembali -> datanya tetap utuh
  const persistentTradesB = await mockGetTrades('traderB@palti.id');
  assert.equal(persistentTradesB.length, 1);
  assert.equal(persistentTradesB[0].symbol, 'GBPUSD');

  // Skenario: Akun A login kembali -> datanya langsung terbaca dari lokal cache
  const reloadedTradesA = await mockGetTrades('traderA@palti.id');
  assert.equal(reloadedTradesA.length, 2);
  assert.equal(reloadedTradesA[0].symbol, 'XAUUSD');

  // Case insensitivity
  const reloadCaseInsensitive = await mockGetTrades('  TRADERA@PALTI.ID  ');
  assert.equal(reloadCaseInsensitive.length, 2);

  console.log('Semua tes isolasi userCacheStorage & perpindahan akun lulus ✓');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
