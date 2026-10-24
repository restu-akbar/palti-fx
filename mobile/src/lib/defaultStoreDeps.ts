import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Settings } from '../core/domain/settings';
import type { StoreDeps } from '../core/ports/storeDeps';
import { getSecureNickname, setSecureNickname } from './nicknameStorage';
import { supabase } from './supabase';
import {
  loadAllUserData,
  saveLocalAchievementsForUser,
  saveLocalCompletedForUser,
  saveLocalSettingsForUser,
  saveLocalTradesForUser,
} from './userCacheStorage';
import { UserSyncService } from './userSyncService';

const DEVICE_SETTINGS_KEY = 'pfx.settings.v1';

export const defaultStoreDeps: StoreDeps = {
  remote: UserSyncService,
  cache: {
    loadAll: loadAllUserData,
    saveTrades: saveLocalTradesForUser,
    saveCompleted: saveLocalCompletedForUser,
    saveAchievements: saveLocalAchievementsForUser,
    saveSettings: saveLocalSettingsForUser,
  },
  async currentUserId() {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id || null;
    } catch {
      return null;
    }
  },
  signOutLocal() {
    supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  },
  getNickname: getSecureNickname,
  setNickname: setSecureNickname,
  async loadDeviceSettings() {
    try {
      const raw = await AsyncStorage.getItem(DEVICE_SETTINGS_KEY);
      return raw ? (JSON.parse(raw) as Settings) : {};
    } catch {
      return {};
    }
  },
  saveDeviceSettings(value) {
    AsyncStorage.setItem(DEVICE_SETTINGS_KEY, JSON.stringify(value)).catch(() => {});
  },
};
