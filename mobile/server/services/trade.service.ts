import { Trade, TradeSummary } from '../models/trade.model';

const tradesDb: Map<string, Trade[]> = new Map();

export class TradeService {
  static getUserTrades(userId: string): Trade[] {
    const list = tradesDb.get(userId) || [];
    return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  }

  static saveTrade(userId: string, tradeData: Omit<Trade, 'id' | 'userId' | 'createdAt'> & { id?: string; createdAt?: number }): Trade {
    const list = tradesDb.get(userId) || [];
    const id = tradeData.id || 'tr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const createdAt = tradeData.createdAt || Date.now();

    const newTrade: Trade = {
      ...tradeData,
      id,
      userId,
      createdAt,
    };

    const index = list.findIndex((t) => t.id === id);
    if (index >= 0) {
      list[index] = newTrade;
    } else {
      list.unshift(newTrade);
    }

    tradesDb.set(userId, list);
    return newTrade;
  }

  static deleteTrade(userId: string, tradeId: string): boolean {
    const list = tradesDb.get(userId) || [];
    const nextList = list.filter((t) => t.id !== tradeId);
    if (nextList.length === list.length) {
      return false;
    }
    tradesDb.set(userId, nextList);
    return true;
  }

  static getSummary(userId: string): TradeSummary {
    const trades = this.getUserTrades(userId);
    const totalTrades = trades.length;

    let winCount = 0;
    let lossCount = 0;
    let breakevenCount = 0;
    let totalWin = 0;
    let totalLoss = 0;
    let netProfit = 0;
    let bestTrade = 0;
    let worstTrade = 0;

    for (const t of trades) {
      const pl = t.pl || 0;
      netProfit += pl;
      if (pl > 0) {
        winCount++;
        totalWin += pl;
        if (pl > bestTrade) bestTrade = pl;
      } else if (pl < 0) {
        lossCount++;
        totalLoss += Math.abs(pl);
        if (pl < worstTrade) worstTrade = pl;
      } else {
        breakevenCount++;
      }
    }

    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const profitFactor = lossCount === 0 ? (winCount > 0 ? null : 0) : totalWin / totalLoss;

    return {
      totalTrades,
      winCount,
      lossCount,
      breakevenCount,
      winRate: Number(winRate.toFixed(1)),
      netProfit: Number(netProfit.toFixed(2)),
      profitFactor: profitFactor === null ? null : Number(profitFactor.toFixed(2)),
      bestTrade,
      worstTrade,
    };
  }
}
