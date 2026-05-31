'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PlayerRegistration } from '@/components/PlayerRegistration';
import { Loading } from '@/components/ui/Loading';
import { useTRPC } from '@/utils/trpc';

export const SessionCreator = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const createSession = useMutation(trpc.createSession.mutationOptions());

  const handlePlayersComplete = async (playerIds: string[]) => {
    try {
      const result = await createSession.mutateAsync({ playerIds });
      // ゲーム画面に遷移
      router.push(`/game/${result.id}`);
    } catch (error) {
      // mutation.error に反映されるため、UI 側のエラー表示で扱う
      console.error('セッション作成エラー:', error);
    }
  };

  if (createSession.isPending) {
    return <Loading message="セッションを作成中..." />;
  }

  if (createSession.error) {
    return (
      <div className="text-center">
        <p className="text-xl text-red-600 mb-4">エラーが発生しました</p>
        <p className="text-gray-600 mb-4">{createSession.error.message}</p>
        <button
          onClick={() => createSession.reset()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          再試行
        </button>
      </div>
    );
  }

  return <PlayerRegistration onComplete={handlePlayersComplete} />;
};
