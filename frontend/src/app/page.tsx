'use client';

import { useRouter } from 'next/navigation';
import { PlayerRegistration } from '@/components/PlayerRegistration';
import { trpc } from '@/utils/trpc';

export default function Home() {
  const router = useRouter();
  const createSessionMutation = trpc.createSession.useMutation();

  if (createSessionMutation.isPending) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            UNO Score Table
          </h1>
          <div className="text-xl">セッションを作成中...</div>
        </div>
      </main>
    );
  }

  if (createSessionMutation.error) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            UNO Score Table
          </h1>
          <div className="text-xl text-red-600 mb-4">エラーが発生しました</div>
          <div className="text-gray-600 mb-4">
            {createSessionMutation.error.message}
          </div>
          <button
            onClick={() => createSessionMutation.reset()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            再試行
          </button>
        </div>
      </main>
    );
  }

  const handlePlayersComplete = async (playerNames: string[]) => {
    try {
      console.log('セッション作成開始:', { players: playerNames });
      
      const result = await createSessionMutation.mutateAsync({ 
        players: playerNames 
      });
      
      console.log('セッション作成成功:', result);
      
      // ゲーム画面に遷移
      router.push(`/game/${result.sessionId}`);
    } catch (error) {
      console.error('セッション作成エラー:', error);
      console.error('エラーの詳細:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'セッションの作成に失敗しました';
        
      alert(`エラーが発生しました: ${errorMessage}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          UNO Score Table
        </h1>
        
        <PlayerRegistration onComplete={handlePlayersComplete} />
      </div>
    </main>
  );
}