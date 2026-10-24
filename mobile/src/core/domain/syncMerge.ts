import { compareTradesDesc, Trade } from './trade';

export function mergeCompleted(
  cloud: Record<string, boolean>,
  local: Record<string, boolean>
): { merged: Record<string, boolean>; toUpload: string[] } {
  const toUpload = Object.entries(local)
    .filter(([id, done]) => done && !cloud[id])
    .map(([id]) => id);
  return { merged: { ...cloud, ...local }, toUpload };
}

export function mergeUnlocked(
  cloud: Record<string, number>,
  local: Record<string, number> | undefined
): { merged: Record<string, number>; toUpload: [string, number][] } {
  const toUpload = Object.entries(local || {}).filter(([id]) => !cloud[id]);
  return { merged: { ...cloud, ...(local || {}) }, toUpload };
}

export function mergeTrades(cloud: Trade[], local: Trade[]): { merged: Trade[]; toUpload: Trade[] } {
  const byId = new Map<string, Trade>();
  cloud.forEach((t) => byId.set(t.id, t));
  const toUpload: Trade[] = [];
  local.forEach((t) => {
    if (!byId.has(t.id)) toUpload.push(t);
    byId.set(t.id, t);
  });
  const merged = Array.from(byId.values()).sort(compareTradesDesc);
  return { merged, toUpload };
}
