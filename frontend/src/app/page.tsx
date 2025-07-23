'use client';

import { useRouter } from 'next/navigation';
import { PlayerRegistration } from '@/components/PlayerRegistration';
import { trpc } from '@/utils/trpc';

export default function Home() {
  const router = useRouter();
  const createSessionMutation = trpc.createSession.useMutation();

  const handlePlayersComplete = async (playerNames: string[]) => {
    try {
      const result = await createSessionMutation.mutateAsync({ 
        players: playerNames 
      });
      
      // ゲーム画面に遷移
      router.push(`/game/${result.sessionId}`);
    } catch (error) {
      console.error('セッション作成エラー:', error);
      alert('セッションの作成に失敗しました');
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