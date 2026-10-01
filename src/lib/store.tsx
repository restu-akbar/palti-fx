import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
  /** Nama panggilan member (untuk sapaan) */
  name?: string;
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
};

const KEYS = { trades: 'pfx.trades.v1', completed: 'pfx.completed.v1', settings: 'pfx.settings.v1' };

const Ctx = createContext<StoreValue | null>(null);

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

  useEffect(() => {
    (async () => {
      const [t, c, s] = await Promise.all([
        load<Trade[]>(KEYS.trades, []),
        load<Record<string, boolean>>(KEYS.completed, {}),
        load<Settings>(KEYS.settings, {}),
      ]);
      setTrades(t);
      setCompleted(c);
      setSettings(s);
      setReady(true);
    })();
  }, []);

  const saveTrade = useCallback<StoreValue['saveTrade']>((t) => {
    setTrades((prev) => {
      const item: Trade = { ...t, id: t.id ?? newId(), createdAt: t.createdAt ?? Date.now() } as Trade;
      const exists = prev.some((p) => p.id === item.id);
      const next = exists ? prev.map((p) => (p.id === item.id ? item : p)) : [item, ...prev];
      next.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
      persist(KEYS.trades, next);
      return next;
    });
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persist(KEYS.trades, next);
      return next;
    });
  }, []);

  const toggleLesson = useCallback((lessonId: string, done?: boolean) => {
    setCompleted((prev) => {
      const next = { ...prev, [lessonId]: done ?? !prev[lessonId] };
      persist(KEYS.completed, next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      persist(KEYS.settings, next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, welcomed: false, isLoggedIn: false };
      persist(KEYS.settings, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ ready, trades, saveTrade, deleteTrade, completed, toggleLesson, settings, updateSettings, logout }),
    [ready, trades, saveTrade, deleteTrade, completed, toggleLesson, settings, updateSettings, logout],
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
