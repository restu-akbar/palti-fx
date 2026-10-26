import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Satu salinan React saja (workspace mobile memakai versi lain di node_modules root)
    dedupe: ['react', 'react-dom'],
  },
  test: {
    // Paket CJS yang ter-hoist ke node_modules root (lucide-react, use-sync-external-store) memuat React milik
    // workspace mobile. Arahkan ke build ESM / shim lokal agar semua memakai satu salinan React web.
    server: { deps: { inline: [/lucide-react/, /@tiptap/] } },
    alias: {
      'lucide-react': 'lucide-react/dist/esm/lucide-react.mjs',
      'use-sync-external-store/shim/index.js': fileURLToPath(new URL('./src/test/useSyncExternalStoreShim.ts', import.meta.url)),
      'use-sync-external-store/shim/with-selector.js': fileURLToPath(new URL('./src/test/useSyncExternalStoreShim.ts', import.meta.url)),
    },
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/lib/supabase.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { statements: 80, lines: 80, functions: 80, branches: 65 },
    },
  },
});
