import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { appStateHandlers } = vi.hoisted(() => ({
  appStateHandlers: [] as Array<(s: string) => void>,
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: { addEventListener: (_e: string, h: (s: string) => void) => void appStateHandlers.push(h) },
}));

type Svc = typeof import('../src/lib/networkService').NetworkService;

async function load(fetchImpl: () => Promise<unknown>): Promise<Svc> {
  vi.resetModules();
  appStateHandlers.length = 0;
  vi.stubGlobal('fetch', vi.fn(fetchImpl));
  const mod = await import('../src/lib/networkService');
  return mod.NetworkService;
}

const ok = () => Promise.resolve({ status: 204, type: 'basic' });
const fail = () => Promise.reject(new Error('net'));

describe('NetworkService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('online saat salah satu endpoint merespons', async () => {
    const svc = await load(ok);
    expect(await svc.checkConnectivity()).toBe(true);
    expect(svc.isOnline()).toBe(true);
  });

  it('offline saat semua endpoint gagal dan memberi tahu subscriber', async () => {
    const svc = await load(fail);
    await vi.advanceTimersByTimeAsync(0);
    expect(svc.isOnline()).toBe(false);
    const seen: boolean[] = [];
    const unsub = svc.subscribe((v) => seen.push(v));
    svc.notifyOnline();
    expect(seen).toEqual([false, true]);
    unsub();
    await svc.checkConnectivity();
    expect(seen).toEqual([false, true]);
    expect(svc.isOnline()).toBe(false);
  });

  it('notifyOffline memverifikasi dulu: tetap online bila ping berhasil', async () => {
    const svc = await load(ok);
    await svc.notifyOffline();
    expect(svc.isOnline()).toBe(true);
  });

  it('notifyOffline menandai offline bila ping gagal', async () => {
    const svc = await load(fail);
    await svc.notifyOffline();
    expect(svc.isOnline()).toBe(false);
  });

  it('kembali ke app (AppState active) memicu pengecekan ulang', async () => {
    const svc = await load(ok);
    await vi.advanceTimersByTimeAsync(0);
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const before = fetchMock.mock.calls.length;
    appStateHandlers.forEach((h) => h('background'));
    expect(fetchMock.mock.calls.length).toBe(before);
    appStateHandlers.forEach((h) => h('active'));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock.mock.calls.length).toBeGreaterThan(before);
    expect(svc.isOnline()).toBe(true);
  });

  it('polling berkala berjalan, lebih cepat saat offline', async () => {
    const svc = await load(fail);
    await svc.checkConnectivity();
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const before = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(3600);
    expect(fetchMock.mock.calls.length).toBeGreaterThan(before);
  });

  it('listener yang melempar error tidak merusak listener lain', async () => {
    const svc = await load(fail);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const good: boolean[] = [];
    await vi.advanceTimersByTimeAsync(0);
    svc.notifyOnline();
    svc.subscribe((v) => { if (!v) throw new Error('boom'); });
    svc.subscribe((v) => good.push(v));
    await svc.checkConnectivity();
    expect(good).toEqual([true, false]);
    expect(warn).toHaveBeenCalled();
  });

  it('tidak memakai URL Supabase hardcode bila env kosong', async () => {
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', '');
    const svc = await load(ok);
    await svc.checkConnectivity();
    const urls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes('supabase.co'))).toBe(false);
  });
});
