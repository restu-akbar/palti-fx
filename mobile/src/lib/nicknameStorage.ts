import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PREFIX = 'pfx_nick_';
const native = Platform.OS !== 'web';

function toStorageKey(userIdentifier?: string | null): string {
  const clean = (userIdentifier ?? '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `${PREFIX}${clean || 'guest'}`;
}

/**
 * Mengambil nama panggilan spesifik per-akun dari storage aman (Keychain / Keystore).
 * Terisolasi antar akun sehingga tidak tertukar saat ganti akun.
 */
export async function getSecureNickname(userIdentifier?: string | null): Promise<string | null> {
  const key = toStorageKey(userIdentifier);
  try {
    if (native) {
      const val = await SecureStore.getItemAsync(key);
      if (val?.trim()) return val.trim();
    }
    const fallback = await AsyncStorage.getItem(key);
    return fallback?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Menyimpan nama panggilan spesifik per-akun ke storage aman.
 */
export async function setSecureNickname(
  userIdentifier: string | null | undefined,
  name: string | null | undefined
): Promise<void> {
  const key = toStorageKey(userIdentifier);
  const clean = (name ?? '').trim();
  try {
    if (clean) {
      if (native) {
        await SecureStore.setItemAsync(key, clean);
      }
      await AsyncStorage.setItem(key, clean);
    } else {
      if (native) {
        await SecureStore.deleteItemAsync(key);
      }
      await AsyncStorage.removeItem(key);
    }
  } catch {}
}
