'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { GameBoard } from '@/components/GameBoard';
import { trpc } from '@/utils/trpc';

interface GameResult {
  playerId: string;
  points: number;
  isWinner: boolean;
}

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [loading, setLoading] = useState(false);
  
  // tRPCでセッション情報を取得
  const { data: session, isLoading, error } = trpc.getSession.useQuery({ sessionId });
  const addGameResultMutation = trpc.addGameResult.useMutation();

  const handleGameComplete = async (results: GameResult[]) => {
    try {
      setLoading(true);
      await addGameResultMutation.mutateAsync({ sessionId, results });
      
      // 結果表示画面に遷移
      router.push(`/game/${sessionId}/results`);
    } catch (error) {
      console.error('ゲーム結果保存エラー:', error);
      alert('ゲーム結果の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // エラーハンドリング
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-xl text-red-600 mb-4">エラーが発生しました</div>
          <div className="text-gray-600 mb-4">{error.message}</div>
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-xl">セッション情報を読み込み中...</div>
          <div className="text-sm text-gray-500 mt-2">
            セッションID: {sessionId}
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-xl">セッション情報を読み込み中...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          UNO Score Table
        </h1>
        
        <GameBoard
          players={session.players}
          onGameComplete={handleGameComplete}
        />
      </div>
    </main>
  );
}