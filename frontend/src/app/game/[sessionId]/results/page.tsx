import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient, serverTrpc } from '@/utils/trpc.server';
import { ResultsView } from './ResultsView';

type ResultsPageProps = {
  params: Promise<{ sessionId: string }>;
};

const ResultsPage = async ({ params }: ResultsPageProps) => {
  const { sessionId } = await params;
  const queryClient = getQueryClient();

  // 統合された getSession を 1 回 prefetch するだけ
  await queryClient.prefetchQuery(
    serverTrpc.getSession.queryOptions({ id: sessionId })
  );

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ResultsView sessionId={sessionId} />
        </HydrationBoundary>
      </div>
    </main>
  );
};

export default ResultsPage;
