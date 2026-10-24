import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Settings } from '../core/domain/settings';
import { Trade, upsertTrade } from '../core/domain/trade';
import type { StoreDeps } from '../core/ports/storeDeps';
import { reconcileUserData } from '../core/usecases/reconcileUserData';
import { defaultStoreDeps } from './defaultStoreDeps';

export type { Trade, Stats } from '../core/domain/trade';
export type { Settings } from '../core/domain/settings';
export { computeStats } from '../core/domain/trade';

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

const Ctx = createContext<StoreValue | null>(null);

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function StoreProvider({
  children,
  deps = defaultStoreDeps,
}: {
  children: React.ReactNode;
  deps?: StoreDeps;
}) {
  const [ready, setReady] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<Settings>({});
  const activeUserRef = useRef<string | undefined>(undefined);
  const tradesRef = useRef<Trade[]>([]);
  const completedRef = useRef<Record<string, boolean>>({});
  const settingsRef = useRef<Settings>({});

  const commitTrades = useCallback((next: Trade[]) => {
    tradesRef.current = next;
    setTrades(next);
  }, []);
  const commitCompleted = useCallback((next: Record<string, boolean>) => {
    completedRef.current = next;
    setCompleted(next);
  }, []);
  const commitSettings = useCallback((next: Settings) => {
    settingsRef.current = next;
    setSettings(next);
  }, []);

  const syncFromCloud = useCallback(
    async (userId?: string) => {
      const uid = userId || (await deps.currentUserId());
      if (!uid) return;
      const targetUser = activeUserRef.current;
      try {
        const cloud = await deps.remote.fetchUserData(uid);
        const result = reconcileUserData(cloud, {
          completed: completedRef.current,
          unlocked: settingsRef.current.unlocked,
          trades: tradesRef.current,
        });

        result.uploads.lessons.forEach((lId) => deps.remote.saveLessonProgress(uid, lId, true));
        result.uploads.achievements.forEach(([achId, ts]) => deps.remote.saveAchievement(uid, achId, ts));
        result.uploads.trades.forEach((t) => deps.remote.saveTrade(uid, t));

        commitCompleted(result.completed);
        commitSettings({ ...settingsRef.current, unlocked: result.unlocked });
        commitTrades(result.trades);
        deps.cache.saveCompleted(targetUser, result.completed);
        deps.cache.saveAchievements(targetUser, result.unlocked);
        deps.cache.saveTrades(targetUser, result.trades);
      } catch (err) {
        console.warn('[store.syncFromCloud] Error syncing from cloud:', err);
      }
    },
    [deps, commitCompleted, commitSettings, commitTrades],
  );

  useEffect(() => {
    (async () => {
      const globalSettings = await deps.loadDeviceSettings();
      const activeUser = globalSettings.activeUser;
      activeUserRef.current = activeUser;

      const [userData, secureName] = await Promise.all([
        deps.cache.loadAll(activeUser),
        activeUser ? deps.getNickname(activeUser) : null,
      ]);

      commitTrades(userData.trades);
      commitCompleted(userData.completed);
      commitSettings({
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
  }, [deps, syncFromCloud, commitTrades, commitCompleted, commitSettings]);

  const saveTrade = useCallback<StoreValue['saveTrade']>(
    (t) => {
      const item: Trade = { ...t, id: t.id ?? newId(), createdAt: t.createdAt ?? Date.now() } as Trade;
      const next = upsertTrade(tradesRef.current, item);
      commitTrades(next);
      deps.cache.saveTrades(activeUserRef.current, next);
      deps.currentUserId().then((uid) => {
        if (uid) deps.remote.saveTrade(uid, item);
      });
    },
    [deps, commitTrades],
  );

  const deleteTrade = useCallback(
    (id: string) => {
      const next = tradesRef.current.filter((p) => p.id !== id);
      commitTrades(next);
      deps.cache.saveTrades(activeUserRef.current, next);
      deps.currentUserId().then((uid) => {
        if (uid) deps.remote.deleteTrade(uid, id);
      });
    },
    [deps, commitTrades],
  );

  const toggleLesson = useCallback(
    (lessonId: string, done?: boolean) => {
      const prev = completedRef.current;
      const isDone = done ?? !prev[lessonId];
      const next = { ...prev, [lessonId]: isDone };
      commitCompleted(next);
      deps.cache.saveCompleted(activeUserRef.current, next);
      deps.currentUserId().then((uid) => {
        if (uid) deps.remote.saveLessonProgress(uid, lessonId, isDone);
      });
    },
    [deps, commitCompleted],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const prev = settingsRef.current;
      const prevUser = prev.activeUser;
      const nextUser = patch.activeUser !== undefined ? patch.activeUser : prevUser;
      const userChanged = patch.activeUser !== undefined && patch.activeUser !== prevUser;

      activeUserRef.current = nextUser;

      // Pergantian akun aktif: muat seluruh cache lokal milik akun baru tanpa menimpa akun lama
      if (userChanged) {
        Promise.all([
          deps.cache.loadAll(nextUser),
          nextUser ? deps.getNickname(nextUser) : null,
        ]).then(([userData, secureName]) => {
          commitTrades(userData.trades);
          commitCompleted(userData.completed);
          const cur = settingsRef.current;
          commitSettings({
            ...cur,
            ...userData.settings,
            name: secureName || cur.name,
            unlocked: userData.achievements,
          });
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
        deps.cache.saveSettings(nextUser, {
          balance: patch.balance ?? prev.balance,
          riskPercent: patch.riskPercent ?? prev.riskPercent,
          leverage: patch.leverage ?? prev.leverage,
          lastSymbol: patch.lastSymbol ?? prev.lastSymbol,
          lotCalcCount: patch.lotCalcCount ?? prev.lotCalcCount,
        });
      }

      // Simpan nama panggilan spesifik untuk user yang sedang aktif
      if (patch.name !== undefined) {
        deps.setNickname(nextUser, patch.name);
        deps.currentUserId().then((uid) => {
          if (uid) deps.remote.updateProfileName(uid, patch.name || null);
        });
      }

      // Simpan medali pencapaian secara lokal per akun + sinkronkan ke cloud
      if (patch.unlocked !== undefined) {
        deps.cache.saveAchievements(nextUser, patch.unlocked);
        deps.currentUserId().then((uid) => {
          if (uid && patch.unlocked) {
            Object.entries(patch.unlocked).forEach(([achId, ts]) => {
              deps.remote.saveAchievement(uid, achId, ts);
            });
          }
        });
      }

      const next = { ...prev, ...patch };
      commitSettings(next);
      // Simpan pengaturan global perangkat (tanpa menghapus partisi data akun manapun)
      deps.saveDeviceSettings({
        welcomed: next.welcomed,
        isLoggedIn: next.isLoggedIn,
        activeUser: next.activeUser,
        role: next.role,
        name: next.name,
      });
    },
    [deps, commitTrades, commitCompleted, commitSettings],
  );

  const logout = useCallback(() => {
    deps.signOutLocal();
    activeUserRef.current = undefined;
    commitTrades([]);
    commitCompleted({});
    // Bersihkan state in-memory agar aman saat layar login tampil kembali.
    // PENTING: Jangan hapus AsyncStorage cache milik akun yang logout,
    // agar ketika login kembali, seluruh data lokal tetap utuh dan tidak hilang.
    const next: Settings = {
      welcomed: settingsRef.current.welcomed ?? true,
      isLoggedIn: false,
      role: undefined,
      name: undefined,
      activeUser: undefined,
      unlocked: {},
    };
    commitSettings(next);
    deps.saveDeviceSettings(next);
  }, [deps, commitTrades, commitCompleted, commitSettings]);

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
