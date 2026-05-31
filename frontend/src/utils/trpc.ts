import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { AppRouter } from '@/server/routers/gameRouter';

// 新 API: createTRPCContext からプロバイダとフックを取得する
// - TRPCProvider: コンポーネントツリーに tRPC クライアントを供給
// - useTRPC: queryOptions / mutationOptions を返すプロキシ
// - useTRPCClient: 生の tRPC クライアント（フック外で呼び出したい場合用）
export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
