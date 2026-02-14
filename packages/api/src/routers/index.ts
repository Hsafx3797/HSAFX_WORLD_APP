import { router } from '../trpc';
import { userRouter } from './user';
import { billingRouter } from './billing';
import { toolsRouter } from './tools';
import { adminRouter } from './admin';
import { rewardsRouter } from './rewards';
import { apiKeysRouter } from './api-keys';

export const appRouter = router({
  user: userRouter,
  billing: billingRouter,
  tools: toolsRouter,
  admin: adminRouter,
  rewards: rewardsRouter,
  apiKeys: apiKeysRouter,
});

export type AppRouter = typeof appRouter;
