import { router } from '../trpc';
import { userRouter } from './user';
import { billingRouter } from './billing';
import { toolsRouter } from './tools';
import { adminRouter } from './admin';
import { adsRouter } from './ads';

export const appRouter = router({
  user: userRouter,
  billing: billingRouter,
  tools: toolsRouter,
  admin: adminRouter,
  ads: adsRouter,
});

export type AppRouter = typeof appRouter;
