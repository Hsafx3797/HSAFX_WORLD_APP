import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/shared',
  'packages/schemas',
  'packages/tools',
  'packages/tool-definitions',
  'packages/api',
  'packages/ui',
  'packages/theme',
  'packages/db',
]);
