import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase';
import { getSecureNickname, setSecureNickname } from './nicknameStorage';
import {
  getLocalTradesForUser,
  saveLocalTradesForUser,
  getLocalCompletedForUser,
  saveLocalCompletedForUser,
  getLocalAchievementsForUser,
  saveLocalAchievementsForUser,
  getLocalSettingsForUser,
  saveLocalSettingsForUser,
  loadAllUserData,
} from './userCacheStorage';
import { UserSyncService } from './userSyncService';

export type Trade = {
  id: string;
  date: string; // YYYY-MM-DD
  symbol: string;
  direction: 'BUY' | 'SELL';
  lot: number;
  entry?: number;
  exit?: number;
  sl?: number;
  tp?: number;
  pl: number; // USD, hasil bersih
  pips?: number;
  setup?: string;
  emotion?: string;
  notes?: string;
  createdAt: number;
};

export type Settings = {
  balance?: string;
  riskPercent?: string;
  leverage?: string;
  lastSymbol?: string;
  /** Sudah melihat layar sambutan */
  welcomed?: boolean;
  /** Status autentikasi login pengguna */
  isLoggedIn?: boolean;
  /** Role akun: member atau admin */
  role?: 'member' | 'admin';
  /** Nama panggilan member (untuk sapaan) */
  name?: string;
  /** Identifier / Email akun yang sedang aktif */
  activeUser?: string;
  /** Pencapaian yang sudah terbuka: id → waktu terbuka (ms) */
  unlocked?: Record<string, number>;
  /** Berapa kali kalkulator Lot Size dibuka */
  lotCalcCount?: number;
};

