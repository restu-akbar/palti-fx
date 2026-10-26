import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Lesson, Module, MODULES } from '../data/modules';
import { EduService } from '../lib/eduService';
import { supabase } from '../lib/supabase';
import { NetworkService } from '../lib/networkService';

type EduContextValue = {
  modules: Module[];
  loading: boolean;
  refreshing: boolean;
  lastSyncedAt: Date | null;
  refresh: (force?: boolean) => Promise<void>;
  findModule: (id: string) => Module | undefined;
  findLesson: (
    moduleId: string,
    lessonId: string
  ) => { module: Module; lesson: Lesson; index: number } | undefined;
};

const EduContext = createContext<EduContextValue | null>(null);

export function EduProvider({ children }: { children: React.ReactNode }) {
  const [modules, setModules] = useState<Module[]>(MODULES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const inFlightPromiseRef = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async (force = true) => {
    // Hindari request duplikat beruntun jika refresh sedang berlangsung
    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    const p = (async () => {
      try {
        setRefreshing(true);
        const data = await EduService.getModules(force);
        if (data && data.length > 0) {
          setModules(data);
          setLastSyncedAt(new Date());
        }
      } catch (err) {
        NetworkService.checkConnectivity();
        console.warn('[EduProvider] Error loading modules:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        inFlightPromiseRef.current = null;
      }
    })();

    inFlightPromiseRef.current = p;
    return p;
  }, []);

  // 1. Inisialisasi awal: Muat cache lokal terlebih dahulu (0ms), lalu sinkronisasi server
  useEffect(() => {
    let mounted = true;
    EduService.getCachedModules().then((cached) => {
      if (mounted && cached && cached.length > 0) {
        setModules(cached);
        setLoading(false);
      }
    });

    refresh(true);

    return () => {
      mounted = false;
    };
  }, [refresh]);

  // 2. Realtime Listener Supabase: Update otomatis seketika bila web admin menambah, mengubah, atau menghapus materi
  useEffect(() => {
    const channel = supabase
      .channel('pfx-edu-realtime-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'edu_modules' },
        (payload) => {
          console.log('[EduRealtime] Perubahan modul di server:', payload.eventType);
          refresh(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'edu_lessons' },
        (payload) => {
          console.log('[EduRealtime] Perubahan bab/subbab di server:', payload.eventType);
          refresh(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  // 3. AppState Listener: Otomatis sinkronisasi saat pengguna kembali membuka aplikasi dari background
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        refresh(true);
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [refresh]);

  // 4. Network Recovery Listener: Otomatis refresh saat koneksi internet pulih kembali
  useEffect(() => {
    let wasOffline = false;
    const unsub = NetworkService.subscribe((online) => {
      if (!online) {
        wasOffline = true;
      } else if (wasOffline) {
        wasOffline = false;
        // Jaringan pulih kembali -> sinkronkan data materi dari server
        refresh(true);
      }
    });
    return () => unsub();
  }, [refresh]);

  const findModule = useCallback(
    (id: string) => modules.find((m) => m.id === id),
    [modules]
  );

  const findLesson = useCallback(
    (moduleId: string, lessonId: string) => {
      const mod = modules.find((m) => m.id === moduleId);
      if (!mod) return undefined;
      const index = mod.lessons.findIndex((l) => l.id === lessonId);
      if (index === -1) return undefined;
      return { module: mod, lesson: mod.lessons[index], index };
    },
    [modules]
  );

  return (
    <EduContext.Provider
      value={{
        modules,
        loading,
        refreshing,
        lastSyncedAt,
        refresh,
        findModule,
        findLesson,
      }}
    >
      {children}
    </EduContext.Provider>
  );
}

export function useEdu() {
  const ctx = useContext(EduContext);
  if (!ctx) {
    return {
      modules: MODULES,
      loading: false,
      refreshing: false,
      lastSyncedAt: null,
      refresh: async () => {},
      findModule: (id: string) => MODULES.find((m) => m.id === id),
      findLesson: (moduleId: string, lessonId: string) => {
        const mod = MODULES.find((m) => m.id === moduleId);
        if (!mod) return undefined;
        const index = mod.lessons.findIndex((l) => l.id === lessonId);
        if (index === -1) return undefined;
        return { module: mod, lesson: mod.lessons[index], index };
      },
    };
  }
  return ctx;
}
