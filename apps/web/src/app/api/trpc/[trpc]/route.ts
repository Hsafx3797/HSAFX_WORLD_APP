import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@hsafx/api';
import { createLogger } from '@hsafx/shared/logger';
import { auth } from '@/lib/auth';

const log = createLogger('trpc');

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const sessionResult = await auth.api.getSession({ headers: req.headers });
      return createContext({
        headers: req.headers,
        session: sessionResult?.session ?? null,
        user: sessionResult?.user ?? null,
      });
    },
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            log.error('tRPC failed', { path: path ?? '<no-path>', error: error.message });
          }
        : undefined,
  });

export { handler as GET, handler as POST };
