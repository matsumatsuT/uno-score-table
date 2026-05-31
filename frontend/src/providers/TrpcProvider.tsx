'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { useState, type ReactNode } from 'react';
import type { AppRouter } from '@/server/routers/gameRouter';
import { TRPCProvider } from '@/utils/trpc';

type TrpcProviderProps = {
  children: ReactNode;
};

export const TrpcProvider = ({ children }: TrpcProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      // Next.js Route Handler でマウントした tRPC エンドポイントを叩く
      // 相対 URL なのでブラウザのオリジン（dev: 3333, prod: 本番ドメイン）に追従する
      links: [httpBatchLink({ url: '/api/trpc' })],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
};
