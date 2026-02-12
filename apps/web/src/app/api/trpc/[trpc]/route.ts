import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@hsafx/api';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('trpc');

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => createContext({ headers: req.headers }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            log.error('tRPC failed', { path: path ?? '<no-path>', error: error.message });
          }
        : undefined,
  });

export { handler as GET, handler as POST };
