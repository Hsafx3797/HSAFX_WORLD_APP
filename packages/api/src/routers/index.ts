import { router } from '../trpc';
import { userRouter } from './user';
import { billingRouter } from './billing';
import { toolsRouter } from './tools';
import { adminRouter } from './admin';
import { apiKeysRouter } from './api-keys';
import { b2bRouter } from './b2b';

export const appRouter = router({
  user: userRouter,
  billing: billingRouter,
  tools: toolsRouter,
  admin: adminRouter,
  apiKeys: apiKeysRouter,
  b2b: b2bRouter,
});

export type AppRouter = typeof appRouter;
