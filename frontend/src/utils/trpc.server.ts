import 'server-only';

import { QueryClient } from '@tanstack/react-query';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { gameRouter } from '@/server/routers/gameRouter';

// React の cache でリクエストスコープの QueryClient を1個に固定する
// 同じリクエスト内で何度呼んでも同じインスタンスが返り、
// prefetch と dehydrate がきちんと連動する
export const getQueryClient = cache(() => new QueryClient());

// Next.js に集約済みなので、サーバー側 prefetch では HTTP を経由せず
// router を直接 in-process で呼び出す（HTTP ホップが消えて高速 & 環境変数で URL を持つ必要も無い）
export const serverTrpc = createTRPCOptionsProxy({
  router: gameRouter,
  ctx: () => ({}),
  queryClient: getQueryClient,
});
