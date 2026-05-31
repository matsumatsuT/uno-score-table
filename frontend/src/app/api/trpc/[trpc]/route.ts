import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { gameRouter } from '@/server/routers/gameRouter';

// Next.js App Router の Route Handler 上で tRPC をマウントする
// /api/trpc/<procedure> でクライアントからアクセス可能
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: gameRouter,
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };
