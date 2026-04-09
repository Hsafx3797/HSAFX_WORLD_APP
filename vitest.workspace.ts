import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/shared',
  'packages/schemas',
  'packages/tools',
  'packages/api',
  'packages/ui',
  'apps/web',
  'apps/admin',
]);
