import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { createChunkedStorage } from './chunkedStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY belum diset. Salin frontend/.env.example ke frontend/.env lalu restart dengan `npx expo start -c`.'
  );
}

const native = Platform.OS !== 'web';

/** Token disimpan di Keychain/Keystore (native); fallback AsyncStorage di web. */
const storage = native
  ? createChunkedStorage({
      getItem: (k) => SecureStore.getItemAsync(k),
      setItem: (k, v) => SecureStore.setItemAsync(k, v),
      removeItem: (k) => SecureStore.deleteItemAsync(k),
    })
  : AsyncStorage;

export const supabase = createClient(url, anonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh token hanya saat app aktif (disarankan Supabase untuk React Native)
if (native) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
