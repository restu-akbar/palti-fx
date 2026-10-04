import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Lesson, Module, MODULES } from '../data/modules';
import { EduService } from '../lib/eduService';

type EduContextValue = {
  modules: Module[];
  loading: boolean;
  refresh: () => Promise<void>;
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

  const refresh = useCallback(async () => {
    try {
      const data = await EduService.getModules();
      if (data && data.length > 0) {
        setModules(data);
      }
    } catch (err) {
      console.warn('[EduProvider] Error loading modules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
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
    <EduContext.Provider value={{ modules, loading, refresh, findModule, findLesson }}>
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
