import type { Trade } from '../domain/trade';

export interface CloudUserData {
  completed: Record<string, boolean>;
  trades: Trade[];
}

export interface UserDataRemote {
  fetchUserData(userId: string): Promise<CloudUserData>;
  /** Penulisan mengembalikan true bila berhasil di server (false = gagal/offline; akan diulang via outbox). */
  saveLessonProgress(userId: string, lessonId: string, completed: boolean): Promise<boolean>;
  saveTrade(userId: string, trade: Trade): Promise<boolean>;
  deleteTrade(userId: string, tradeId: string): Promise<boolean>;
  updateProfileName(userId: string, name: string | null): Promise<void>;
}
