import type { Outbox } from '../domain/outbox';
import { mergeCompleted, mergeTrades } from '../domain/syncMerge';
import type { Trade } from '../domain/trade';
import type { CloudUserData } from '../ports/userDataRemote';

export interface LocalUserData {
  completed: Record<string, boolean>;
  unlocked: Record<string, number> | undefined;
  trades: Trade[];
}

export interface ReconcileResult {
  completed: Record<string, boolean>;
  unlocked: Record<string, number>;
  trades: Trade[];
  uploads: {
    lessons: string[];
    trades: Trade[];
  };
}

/**
 * `outbox` = penulisan lokal yang belum sampai ke cloud. Trade yang dihapus secara lokal tetapi
 * belum terhapus di cloud tidak boleh muncul kembali.
 */
export function reconcileUserData(cloud: CloudUserData, local: LocalUserData, outbox?: Outbox): ReconcileResult {
  const completed = mergeCompleted(cloud.completed, local.completed);
  const cloudTrades = outbox ? cloud.trades.filter((t) => outbox.trades[t.id] !== 'delete') : cloud.trades;
  const trades = mergeTrades(cloudTrades, local.trades);
  return {
    completed: completed.merged,
    unlocked: local.unlocked ?? {},  // medali hanya lokal
    trades: trades.merged,
    uploads: { lessons: completed.toUpload, trades: trades.toUpload },
  };
}
