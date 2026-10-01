import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';

export type TabKey = 'home' | 'edu' | 'tools' | 'journal';

export type Route =
  | { name: 'home' }
  | { name: 'edu' }
  | { name: 'module'; params: { moduleId: string } }
  | { name: 'lesson'; params: { moduleId: string; lessonId: string } }
  | { name: 'tools' }
  | { name: 'tool'; params: { toolId: ToolId } }
  | { name: 'journal' }
  | { name: 'tradeForm'; params: { tradeId?: string } }
  | { name: 'achievements' };

export type ToolId = 'lot' | 'pip' | 'rr' | 'margin' | 'pl' | 'compound';

type NavValue = {
  tab: TabKey;
  route: Route;
  depth: number;
  setTab: (t: TabKey) => void;
  push: (r: Route) => void;
  pop: () => void;
  /** Pindah tab lalu buka route di tab tersebut */
  go: (t: TabKey, r?: Route) => void;
};

const roots: Record<TabKey, Route> = {
  home: { name: 'home' },
  edu: { name: 'edu' },
  tools: { name: 'tools' },
  journal: { name: 'journal' },
};

const Ctx = createContext<NavValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTabState] = useState<TabKey>('home');
  const [stacks, setStacks] = useState<Record<TabKey, Route[]>>({
    home: [roots.home],
    edu: [roots.edu],
    tools: [roots.tools],
    journal: [roots.journal],
  });

  const stack = stacks[tab];
  const route = stack[stack.length - 1];

  const setTab = useCallback(
    (t: TabKey) => {
      // ketuk tab aktif = kembali ke halaman utama tab itu
      if (t === tab) setStacks((s) => ({ ...s, [t]: [roots[t]] }));
      setTabState(t);
    },
    [tab],
  );

  const push = useCallback(
    (r: Route) => setStacks((s) => ({ ...s, [tab]: [...s[tab], r] })),
    [tab],
  );

  const pop = useCallback(
    () => setStacks((s) => (s[tab].length > 1 ? { ...s, [tab]: s[tab].slice(0, -1) } : s)),
    [tab],
  );

  const go = useCallback((t: TabKey, r?: Route) => {
    setStacks((s) => ({ ...s, [t]: r ? [roots[t], r] : [roots[t]] }));
    setTabState(t);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        pop();
        return true;
      }
      if (tab !== 'home') {
        setTabState('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, tab, pop]);

  const value = useMemo(
    () => ({ tab, route, depth: stack.length, setTab, push, pop, go }),
    [tab, route, stack.length, setTab, push, pop, go],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNav must be inside NavProvider');
  return v;
}
