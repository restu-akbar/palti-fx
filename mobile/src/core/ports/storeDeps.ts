import type { Settings } from '../domain/settings';
import type { UserCache } from './userCache';
import type { UserDataRemote } from './userDataRemote';

export interface StoreDeps {
  remote: UserDataRemote;
  cache: UserCache;
  currentUserId(): Promise<string | null>;
  signOutLocal(): void;
  getNickname(user: string): Promise<string | null>;
  setNickname(user: string | undefined, name: string): Promise<void>;
  loadDeviceSettings(): Promise<Settings>;
  saveDeviceSettings(value: Settings): void;
}
