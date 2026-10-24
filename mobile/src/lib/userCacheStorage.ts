import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Settings, UserScopedSettings } from '../core/domain/settings';
import type { UserCacheBundle } from '../core/ports/userCache';
import type { Trade } from '../core/domain/trade';

export const TRADES_USER_KEY_PREFIX = '@pfx_user_trades_';
export const COMPLETED_USER_KEY_PREFIX = '@pfx_user_completed_';
export const SETTINGS_USER_KEY_PREFIX = '@pfx_user_settings_';
export const ACH_USER_KEY_PREFIX = '@pfx_achievements_user_';

export const LEGACY_KEYS = {
  trades: 'pfx.trades.v1',
  completed: 'pfx.completed.v1',
  settings: 'pfx.settings.v1',
};

/**
 * Normalisasi user identifier (email, ID member, atau guest)
 * agar pencarian dan penyimpanan cache bersifat case-insensitive dan konsisten.
 */
export function normalizeUserKey(identifier?: string | null): string {
  if (!identifier) return 'guest';
  const clean = identifier.trim().toLowerCase();
  return clean || 'guest';
}

/**
 * Mengambil key spesifik per user untuk kategori data tertentu.
 */
export function getUserStorageKey(
  category: 'trades' | 'completed' | 'settings' | 'achievements',
  identifier?: string | null
): string {
  const user = normalizeUserKey(identifier);
  switch (category) {
    case 'trades':
      return `${TRADES_USER_KEY_PREFIX}${user}`;
    case 'completed':
      return `${COMPLETED_USER_KEY_PREFIX}${user}`;
    case 'settings':
      return `${SETTINGS_USER_KEY_PREFIX}${user}`;
    case 'achievements':
      return `${ACH_USER_KEY_PREFIX}${user}`;
  }
}

/* ------------------------------------------------------------------ */
/* 1. JURNAL TRADING (TRADES)                                         */
/* ------------------------------------------------------------------ */

/**
 * Membaca data jurnal trading lokal milik akun tertentu.
 * Data ini tidak akan tertimpa saat ganti akun dan tidak dihapus saat logout.
 * Dilengkapi migrasi otomatis dari cache lama (legacy key) jika ada.
 */
export async function getLocalTradesForUser(identifier?: string | null): Promise<Trade[]> {
  try {
    const key = getUserStorageKey('trades', identifier);
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as Trade[];
    }

    // Migrasi data legacy jika akun baru belum memiliki cache spesifik
    const legacyRaw = await AsyncStorage.getItem(LEGACY_KEYS.trades);
    if (legacyRaw) {
      const legacyTrades = JSON.parse(legacyRaw) as Trade[];
      if (Array.isArray(legacyTrades) && legacyTrades.length > 0) {
        // Simpan ke partisi user ini
        await AsyncStorage.setItem(key, JSON.stringify(legacyTrades));
        return legacyTrades;
      }
    }
    return [];
  } catch (err) {
    console.warn('[userCacheStorage.getLocalTradesForUser]', err);
    return [];
  }
}

/**
 * Menyimpan jurnal trading lokal ke partisi akun tertentu.
 */
export async function saveLocalTradesForUser(
  identifier: string | null | undefined,
  trades: Trade[]
): Promise<void> {
  try {
    const key = getUserStorageKey('trades', identifier);
    await AsyncStorage.setItem(key, JSON.stringify(trades));
  } catch (err) {
    console.warn('[userCacheStorage.saveLocalTradesForUser]', err);
  }
}

/* ------------------------------------------------------------------ */
/* 2. PROGRES BAB EDUKASI (COMPLETED LESSONS)                        */
/* ------------------------------------------------------------------ */

/**
 * Membaca progres penyelesaian bab edukasi milik akun tertentu.
 */
export async function getLocalCompletedForUser(
  identifier?: string | null
): Promise<Record<string, boolean>> {
  try {
    const key = getUserStorageKey('completed', identifier);
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as Record<string, boolean>;
    }

    // Migrasi data legacy jika ada
    const legacyRaw = await AsyncStorage.getItem(LEGACY_KEYS.completed);
    if (legacyRaw) {
      const legacyCompleted = JSON.parse(legacyRaw) as Record<string, boolean>;
      if (legacyCompleted && Object.keys(legacyCompleted).length > 0) {
        await AsyncStorage.setItem(key, JSON.stringify(legacyCompleted));
        return legacyCompleted;
      }
    }
    return {};
  } catch (err) {
    console.warn('[userCacheStorage.getLocalCompletedForUser]', err);
    return {};
  }
}

