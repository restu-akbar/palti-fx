// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Settings } from '../src/core/domain/settings';
import type { Trade } from '../src/core/domain/trade';
import type { StoreDeps } from '../src/core/ports/storeDeps';
import type { UserCacheBundle } from '../src/core/ports/userCache';

vi.mock('../src/lib/defaultStoreDeps', () => ({ defaultStoreDeps: {} }));

import { StoreProvider, useStore } from '../src/lib/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Store = ReturnType<typeof useStore>;

const trade = (id: string, date = '2026-01-05', over: Partial<Trade> = {}): Trade => ({
  id, date, symbol: 'EURUSD', direction: 'BUY', lot: 0.1, pl: 1, createdAt: 1, ...over,
});

const emptyBundle = (over: Partial<UserCacheBundle> = {}): UserCacheBundle => ({
  trades: [], completed: {}, achievements: {}, settings: {}, ...over,
});

function makeDeps(opts: {
  device?: Settings;
  bundles?: Record<string, UserCacheBundle>;
  nicknames?: Record<string, string>;
  uid?: string | null;
  cloud?: { completed?: Record<string, boolean>; unlocked?: Record<string, number>; trades?: Trade[] };
} = {}) {
  const bundles = opts.bundles ?? {};
  const deps = {
    remote: {
      fetchUserData: vi.fn(async () => ({ completed: {}, unlocked: {}, trades: [], ...opts.cloud })),
      saveLessonProgress: vi.fn(async () => {}),
      saveAchievement: vi.fn(async () => {}),
      saveTrade: vi.fn(async () => {}),
      deleteTrade: vi.fn(async () => {}),
      updateProfileName: vi.fn(async () => {}),
    },
    cache: {
      loadAll: vi.fn(async (u?: string | null) => bundles[u ?? 'guest'] ?? emptyBundle()),
      saveTrades: vi.fn(async () => {}),
      saveCompleted: vi.fn(async () => {}),
      saveAchievements: vi.fn(async () => {}),
      saveSettings: vi.fn(async () => {}),
    },
    currentUserId: vi.fn(async () => (opts.uid === undefined ? 'uid-1' : opts.uid)),
    signOutLocal: vi.fn(),
    getNickname: vi.fn(async (u: string) => opts.nicknames?.[u] ?? null),
    setNickname: vi.fn(async () => {}),
    loadDeviceSettings: vi.fn(async () => opts.device ?? {}),
    saveDeviceSettings: vi.fn(),
  };
  return deps satisfies StoreDeps;
}

let root: Root;
let container: HTMLElement;
let latest: Store;

function Probe() {
  latest = useStore();
  return null;
}

async function mount(deps: StoreDeps) {
  container = document.createElement('div');
  root = createRoot(container);
  await act(async () => {
    root.render(
      <StoreProvider deps={deps}>
        <Probe />
      </StoreProvider>
    );
  });
  await act(async () => {
    await vi.waitFor(() => expect(latest.ready).toBe(true));
  });
}

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.restoreAllMocks();
});

describe('StoreProvider: inisialisasi', () => {
  it('memuat pengaturan perangkat, cache akun aktif, dan nickname aman', async () => {
    const deps = makeDeps({
      device: { welcomed: true, isLoggedIn: false, activeUser: 'dio@mail.com', name: 'Lama' },
      bundles: {
        'dio@mail.com': emptyBundle({
          trades: [trade('t1')],
          completed: { l1: true },
          achievements: { a1: 5 },
          settings: { balance: '1000' },
        }),
      },
      nicknames: { 'dio@mail.com': 'Dio' },
    });

    await mount(deps);

    expect(latest.trades.map((t) => t.id)).toEqual(['t1']);
    expect(latest.completed).toEqual({ l1: true });
    expect(latest.settings).toMatchObject({
      welcomed: true, activeUser: 'dio@mail.com', name: 'Dio', balance: '1000', unlocked: { a1: 5 },
    });
    expect(deps.cache.loadAll).toHaveBeenCalledWith('dio@mail.com');
  });

  it('sinkron dari cloud otomatis hanya bila sudah login', async () => {
    const loggedOut = makeDeps({ device: { isLoggedIn: false } });
    await mount(loggedOut);
    expect(loggedOut.remote.fetchUserData).not.toHaveBeenCalled();
    await act(async () => root.unmount());

    const loggedIn = makeDeps({ device: { isLoggedIn: true, activeUser: 'a@b.com' } });
    await mount(loggedIn);
    await flush();
    expect(loggedIn.remote.fetchUserData).toHaveBeenCalledWith('uid-1');
  });
});

