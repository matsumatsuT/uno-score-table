import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { TopPage } from '@/components/TopPage';
import { getQueryClient, serverTrpc } from '@/utils/trpc.server';

const Top = async () => {
  const queryClient = getQueryClient();
  // TopPage が使う listPlayers を事前取得し、
  // クライアント側の初回ローディングを消す
  await queryClient.prefetchQuery(serverTrpc.listPlayers.queryOptions());

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          UNO Score Table
        </h1>

        <HydrationBoundary state={dehydrate(queryClient)}>
          <TopPage />
        </HydrationBoundary>
      </div>
    </main>
  );
};

export default Top;
