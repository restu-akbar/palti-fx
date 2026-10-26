import { AppState, AppStateStatus, Platform } from 'react-native';

type NetworkListener = (isOnline: boolean) => void;

async function ping(url: string, timeoutMs = 3500): Promise<boolean> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    // Server merespon status HTTP apa pun = perangkat terhubung ke internet
    return !!res && (res.status > 0 || res.type === 'opaque');
  } catch {
    return false;
  } finally {
    clearTimeout(id);
  }
}

class NetworkServiceManager {
  private isOnlineState: boolean = true;
  private listeners: Set<NetworkListener> = new Set();
  private timer: any = null;
  private isChecking: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    // 1. Cek navigator.onLine awal jika platform Web
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'onLine' in navigator) {
      this.isOnlineState = navigator.onLine;
    }

    // 2. Jalankan pengecekan aktif pertama kali
    this.checkConnectivity();

    // 3. Listener online/offline Web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateOnlineState(true);
        this.checkConnectivity();
      });
      window.addEventListener('offline', () => {
        this.updateOnlineState(false);
      });
    }

    // 4. Listener AppState saat user kembali ke app (misal habis toggle Wi-Fi / data seluler)
    AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        this.checkConnectivity();
      }
    });

    // 5. Polling berkala
    this.scheduleNextCheck();
  }

  private scheduleNextCheck() {
    if (this.timer) clearTimeout(this.timer);
    // Jika offline, periksa lebih cepat (setiap 3.5 detik) agar pemulihan sinyal terdeteksi seketika
    const interval = this.isOnlineState ? 20000 : 3500;
    this.timer = setTimeout(() => {
      this.checkConnectivity().finally(() => {
        this.scheduleNextCheck();
      });
    }, interval);
  }

  private async pingEndpoints(): Promise<boolean> {
    const endpoints = [
      'https://1.1.1.1/cdn-cgi/trace',
      'https://clients3.google.com/generate_204',
      process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xdeyntmcrdvhspkucclu.supabase.co',
    ];

    try {
      // Race: Cukup 1 endpoint yang merespon, koneksi dipastikan aktif
      const ok = await Promise.any(
        endpoints.map(async (url) => {
          const success = await ping(url, 3500);
          if (success) return true;
          throw new Error('fail');
        })
      );
      return ok;
    } catch {
      return false;
    }
  }

  /**
   * Cek konektivitas internet aktif secara presisi.
   */
  public async checkConnectivity(): Promise<boolean> {
    if (this.isChecking) return this.isOnlineState;
    this.isChecking = true;

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'onLine' in navigator) {
        if (!navigator.onLine) {
          this.updateOnlineState(false);
          return false;
        }
      }

      const online = await this.pingEndpoints();
      this.updateOnlineState(online);
      return online;
    } catch {
      this.updateOnlineState(false);
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Dipanggil bila request fetch mendeteksi indikasi jaringan putus.
   * Melakukan verifikasi terlebih dahulu agar tidak memunculkan false-alarm.
   */
  public async notifyOffline() {
    const online = await this.checkConnectivity();
    if (!online) {
      this.updateOnlineState(false);
    }
  }

  public notifyOnline() {
    this.updateOnlineState(true);
    this.scheduleNextCheck();
  }

  private updateOnlineState(newState: boolean) {
    if (this.isOnlineState !== newState) {
      this.isOnlineState = newState;
      this.listeners.forEach((listener) => {
        try {
          listener(newState);
        } catch (e) {
          console.warn('[NetworkService] listener error:', e);
        }
      });
      this.scheduleNextCheck();
    }
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnlineState);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const NetworkService = new NetworkServiceManager();
