'use client';

import { useRouter, useParams } from 'next/navigation';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { trpc } from '@/utils/trpc';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  // tRPCでデータを取得
  const { data: session, isLoading: sessionLoading, error: sessionError } = trpc.getSession.useQuery({ sessionId });
  const { data: gameHistory, isLoading: historyLoading, error: historyError } = trpc.getGameHistory.useQuery({ sessionId });
  const { data: balanceData, isLoading: balanceLoading, error: balanceError } = trpc.calculateFinalBalances.useQuery({ sessionId });

  const handleNewGame = () => {
    router.push(`/game/${sessionId}`);
  };

  const handleFinishSession = () => {
    router.push(`/game/${sessionId}/finished`);
  };

  // エラーハンドリング
  if (sessionError || historyError || balanceError) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-xl text-red-600 mb-4">エラーが発生しました</div>
          <div className="text-gray-600 mb-4">
            {sessionError?.message || historyError?.message || balanceError?.message}
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ホームに戻る
          </button>
        </div>
      </main>
    );
  }

  // ローディング状態
  if (sessionLoading || historyLoading || balanceLoading || !session || !gameHistory || !balanceData) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-xl">結果を読み込み中...</div>
          <div className="text-sm text-gray-500 mt-2">
            セッションID: {sessionId}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ResultsDisplay
          players={session.players}
          games={gameHistory}
          finalBalances={balanceData.balances}
          individualSettlements={balanceData.individualSettlements}
          onNewGame={handleNewGame}
          onFinishSession={handleFinishSession}
        />
      </div>
    </main>
  );
}