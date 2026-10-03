import assert from 'node:assert/strict';
import { normalizeUserKey } from '../src/lib/achievementStorage';

// 1. normalizeUserKey tests
assert.equal(normalizeUserKey('  UserA@Gmail.Com  '), 'usera@gmail.com');
assert.equal(normalizeUserKey('PFX-12345678'), 'pfx-12345678');
assert.equal(normalizeUserKey(''), 'guest');
assert.equal(normalizeUserKey(null), 'guest');
assert.equal(normalizeUserKey(undefined), 'guest');

// 2. Simulasi isolasi data per akun
const mockStorage = new Map<string, string>();
const getKey = (user?: string | null) => `@pfx_achievements_user_${normalizeUserKey(user)}`;

function mockSave(user: string | null | undefined, unlocked: Record<string, number>) {
  mockStorage.set(getKey(user), JSON.stringify(unlocked));
}

function mockGet(user: string | null | undefined): Record<string, number> {
  const raw = mockStorage.get(getKey(user));
  return raw ? JSON.parse(raw) : {};
}

// User A unlocks 'first-trade'
mockSave('userA@gmail.com', { 'first-trade': 1700000000000 });

// User B unlocks 'five-trades' and 'welcome'
mockSave('userB@gmail.com', { 'five-trades': 1700000005000, 'welcome': 1700000006000 });

// Verify User A still has only 'first-trade'
const userAAch = mockGet('userA@gmail.com');
assert.deepEqual(Object.keys(userAAch), ['first-trade']);
assert.equal(userAAch['first-trade'], 1700000000000);

// Verify User B has 'five-trades' and 'welcome'
const userBAch = mockGet('userB@gmail.com');
assert.deepEqual(Object.keys(userBAch).sort(), ['five-trades', 'welcome'].sort());

// Verify switching between accounts does NOT overwrite each other
assert.notDeepEqual(userAAch, userBAch);

// Verify case insensitivity in account identifier
assert.deepEqual(mockGet('  USERA@GMAIL.COM '), userAAch);

console.log('Semua tes achievementStorage & isolasi akun lulus ✓');