/**
 * Menyimpan progres penyelesaian bab edukasi ke partisi akun tertentu.
 */
export async function saveLocalCompletedForUser(
  identifier: string | null | undefined,
  completed: Record<string, boolean>
): Promise<void> {
  try {
    const key = getUserStorageKey('completed', identifier);
    await AsyncStorage.setItem(key, JSON.stringify(completed));
  } catch (err) {
    console.warn('[userCacheStorage.saveLocalCompletedForUser]', err);
  }
}

/* ------------------------------------------------------------------ */
/* 3. PENCAPAIAN MEDALI (ACHIEVEMENTS)                                */
/* ------------------------------------------------------------------ */

/**
 * Membaca medali pencapaian milik akun tertentu.
 */
export async function getLocalAchievementsForUser(
  identifier?: string | null
): Promise<Record<string, number>> {
  try {
    const key = getUserStorageKey('achievements', identifier);
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch (err) {
    console.warn('[userCacheStorage.getLocalAchievementsForUser]', err);
    return {};
  }
}

/**
 * Menyimpan medali pencapaian ke partisi akun tertentu.
 */
export async function saveLocalAchievementsForUser(
  identifier: string | null | undefined,
  unlocked: Record<string, number>
): Promise<void> {
  try {
    const key = getUserStorageKey('achievements', identifier);
    await AsyncStorage.setItem(key, JSON.stringify(unlocked));
  } catch (err) {
    console.warn('[userCacheStorage.saveLocalAchievementsForUser]', err);
  }
}

/* ------------------------------------------------------------------ */
/* 4. PENGATURAN SPESIFIK AKUN (SETTINGS)                             */
/* ------------------------------------------------------------------ */

export type { UserScopedSettings };

/**
 * Membaca preferensi & kalkulator spesifik milik akun tertentu (balance, risk %, leverage, dsb).
 */
export async function getLocalSettingsForUser(
  identifier?: string | null
): Promise<UserScopedSettings> {
  try {
    const key = getUserStorageKey('settings', identifier);
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as UserScopedSettings;
    }

    // Migrasi dari legacy settings jika ada
    const legacyRaw = await AsyncStorage.getItem(LEGACY_KEYS.settings);
    if (legacyRaw) {
      const s = JSON.parse(legacyRaw) as Settings;
      return {
        balance: s.balance,
        riskPercent: s.riskPercent,
        leverage: s.leverage,
        lastSymbol: s.lastSymbol,
        lotCalcCount: s.lotCalcCount,
      };
    }
    return {};
  } catch (err) {
    console.warn('[userCacheStorage.getLocalSettingsForUser]', err);
    return {};
  }
}

/**
 * Menyimpan preferensi spesifik akun ke partisi akun tertentu.
 */
export async function saveLocalSettingsForUser(
  identifier: string | null | undefined,
  settings: UserScopedSettings
): Promise<void> {
  try {
    const key = getUserStorageKey('settings', identifier);
    await AsyncStorage.setItem(key, JSON.stringify(settings));
  } catch (err) {
    console.warn('[userCacheStorage.saveLocalSettingsForUser]', err);
  }
}

/* ------------------------------------------------------------------ */
/* 5. LOAD ALL USER CACHE DATA SECARA PARALEL                         */
/* ------------------------------------------------------------------ */

export type { UserCacheBundle };

/**
 * Memuat seluruh cache penting milik suatu akun secara paralel dan efisien.
 * Digunakan saat inisialisasi aplikasi atau saat berganti akun aktif.
 */
export async function loadAllUserData(identifier?: string | null): Promise<UserCacheBundle> {
  const [trades, completed, achievements, settings] = await Promise.all([
    getLocalTradesForUser(identifier),
    getLocalCompletedForUser(identifier),
    getLocalAchievementsForUser(identifier),
    getLocalSettingsForUser(identifier),
  ]);
  return { trades, completed, achievements, settings };
}
