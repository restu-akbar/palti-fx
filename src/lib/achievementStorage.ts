import AsyncStorage from '@react-native-async-storage/async-storage';

const ACH_USER_KEY_PREFIX = '@pfx_achievements_user_';

export function normalizeUserKey(identifier?: string | null): string {
  if (!identifier) return 'guest';
  return identifier.trim().toLowerCase();
}

/**
 * Membaca medali pencapaian yang tersimpan secara lokal dan permanen untuk akun tertentu.
 * Data ini tidak pernah dihapus saat logout sehingga berfungsi sebagai cache penting.
 */
export async function getLocalAchievementsForUser(
  identifier?: string | null
): Promise<Record<string, number>> {
  try {
    const key = `${ACH_USER_KEY_PREFIX}${normalizeUserKey(identifier)}`;
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch (err) {
    console.warn('[achievementStorage.get]', err);
    return {};
  }
}

/**
 * Menyimpan medali pencapaian lokal ke storage perangkat secara permanen untuk akun tertentu.
 * Tiap akun memiliki partisi key sendiri sehingga perpindahan akun tidak akan saling menimpa.
 */
export async function saveLocalAchievementsForUser(
  identifier: string | null | undefined,
  unlocked: Record<string, number>
): Promise<void> {
  try {
    const key = `${ACH_USER_KEY_PREFIX}${normalizeUserKey(identifier)}`;
    await AsyncStorage.setItem(key, JSON.stringify(unlocked));
  } catch (err) {
    console.warn('[achievementStorage.save]', err);
  }
}
