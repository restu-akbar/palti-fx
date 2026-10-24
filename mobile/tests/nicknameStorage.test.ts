import { beforeEach, describe, expect, it, vi } from 'vitest';

const { secure, plain, platform } = vi.hoisted(() => ({
  secure: new Map<string, string>(),
  plain: new Map<string, string>(),
  platform: { OS: 'ios' },
}));

vi.mock('react-native', () => ({ Platform: platform }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => secure.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void secure.set(k, v),
  deleteItemAsync: async (k: string) => void secure.delete(k),
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => plain.get(k) ?? null,
    setItem: async (k: string, v: string) => void plain.set(k, v),
    removeItem: async (k: string) => void plain.delete(k),
  },
}));

import { getSecureNickname, setSecureNickname } from '../src/lib/nicknameStorage';

beforeEach(() => {
  secure.clear();
  plain.clear();
  platform.OS = 'ios';
});

describe('nicknameStorage', () => {
  it('menyimpan dan membaca nama dengan trim', async () => {
    await setSecureNickname('A@Mail.com', '  Dio  ');
    expect(await getSecureNickname('a@mail.com')).toBe('Dio');
  });

  it('terisolasi antar akun', async () => {
    await setSecureNickname('a@mail.com', 'Dio');
    expect(await getSecureNickname('b@mail.com')).toBeNull();
  });

  it('identifier kosong memakai kunci guest', async () => {
    await setSecureNickname(undefined, 'Tamu');
    expect(await getSecureNickname(null)).toBe('Tamu');
    expect(await getSecureNickname('')).toBe('Tamu');
  });

  it('nama kosong menghapus nilai tersimpan', async () => {
    await setSecureNickname('a@mail.com', 'Dio');
    await setSecureNickname('a@mail.com', '   ');
    expect(await getSecureNickname('a@mail.com')).toBeNull();
    expect(secure.size).toBe(0);
    expect(plain.size).toBe(0);
  });

  it('native menulis ke SecureStore dan AsyncStorage', async () => {
    await setSecureNickname('a@mail.com', 'Dio');
    expect(secure.size).toBe(1);
    expect(plain.size).toBe(1);
  });

  it('jatuh ke AsyncStorage bila SecureStore kosong', async () => {
    await setSecureNickname('a@mail.com', 'Dio');
    secure.clear();
    expect(await getSecureNickname('a@mail.com')).toBe('Dio');
  });

  it('web hanya memakai AsyncStorage', async () => {
    vi.resetModules();
    platform.OS = 'web';
    const web = await import('../src/lib/nicknameStorage');
    await web.setSecureNickname('a@mail.com', 'Dio');
    expect(secure.size).toBe(0);
    expect(await web.getSecureNickname('a@mail.com')).toBe('Dio');
  });
});
