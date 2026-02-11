import { db } from '@hsafx/db';
import type { User, Session } from '@hsafx/db/schema';

export interface Context {
  db: typeof db;
  session: Session | null;
  user: (User & { role: string }) | null;
  headers: Headers;
}

export const createContext = async (opts: {
  headers: Headers;
  session?: Session | null;
  user?: (User & { role: string }) | null;
}): Promise<Context> => {
  return {
    db,
    session: opts.session ?? null,
    user: opts.user ?? null,
    headers: opts.headers,
  };
};