type StoreValue = {
  ready: boolean;
  trades: Trade[];
  saveTrade: (t: Omit<Trade, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => void;
  deleteTrade: (id: string) => void;
  completed: Record<string, boolean>;
  toggleLesson: (lessonId: string, done?: boolean) => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  logout: () => void;
  syncFromCloud: (userId?: string) => Promise<void>;
};

const KEYS = { trades: 'pfx.trades.v1', completed: 'pfx.completed.v1', settings: 'pfx.settings.v1' };

const Ctx = createContext<StoreValue | null>(null);

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<Settings>({});
  const activeUserRef = useRef<string | undefined>(undefined);

  const syncFromCloud = useCallback(async (userId?: string) => {
    const uid = userId || (await getCurrentUserId());
    if (!uid) return;
    const targetUser = activeUserRef.current;
    try {
      const cloud = await UserSyncService.fetchUserData(uid);

      setCompleted((prev) => {
        // Unggah progres lokal yang belum tercatat di cloud
        Object.entries(prev).forEach(([lId, done]) => {
          if (done && !cloud.completed[lId]) {
            UserSyncService.saveLessonProgress(uid, lId, true);
          }
        });
        const merged = { ...cloud.completed, ...prev };
        saveLocalCompletedForUser(targetUser, merged);
        return merged;
      });

      // Gabungan: unggah unlocked lokal yang belum ada di cloud, gabung kedua sisi,
      // simpan ke storage lokal per-akun agar tidak saling menimpa.
      setSettings((prev) => {
        const cloudUnlocked: Record<string, number> = (cloud as { unlocked?: Record<string, number> }).unlocked || {};
        if (prev.unlocked) {
          Object.entries(prev.unlocked).forEach(([achId, ts]) => {
            if (!cloudUnlocked[achId]) {
              UserSyncService.saveAchievement(uid, achId, ts);
            }
          });
        }
        const mergedUnlocked = { ...cloudUnlocked, ...(prev.unlocked || {}) };
        const next = { ...prev, unlocked: mergedUnlocked };
        saveLocalAchievementsForUser(targetUser, mergedUnlocked);
        return next;
      });

      setTrades((prev) => {
        const idMap = new Map<string, Trade>();
        // Masukkan data transaksi dari cloud
        cloud.trades.forEach((t) => idMap.set(t.id, t));
        // Unggah transaksi lokal yang belum tercatat di cloud
        prev.forEach((t) => {
          if (!idMap.has(t.id)) {
            UserSyncService.saveTrade(uid, t);
          }
          idMap.set(t.id, t);
        });
        const merged = Array.from(idMap.values());
        merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
        saveLocalTradesForUser(targetUser, merged);
        return merged;
      });
    } catch (err) {
      console.warn('[store.syncFromCloud] Error syncing from cloud:', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const globalSettings = await load<Settings>(KEYS.settings, {});
      const activeUser = globalSettings.activeUser;
      activeUserRef.current = activeUser;

      const [userData, secureName] = await Promise.all([
        loadAllUserData(activeUser),
        activeUser ? getSecureNickname(activeUser) : null,
      ]);

      setTrades(userData.trades);
      setCompleted(userData.completed);
      setSettings({
        ...globalSettings,
        ...userData.settings,
        name: secureName || globalSettings.name,
        unlocked: userData.achievements,
      });
      setReady(true);

      if (globalSettings.isLoggedIn) {
        syncFromCloud();
      }
    })();
  }, [syncFromCloud]);

  const saveTrade = useCallback<StoreValue['saveTrade']>((t) => {
    setTrades((prev) => {
      const item: Trade = { ...t, id: t.id ?? newId(), createdAt: t.createdAt ?? Date.now() } as Trade;
      const exists = prev.some((p) => p.id === item.id);
      const next = exists ? prev.map((p) => (p.id === item.id ? item : p)) : [item, ...prev];
      next.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
      saveLocalTradesForUser(activeUserRef.current, next);
      getCurrentUserId().then((uid) => {
        if (uid) UserSyncService.saveTrade(uid, item);
      });
      return next;
    });
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveLocalTradesForUser(activeUserRef.current, next);
      getCurrentUserId().then((uid) => {
        if (uid) UserSyncService.deleteTrade(uid, id);
      });
      return next;
    });
  }, []);

  const toggleLesson = useCallback((lessonId: string, done?: boolean) => {
    setCompleted((prev) => {
      const isDone = done ?? !prev[lessonId];
      const next = { ...prev, [lessonId]: isDone };
      saveLocalCompletedForUser(activeUserRef.current, next);
      getCurrentUserId().then((uid) => {
        if (uid) UserSyncService.saveLessonProgress(uid, lessonId, isDone);
      });
      return next;
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const prevUser = prev.activeUser;
      const nextUser = patch.activeUser !== undefined ? patch.activeUser : prevUser;
      const userChanged = patch.activeUser !== undefined && patch.activeUser !== prevUser;

      activeUserRef.current = nextUser;

      // Pergantian akun aktif: muat seluruh cache lokal milik akun baru tanpa menimpa akun lama
      if (userChanged) {
        Promise.all([
          loadAllUserData(nextUser),
          nextUser ? getSecureNickname(nextUser) : null,
        ]).then(([userData, secureName]) => {
          setTrades(userData.trades);
          setCompleted(userData.completed);
          setSettings((cur) => ({
            ...cur,
            ...userData.settings,
            name: secureName || cur.name,
            unlocked: userData.achievements,
          }));
        });
      }

      // Simpan preferensi trading per akun
      if (
        patch.balance !== undefined ||
        patch.riskPercent !== undefined ||
        patch.leverage !== undefined ||
        patch.lastSymbol !== undefined ||
        patch.lotCalcCount !== undefined
      ) {
        saveLocalSettingsForUser(nextUser, {
          balance: patch.balance ?? prev.balance,
          riskPercent: patch.riskPercent ?? prev.riskPercent,
          leverage: patch.leverage ?? prev.leverage,
          lastSymbol: patch.lastSymbol ?? prev.lastSymbol,
          lotCalcCount: patch.lotCalcCount ?? prev.lotCalcCount,
        });
      }

      // Simpan nama panggilan spesifik untuk user yang sedang aktif
      if (patch.name !== undefined) {
        setSecureNickname(nextUser, patch.name);
        getCurrentUserId().then((uid) => {
          if (uid) UserSyncService.updateProfileName(uid, patch.name || null);
        });
      }

      // Simpan medali pencapaian secara lokal per akun + sinkronkan ke cloud
      if (patch.unlocked !== undefined) {
        saveLocalAchievementsForUser(nextUser, patch.unlocked);
        getCurrentUserId().then((uid) => {
          if (uid && patch.unlocked) {
            Object.entries(patch.unlocked).forEach(([achId, ts]) => {
              UserSyncService.saveAchievement(uid, achId, ts);
            });
          }
        });
      }

      const next = { ...prev, ...patch };
      // Simpan pengaturan global perangkat (tanpa menghapus partisi data akun manapun)
      persist(KEYS.settings, {
        welcomed: next.welcomed,
        isLoggedIn: next.isLoggedIn,
        activeUser: next.activeUser,
        role: next.role,
        name: next.name,
      });
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    activeUserRef.current = undefined;
    setTrades([]);
    setCompleted({});
    setSettings((prev) => {
      // Bersihkan state in-memory agar aman saat layar login tampil kembali.
      // PENTING: Jangan hapus AsyncStorage cache milik akun yang logout,
      // agar ketika login kembali, seluruh data lokal tetap utuh dan tidak hilang.
      const next: Settings = {
        welcomed: prev.welcomed ?? true,
        isLoggedIn: false,
        role: undefined,
        name: undefined,
        activeUser: undefined,
        unlocked: {},
      };
      persist(KEYS.settings, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      ready,
      trades,
      saveTrade,
      deleteTrade,
      completed,
      toggleLesson,
      settings,
      updateSettings,
      logout,
      syncFromCloud,
    }),
    [
      ready,
      trades,
      saveTrade,
      deleteTrade,
      completed,
      toggleLesson,
      settings,
      updateSettings,
      logout,
      syncFromCloud,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be inside StoreProvider');
  return v;
}

export type Stats = {
  count: number;
  wins: number;
  losses: number;
  winRate: number;
  net: number;
  grossWin: number;
  grossLoss: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number | null;
  best: number;
  worst: number;
  equity: number[];
};

export function computeStats(trades: Trade[]): Stats {
  const chron = [...trades].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt));
  let net = 0;
  let grossWin = 0;
  let grossLoss = 0;
  let wins = 0;
  let losses = 0;
  let best = 0;
  let worst = 0;
  const equity: number[] = [0];
  for (const t of chron) {
    net += t.pl;
    equity.push(net);
    if (t.pl > 0) {
      wins++;
      grossWin += t.pl;
    } else if (t.pl < 0) {
      losses++;
      grossLoss += -t.pl;
    }
    best = Math.max(best, t.pl);
    worst = Math.min(worst, t.pl);
  }
  const count = chron.length;
  return {
    count,
    wins,
    losses,
    winRate: count ? wins / count : 0,
    net,
    grossWin,
    grossLoss,
    avgWin: wins ? grossWin / wins : 0,
    avgLoss: losses ? grossLoss / losses : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? null : 0,
    best,
    worst,
    equity,
  };
}
