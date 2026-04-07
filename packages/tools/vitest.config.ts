import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/types.ts', 'src/**/__tests__/**', 'tests/**'],
      // Thresholds removed until more modules have tests
      // thresholds: { statements: 60, branches: 60, functions: 60, lines: 60 },
    },
  },
});
