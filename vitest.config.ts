import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __APP_ENV__: JSON.stringify('local'),
    __APP_VERSION__: JSON.stringify('test'),
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    restoreMocks: true,
    testTimeout: 15000,
  },
});
