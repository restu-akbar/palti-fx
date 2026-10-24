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

export function compareTradesDesc(a: Trade, b: Trade): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt;
}

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

export function upsertTrade(trades: Trade[], item: Trade): Trade[] {
  const exists = trades.some((p) => p.id === item.id);
  const next = exists ? trades.map((p) => (p.id === item.id ? item : p)) : [item, ...trades];
  next.sort(compareTradesDesc);
  return next;
}