describe('StoreProvider: trade', () => {
  it('saveTrade menambah, mengurutkan, menyimpan ke cache akun aktif, dan mengunggah', async () => {
    const deps = makeDeps({ device: { activeUser: 'a@b.com' } });
    await mount(deps);

    await act(async () => {
      latest.saveTrade({ date: '2026-01-05', symbol: 'EURUSD', direction: 'BUY', lot: 0.1, pl: 5 });
    });
    await flush();

    expect(latest.trades).toHaveLength(1);
    const saved = latest.trades[0];
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeGreaterThan(0);
    expect(deps.cache.saveTrades).toHaveBeenCalledWith('a@b.com', [saved]);
    expect(deps.remote.saveTrade).toHaveBeenCalledWith('uid-1', saved);
  });

  it('dua saveTrade berturut-turut dalam satu batch sama-sama tersimpan', async () => {
    const deps = makeDeps();
    await mount(deps);

    await act(async () => {
      latest.saveTrade({ id: 'a', date: '2026-01-05', symbol: 'X', direction: 'BUY', lot: 1, pl: 1 });
      latest.saveTrade({ id: 'b', date: '2026-01-06', symbol: 'X', direction: 'BUY', lot: 1, pl: 1 });
    });

    expect(latest.trades.map((t) => t.id)).toEqual(['b', 'a']);
    expect(deps.cache.saveTrades).toHaveBeenLastCalledWith(undefined, latest.trades);
  });

  it('saveTrade dengan id yang sama mengganti, bukan menggandakan', async () => {
    const deps = makeDeps({ device: { activeUser: 'u' }, bundles: { u: emptyBundle({ trades: [trade('t1', '2026-01-05', { pl: 1 })] }) } });
    await mount(deps);

    await act(async () => {
      latest.saveTrade({ ...trade('t1'), pl: 99 });
    });

    expect(latest.trades).toHaveLength(1);
    expect(latest.trades[0].pl).toBe(99);
  });

  it('tanpa sesi cloud trade hanya disimpan lokal', async () => {
    const deps = makeDeps({ uid: null });
    await mount(deps);
    await act(async () => {
      latest.saveTrade({ id: 'a', date: '2026-01-05', symbol: 'X', direction: 'BUY', lot: 1, pl: 1 });
    });
    await flush();
    expect(deps.cache.saveTrades).toHaveBeenCalled();
    expect(deps.remote.saveTrade).not.toHaveBeenCalled();
  });

  it('deleteTrade menghapus lokal dan di cloud', async () => {
    const deps = makeDeps({ device: { activeUser: 'u' }, bundles: { u: emptyBundle({ trades: [trade('t1'), trade('t2')] }) } });
    await mount(deps);

    await act(async () => latest.deleteTrade('t1'));
    await flush();

    expect(latest.trades.map((t) => t.id)).toEqual(['t2']);
    expect(deps.cache.saveTrades).toHaveBeenCalledWith('u', latest.trades);
    expect(deps.remote.deleteTrade).toHaveBeenCalledWith('uid-1', 't1');
  });
});

describe('StoreProvider: progres bab', () => {
  it('toggleLesson membalik status dan menyinkronkan', async () => {
    const deps = makeDeps({ device: { activeUser: 'u' } });
    await mount(deps);

    await act(async () => latest.toggleLesson('l1'));
    await flush();
    expect(latest.completed).toEqual({ l1: true });
    expect(deps.remote.saveLessonProgress).toHaveBeenLastCalledWith('uid-1', 'l1', true);

    await act(async () => latest.toggleLesson('l1'));
    await flush();
    expect(latest.completed).toEqual({ l1: false });
    expect(deps.remote.saveLessonProgress).toHaveBeenLastCalledWith('uid-1', 'l1', false);
    expect(deps.cache.saveCompleted).toHaveBeenLastCalledWith('u', { l1: false });
  });

  it('toggleLesson dengan nilai eksplisit tidak membalik', async () => {
    const deps = makeDeps();
    await mount(deps);
    await act(async () => latest.toggleLesson('l1', true));
    await act(async () => latest.toggleLesson('l1', true));
    expect(latest.completed).toEqual({ l1: true });
  });
});

