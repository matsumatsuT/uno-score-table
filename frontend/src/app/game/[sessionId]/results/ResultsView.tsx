'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { Loading } from '@/components/ui/Loading';
import { useTRPC } from '@/utils/trpc';

type ResultsViewProps = {
  sessionId: string;
};

export const ResultsView = ({ sessionId }: ResultsViewProps) => {
  const router = useRouter();
  const trpc = useTRPC();

  // 統合 getSession 1 本。サーバーで prefetch 済みのため初回描画時点で data あり
  const sessionQuery = useQuery(
    trpc.getSession.queryOptions({ id: sessionId })
  );

  const handleNewGame = () => {
    router.push(`/game/${sessionId}`);
  };

  const handleFinishSession = () => {
    router.push(`/game/${sessionId}/finished`);
  };

  if (sessionQuery.error) {
    return (
      <div className="text-center">
        <p className="text-xl text-red-600 mb-4">エラーが発生しました</p>
        <p className="text-gray-600 mb-4">{sessionQuery.error.message}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  // 通常は prefetch 済みでここを通らないが、クライアント側で再取得が発生した場合のフォールバック
  if (!sessionQuery.data) {
    return <Loading message="結果を読み込み中..." />;
  }

  const session = sessionQuery.data;

  return (
    <ResultsDisplay
      players={session.players}
      games={session.games}
      onNewGame={handleNewGame}
      onFinishSession={handleFinishSession}
    />
  );
};
