import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    projects: [
      'packages/shared',
      'packages/schemas',
      'packages/tools',
      'packages/api',
      'packages/ui',
      {
        test: {
          name: 'web',
          root: './apps/web',
          globals: true,
          environment: 'node',
          include: ['src/**/__tests__/**/*.test.ts'],
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'apps/web/src'),
          },
        },
      },
      {
        test: {
          name: 'admin',
          root: './apps/admin',
          globals: true,
          environment: 'node',
          include: ['src/**/__tests__/**/*.test.ts'],
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'apps/admin/src'),
          },
        },
      },
    ],
  },
});