describe('StoreProvider: updateSettings', () => {
  it('menyimpan pengaturan perangkat tanpa data per-akun', async () => {
    const deps = makeDeps();
    await mount(deps);

    await act(async () => latest.updateSettings({ welcomed: true, balance: '500' }));

    expect(latest.settings).toMatchObject({ welcomed: true, balance: '500' });
    expect(deps.saveDeviceSettings).toHaveBeenLastCalledWith({
      welcomed: true, isLoggedIn: undefined, activeUser: undefined, role: undefined, name: undefined,
    });
  });

  it('preferensi trading disimpan per akun dengan nilai lama sebagai pelengkap', async () => {
    const deps = makeDeps({ device: { activeUser: 'u' }, bundles: { u: emptyBundle({ settings: { balance: '1000', leverage: '100' } }) } });
    await mount(deps);

    await act(async () => latest.updateSettings({ riskPercent: '2' }));

    expect(deps.cache.saveSettings).toHaveBeenCalledWith('u', {
      balance: '1000', riskPercent: '2', leverage: '100', lastSymbol: undefined, lotCalcCount: undefined,
    });
  });

  it('pengaturan non-trading tidak menyentuh cache preferensi', async () => {
    const deps = makeDeps();
    await mount(deps);
    await act(async () => latest.updateSettings({ welcomed: true }));
    expect(deps.cache.saveSettings).not.toHaveBeenCalled();
  });

  it('mengganti nama menyimpan nickname dan memperbarui profil cloud', async () => {
    const deps = makeDeps({ device: { activeUser: 'u' } });
    await mount(deps);

    await act(async () => latest.updateSettings({ name: 'Dio' }));
    await flush();

    expect(deps.setNickname).toHaveBeenCalledWith('u', 'Dio');
    expect(deps.remote.updateProfileName).toHaveBeenCalledWith('uid-1', 'Dio');
  });

  it('medali baru disimpan lokal dan diunggah satu per satu', async () => {
    const deps = makeDeps({ device: { activeUser: 'u' } });
    await mount(deps);

    await act(async () => latest.updateSettings({ unlocked: { a1: 1, a2: 2 } }));
    await flush();

    expect(deps.cache.saveAchievements).toHaveBeenCalledWith('u', { a1: 1, a2: 2 });
    expect(deps.remote.saveAchievement).toHaveBeenCalledTimes(2);
    expect(deps.remote.saveAchievement).toHaveBeenCalledWith('uid-1', 'a1', 1);
  });

  it('pergantian akun memuat cache akun baru tanpa menulis ke akun lama', async () => {
    const deps = makeDeps({
      device: { activeUser: 'a@x.com', isLoggedIn: true },
      bundles: {
        'a@x.com': emptyBundle({ trades: [trade('milik-a')] }),
        'b@x.com': emptyBundle({ trades: [trade('milik-b')], completed: { l9: true } }),
      },
      nicknames: { 'b@x.com': 'Bobi' },
    });
    await mount(deps);
    await flush();
    deps.cache.saveTrades.mockClear();
    deps.cache.saveCompleted.mockClear();

    await act(async () => latest.updateSettings({ activeUser: 'b@x.com', name: 'Bobi' }));
    await flush();

    expect(latest.trades.map((t) => t.id)).toEqual(['milik-b']);
    expect(latest.completed).toEqual({ l9: true });
    expect(latest.settings.activeUser).toBe('b@x.com');
    expect(deps.cache.saveTrades).not.toHaveBeenCalledWith('a@x.com', expect.anything());

    await act(async () => latest.saveTrade({ id: 'baru', date: '2026-02-01', symbol: 'X', direction: 'BUY', lot: 1, pl: 1 }));
    expect(deps.cache.saveTrades).toHaveBeenLastCalledWith('b@x.com', expect.any(Array));
  });
});

