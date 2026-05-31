'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { GameBoard } from '@/components/GameBoard';
import { Loading } from '@/components/ui/Loading';
import { useTRPC } from '@/utils/trpc';

type GameResult = {
  playerId: string;
  points: number;
  isWinner: boolean;
};

const GamePage = () => {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [submitting, setSubmitting] = useState(false);

  const trpc = useTRPC();
  const sessionQuery = useQuery(trpc.getSession.queryOptions({ id: sessionId }));
  const addGameResult = useMutation(trpc.addGameResult.mutationOptions());

  const handleGameComplete = async (results: GameResult[]) => {
    try {
      setSubmitting(true);
      await addGameResult.mutateAsync({ sessionId, results });
      router.push(`/game/${sessionId}/results`);
    } catch (error) {
      console.error('ゲーム結果保存エラー:', error);
      alert('ゲーム結果の保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionQuery.error) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xl text-red-600 mb-4">エラーが発生しました</p>
          <p className="text-gray-600 mb-4">{sessionQuery.error.message}</p>
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

  if (sessionQuery.isLoading || submitting) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Loading
            message={
              submitting ? 'ゲーム結果を保存中...' : 'セッション情報を読み込み中...'
            }
          />
        </div>
      </main>
    );
  }

  if (!sessionQuery.data) {
    router.push('/');
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          UNO Score Table
        </h1>

        <GameBoard
          players={sessionQuery.data.players}
          onGameComplete={handleGameComplete}
        />
      </div>
    </main>
  );
};

export default GamePage;
