import { defineProject } from 'vitest/config';
import path from 'node:path';

export default defineProject({
  test: {
    name: 'admin',
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