describe('StoreProvider: logout', () => {
  it('membersihkan state memori tanpa menghapus cache akun', async () => {
    const deps = makeDeps({
      device: { welcomed: true, isLoggedIn: true, activeUser: 'u', role: 'member', name: 'Dio' },
      bundles: { u: emptyBundle({ trades: [trade('t1')], completed: { l1: true } }) },
    });
    await mount(deps);
    await flush();
    deps.cache.saveTrades.mockClear();
    deps.cache.saveCompleted.mockClear();

    await act(async () => latest.logout());

    expect(deps.signOutLocal).toHaveBeenCalled();
    expect(latest.trades).toEqual([]);
    expect(latest.completed).toEqual({});
    expect(latest.settings).toEqual({
      welcomed: true, isLoggedIn: false, role: undefined, name: undefined, activeUser: undefined, unlocked: {},
    });
    expect(deps.saveDeviceSettings).toHaveBeenLastCalledWith(latest.settings);
    expect(deps.cache.saveTrades).not.toHaveBeenCalled();
    expect(deps.cache.saveCompleted).not.toHaveBeenCalled();
  });

  it('welcomed bawaan true bila belum pernah diset', async () => {
    const deps = makeDeps();
    await mount(deps);
    await act(async () => latest.logout());
    expect(latest.settings.welcomed).toBe(true);
  });
});

describe('StoreProvider: syncFromCloud', () => {
  it('menggabungkan, menyimpan cache, dan mengunggah data lokal yang belum ada di cloud', async () => {
    const deps = makeDeps({
      device: { activeUser: 'u' },
      bundles: { u: emptyBundle({ trades: [trade('lokal')], completed: { l2: true }, achievements: { a2: 2 } }) },
      cloud: { trades: [trade('cloud', '2026-01-09')], completed: { l1: true }, unlocked: { a1: 1 } },
    });
    await mount(deps);

    await act(async () => latest.syncFromCloud());

    expect(latest.trades.map((t) => t.id)).toEqual(['cloud', 'lokal']);
    expect(latest.completed).toEqual({ l1: true, l2: true });
    expect(latest.settings.unlocked).toEqual({ a1: 1, a2: 2 });
    expect(deps.remote.saveTrade).toHaveBeenCalledTimes(1);
    expect(deps.remote.saveTrade).toHaveBeenCalledWith('uid-1', expect.objectContaining({ id: 'lokal' }));
    expect(deps.remote.saveLessonProgress).toHaveBeenCalledWith('uid-1', 'l2', true);
    expect(deps.remote.saveAchievement).toHaveBeenCalledWith('uid-1', 'a2', 2);
    expect(deps.cache.saveTrades).toHaveBeenLastCalledWith('u', latest.trades);
  });

  it('tanpa sesi cloud tidak melakukan apa pun', async () => {
    const deps = makeDeps({ uid: null });
    await mount(deps);
    await act(async () => latest.syncFromCloud());
    expect(deps.remote.fetchUserData).not.toHaveBeenCalled();
  });

  it('userId eksplisit dipakai tanpa bertanya ke sesi', async () => {
    const deps = makeDeps({ uid: null });
    await mount(deps);
    await act(async () => latest.syncFromCloud('uid-x'));
    expect(deps.remote.fetchUserData).toHaveBeenCalledWith('uid-x');
  });

  it('kegagalan fetch tidak mengubah state lokal', async () => {
    const deps = makeDeps({ device: { activeUser: 'u' }, bundles: { u: emptyBundle({ trades: [trade('t1')] }) } });
    await mount(deps);
    deps.remote.fetchUserData.mockRejectedValueOnce(new Error('offline'));

    await act(async () => latest.syncFromCloud());

    expect(latest.trades.map((t) => t.id)).toEqual(['t1']);
  });
});

describe('useStore', () => {
  it('melempar error di luar provider', () => {
    function Lone() {
      useStore();
      return null;
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const el = document.createElement('div');
    const r = createRoot(el);
    expect(() => act(() => r.render(<Lone />))).toThrow(/StoreProvider/);
    spy.mockRestore();
  });
});
