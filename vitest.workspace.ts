import { defineWorkspace } from 'vitest/config';
import path from 'node:path';

export default defineWorkspace([
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
]);
