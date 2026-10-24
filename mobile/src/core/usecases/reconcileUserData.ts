import { mergeCompleted, mergeTrades, mergeUnlocked } from '../domain/syncMerge';
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
    achievements: [string, number][];
    trades: Trade[];
  };
}

export function reconcileUserData(cloud: CloudUserData, local: LocalUserData): ReconcileResult {
  const completed = mergeCompleted(cloud.completed, local.completed);
  const unlocked = mergeUnlocked(cloud.unlocked || {}, local.unlocked);
  const trades = mergeTrades(cloud.trades, local.trades);
  return {
    completed: completed.merged,
    unlocked: unlocked.merged,
    trades: trades.merged,
    uploads: { lessons: completed.toUpload, achievements: unlocked.toUpload, trades: trades.toUpload },
  };
}
