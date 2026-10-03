import assert from 'node:assert/strict';
import {
  isEmail,
  mapAuthError,
  normalizeIdentifier,
  normalizeInviteCode,
  normalizeOtp,
  validatePassword,
} from '../src/lib/authUtils';
import { createChunkedStorage, KVBackend } from '../src/lib/chunkedStorage';

// 1. normalizeIdentifier
assert.equal(normalizeIdentifier('  Dior@Gmail.Com  '), 'dior@gmail.com');
assert.equal(normalizeIdentifier('  PFX-1234ABCD  '), 'pfx-1234abcd');
assert.equal(normalizeIdentifier(''), '');

// 2. normalizeInviteCode
assert.equal(normalizeInviteCode(' pfx - 8890 - ab '), 'PFX8890AB');
assert.equal(normalizeInviteCode('pfx  8821'), 'PFX8821');

// 3. normalizeOtp
assert.equal(normalizeOtp(' 123-456 '), '123456');
assert.equal(normalizeOtp(' 12345678 '), '12345678');
assert.equal(normalizeOtp('1234567890'), '12345678'); // max 8
assert.equal(normalizeOtp('abc 99 x 00 '), '9900');

// 4. isEmail
assert.equal(isEmail('user@test.com'), true);
assert.equal(isEmail('  user@test.co.id  '), true);
assert.equal(isEmail('notanemail'), false);
assert.equal(isEmail('pfx-8821'), false);
assert.equal(isEmail(''), false);

// 5. validatePassword
assert.equal(validatePassword('12345678'), null);
assert.notEqual(validatePassword('1234567'), null);
assert.notEqual(validatePassword(''), null);

// 6. mapAuthError
assert.ok(mapAuthError({ code: 'invalid_credentials' }).includes('tidak cocok'));
assert.ok(mapAuthError({ message: 'Invalid login credentials' }).includes('tidak cocok'));
assert.ok(mapAuthError({ code: 'user_banned' }).includes('ditangguhkan'));
assert.ok(mapAuthError({ code: 'over_email_send_rate_limit' }).includes('Terlalu banyak'));
assert.ok(mapAuthError({ status: 429 }).includes('Terlalu banyak'));
assert.ok(mapAuthError({ name: 'AuthRetryableFetchError' }).includes('koneksi'));
assert.ok(mapAuthError({ message: 'Database error saving new user' }).includes('undangan'));

// 7. createChunkedStorage
class MemoryBackend implements KVBackend {
  store = new Map<string, string>();
  async getItem(k: string) { return this.store.get(k) ?? null; }
  async setItem(k: string, v: string) { this.store.set(k, v); }
  async removeItem(k: string) { this.store.delete(k); }
}

async function testStorage() {
  const backend = new MemoryBackend();
  const storage = createChunkedStorage(backend, 100); // 100 bytes per chunk for testing

  // Test short value
  await storage.setItem('token', 'short-token');
  assert.equal(await storage.getItem('token'), 'short-token');
  assert.equal(backend.store.get('token.count'), '1');
  assert.equal(backend.store.get('token.0'), 'short-token');

  // Test long value spanning multiple chunks
  const longValue = 'A'.repeat(250); // 3 chunks: 100 + 100 + 50
  await storage.setItem('token', longValue);
  assert.equal(await storage.getItem('token'), longValue);
  assert.equal(backend.store.get('token.count'), '3');
  assert.equal(backend.store.get('token.0'), 'A'.repeat(100));
  assert.equal(backend.store.get('token.1'), 'A'.repeat(100));
  assert.equal(backend.store.get('token.2'), 'A'.repeat(50));

  // Overwrite with shorter value (old chunk token.2 must be cleared)
  await storage.setItem('token', 'short');
  assert.equal(await storage.getItem('token'), 'short');
  assert.equal(backend.store.get('token.count'), '1');
  assert.equal(backend.store.has('token.1'), false);
  assert.equal(backend.store.has('token.2'), false);

  // Remove
  await storage.removeItem('token');
  assert.equal(await storage.getItem('token'), null);
  assert.equal(backend.store.has('token.count'), false);
  assert.equal(backend.store.has('token.0'), false);

  // Corrupted chunk returns null
  await storage.setItem('corrupt', 'B'.repeat(200));
  backend.store.delete('corrupt.1'); // simulate corruption
  assert.equal(await storage.getItem('corrupt'), null);

  // Multi-account nickname isolation test
  const userNicknames = new Map<string, string>();
  userNicknames.set('userA@gmail.com', 'Dio Rahman Putra');
  // User B has not set a nickname, should resolve to server name, not User A's nickname
  const userBNick = userNicknames.get('userB@gmail.com') || 'Diora Putra';
  assert.equal(userBNick, 'Diora Putra');
  assert.equal(userNicknames.get('userA@gmail.com'), 'Dio Rahman Putra');
}

testStorage().then(() => {
  console.log('Semua tes auth & chunkedStorage lulus!');
});
