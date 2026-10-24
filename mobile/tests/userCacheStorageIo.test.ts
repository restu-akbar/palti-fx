import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Trade } from '../src/core/domain/trade';

const { storage, failures } = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  failures: { get: false, set: false },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => {
      if (failures.get) throw new Error('read fail');
      return storage.get(k) ?? null;
    },
    setItem: async (k: string, v: string) => {
      if (failures.set) throw new Error('write fail');
      storage.set(k, v);
    },
  },
}));

import {
  getLocalAchievementsForUser,
  getLocalCompletedForUser,
  getLocalSettingsForUser,
  getLocalTradesForUser,
  getUserStorageKey,
  LEGACY_KEYS,
  loadAllUserData,
  saveLocalAchievementsForUser,
  saveLocalCompletedForUser,
  saveLocalSettingsForUser,
  saveLocalTradesForUser,
} from '../src/lib/userCacheStorage';

const trade = (id: string): Trade => ({
  id, date: '2026-01-05', symbol: 'EURUSD', direction: 'BUY', lot: 0.1, pl: 1, createdAt: 1,
});

beforeEach(() => {
  storage.clear();
  failures.get = false;
  failures.set = false;
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('userCacheStorage I/O', () => {
  it('data setiap akun terpisah dan kunci tidak peka huruf besar', async () => {
    await saveLocalTradesForUser('A@x.com', [trade('a')]);
    await saveLocalTradesForUser('b@x.com', [trade('b')]);

    expect((await getLocalTradesForUser('a@X.com')).map((t) => t.id)).toEqual(['a']);
    expect((await getLocalTradesForUser('b@x.com')).map((t) => t.id)).toEqual(['b']);
    expect(await getLocalTradesForUser('c@x.com')).toEqual([]);
  });

  it('menyimpan dan membaca progres, medali, dan preferensi', async () => {
    await saveLocalCompletedForUser('u', { l1: true });
    await saveLocalAchievementsForUser('u', { a1: 5 });
    await saveLocalSettingsForUser('u', { balance: '100' });

    expect(await getLocalCompletedForUser('u')).toEqual({ l1: true });
    expect(await getLocalAchievementsForUser('u')).toEqual({ a1: 5 });
    expect(await getLocalSettingsForUser('u')).toEqual({ balance: '100' });
  });

  it('nilai kosong untuk akun yang belum punya data', async () => {
    expect(await getLocalCompletedForUser('baru')).toEqual({});
    expect(await getLocalAchievementsForUser('baru')).toEqual({});
    expect(await getLocalSettingsForUser('baru')).toEqual({});
  });

  it('memigrasikan trade legacy ke partisi akun pertama yang membacanya', async () => {
    storage.set(LEGACY_KEYS.trades, JSON.stringify([trade('lama')]));

    const first = await getLocalTradesForUser('u');

    expect(first.map((t) => t.id)).toEqual(['lama']);
    expect(storage.get(getUserStorageKey('trades', 'u'))).toBe(JSON.stringify([trade('lama')]));
  });

  it('legacy kosong tidak dimigrasikan', async () => {
    storage.set(LEGACY_KEYS.trades, '[]');
    storage.set(LEGACY_KEYS.completed, '{}');
    expect(await getLocalTradesForUser('u')).toEqual([]);
    expect(await getLocalCompletedForUser('u')).toEqual({});
    expect(storage.has(getUserStorageKey('trades', 'u'))).toBe(false);
  });

  it('memigrasikan progres dan preferensi legacy', async () => {
    storage.set(LEGACY_KEYS.completed, JSON.stringify({ l1: true }));
    storage.set(LEGACY_KEYS.settings, JSON.stringify({ balance: '500', riskPercent: '2', name: 'tidak ikut' }));

    expect(await getLocalCompletedForUser('u')).toEqual({ l1: true });
    expect(await getLocalSettingsForUser('u')).toEqual({
      balance: '500', riskPercent: '2', leverage: undefined, lastSymbol: undefined, lotCalcCount: undefined,
    });
  });

  it('data milik akun tidak tertimpa legacy', async () => {
    storage.set(LEGACY_KEYS.trades, JSON.stringify([trade('lama')]));
    await saveLocalTradesForUser('u', [trade('baru')]);
    expect((await getLocalTradesForUser('u')).map((t) => t.id)).toEqual(['baru']);
  });

  it('loadAllUserData memuat keempat kategori sekaligus', async () => {
    await saveLocalTradesForUser('u', [trade('t')]);
    await saveLocalCompletedForUser('u', { l1: true });
    await saveLocalAchievementsForUser('u', { a1: 1 });
    await saveLocalSettingsForUser('u', { leverage: '100' });

    expect(await loadAllUserData('u')).toEqual({
      trades: [trade('t')],
      completed: { l1: true },
      achievements: { a1: 1 },
      settings: { leverage: '100' },
    });
  });

  it('kegagalan baca/tulis tidak melempar dan memberi nilai kosong', async () => {
    failures.get = true;
    expect(await loadAllUserData('u')).toEqual({ trades: [], completed: {}, achievements: {}, settings: {} });
    failures.set = true;
    await expect(saveLocalTradesForUser('u', [])).resolves.toBeUndefined();
    await expect(saveLocalCompletedForUser('u', {})).resolves.toBeUndefined();
    await expect(saveLocalAchievementsForUser('u', {})).resolves.toBeUndefined();
    await expect(saveLocalSettingsForUser('u', {})).resolves.toBeUndefined();
  });

  it('JSON rusak dibaca sebagai kosong', async () => {
    storage.set(getUserStorageKey('trades', 'u'), '{rusak');
    expect(await getLocalTradesForUser('u')).toEqual([]);
  });
});
