import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/core/**/*.ts'],
      exclude: ['src/lib/supabase.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { statements: 90, lines: 90, functions: 90, branches: 80 },
    },
  },
});
