/**
 * Storage berpotongan (chunked) agar sesi Supabase (JWT > 2KB) muat di
 * expo-secure-store yang membatasi nilai ±2048 byte per key.
 * Backend disuntikkan supaya bisa diuji di Node.
 */
export interface KVBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const CHUNK = 1800;

export function createChunkedStorage(backend: KVBackend, chunkSize = CHUNK): KVBackend {
  const countKey = (k: string) => `${k}.count`;
  const partKey = (k: string, i: number) => `${k}.${i}`;

  async function clear(key: string) {
    const raw = await backend.getItem(countKey(key));
    const n = raw ? parseInt(raw, 10) : 0;
    for (let i = 0; i < (Number.isFinite(n) ? n : 0); i++) await backend.removeItem(partKey(key, i));
    await backend.removeItem(countKey(key));
  }

  return {
    async getItem(key) {
      const raw = await backend.getItem(countKey(key));
      if (raw == null) return null;
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n) || n < 0) return null;
      let out = '';
      for (let i = 0; i < n; i++) {
        const part = await backend.getItem(partKey(key, i));
        if (part == null) return null; // data rusak → anggap tidak ada sesi
        out += part;
      }
      return out;
    },
    async setItem(key, value) {
      await clear(key);
      const parts: string[] = [];
      for (let i = 0; i < value.length; i += chunkSize) parts.push(value.slice(i, i + chunkSize));
      for (let i = 0; i < parts.length; i++) await backend.setItem(partKey(key, i), parts[i]);
      await backend.setItem(countKey(key), String(parts.length));
    },
    async removeItem(key) {
      await clear(key);
    },
  };
}
