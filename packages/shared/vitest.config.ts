import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/types.ts', 'src/**/__tests__/**'],
      thresholds: {
        statements: 15,
        branches: 10,
        functions: 20,
        lines: 15,
      },
    },
  },
});
