import type { Trade } from '../domain/trade';

export interface CloudUserData {
  completed: Record<string, boolean>;
  unlocked: Record<string, number>;
  trades: Trade[];
}

export interface UserDataRemote {
  fetchUserData(userId: string): Promise<CloudUserData>;
  saveLessonProgress(userId: string, lessonId: string, completed: boolean): Promise<void>;
  saveAchievement(userId: string, achievementId: string, unlockedAt: number): Promise<void>;
  saveTrade(userId: string, trade: Trade): Promise<void>;
  deleteTrade(userId: string, tradeId: string): Promise<void>;
  updateProfileName(userId: string, name: string | null): Promise<void>;
}
