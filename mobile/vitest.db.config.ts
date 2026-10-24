import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['supabase/tests/**/*.test.ts'],
    globalSetup: ['./supabase/tests/globalSetup.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
