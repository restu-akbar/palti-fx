import type { UserScopedSettings } from '../domain/settings';
import type { Trade } from '../domain/trade';

export interface UserCacheBundle {
  trades: Trade[];
  completed: Record<string, boolean>;
  achievements: Record<string, number>;
  settings: UserScopedSettings;
}

export interface UserCache {
  loadAll(user?: string | null): Promise<UserCacheBundle>;
  saveTrades(user: string | null | undefined, trades: Trade[]): Promise<void>;
  saveCompleted(user: string | null | undefined, completed: Record<string, boolean>): Promise<void>;
  saveAchievements(user: string | null | undefined, unlocked: Record<string, number>): Promise<void>;
  saveSettings(user: string | null | undefined, settings: UserScopedSettings): Promise<void>;
}
