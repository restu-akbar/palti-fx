import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
