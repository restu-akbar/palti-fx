export interface Trade {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  symbol: string;
  direction: 'BUY' | 'SELL';
  lot: number;
  entry?: number;
  exit?: number;
  sl?: number;
  tp?: number;
  pl: number; // USD
  pips?: number;
  setup?: string;
  emotion?: string;
  notes?: string;
  createdAt: number;
}

export interface TradeSummary {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number;
  netProfit: number;
  profitFactor: number | null;
  bestTrade: number;
  worstTrade: number;
}
