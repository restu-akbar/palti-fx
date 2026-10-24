import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSupabase } from './helpers/fakeSupabase';

const { storage } = vi.hoisted(() => ({ storage: new Map<string, string>() }));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => storage.get(k) ?? null,
    setItem: async (k: string, v: string) => void storage.set(k, v),
    removeItem: async (k: string) => void storage.delete(k),
  },
}));
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('expo-secure-store', () => ({}));
vi.mock('../src/lib/supabase', async () => {
  const { createFakeSupabase } = await import('./helpers/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { supabase as client } from '../src/lib/supabase';
import { defaultStoreDeps } from '../src/lib/defaultStoreDeps';
import { UserSyncService } from '../src/lib/userSyncService';

const supabase = client as unknown as FakeSupabase;

beforeEach(() => {
  supabase.reset();
  storage.clear();
});

describe('defaultStoreDeps', () => {
  it('remote adalah UserSyncService', () => {
    expect(defaultStoreDeps.remote).toBe(UserSyncService);
  });

  it('currentUserId mengambil id dari sesi Supabase, null bila gagal', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null } as never);
    expect(await defaultStoreDeps.currentUserId()).toBe('u1');

    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as never);
    expect(await defaultStoreDeps.currentUserId()).toBeNull();

    supabase.auth.getUser.mockRejectedValue(new Error('offline'));
    expect(await defaultStoreDeps.currentUserId()).toBeNull();
  });

  it('signOutLocal hanya mengakhiri sesi lokal dan tidak melempar', () => {
    supabase.auth.signOut.mockRejectedValue(new Error('x'));
    expect(() => defaultStoreDeps.signOutLocal()).not.toThrow();
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('pengaturan perangkat disimpan di kunci lama agar data pengguna tetap terbaca', async () => {
    expect(await defaultStoreDeps.loadDeviceSettings()).toEqual({});
    defaultStoreDeps.saveDeviceSettings({ welcomed: true, activeUser: 'u' });
    await Promise.resolve();
    expect(JSON.parse(storage.get('pfx.settings.v1')!)).toEqual({ welcomed: true, activeUser: 'u' });
    expect(await defaultStoreDeps.loadDeviceSettings()).toEqual({ welcomed: true, activeUser: 'u' });
  });

  it('pengaturan perangkat rusak dibaca sebagai kosong', async () => {
    storage.set('pfx.settings.v1', '{rusak');
    expect(await defaultStoreDeps.loadDeviceSettings()).toEqual({});
  });

  it('cache memakai fungsi userCacheStorage per akun', async () => {
    await defaultStoreDeps.cache.saveCompleted('U@x.com', { l1: true });
    expect((await defaultStoreDeps.cache.loadAll('u@x.com')).completed).toEqual({ l1: true });
  });
});
