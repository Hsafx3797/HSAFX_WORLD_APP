import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@hsafx/api';

export const trpc = createTRPCReact<AppRouter>();
