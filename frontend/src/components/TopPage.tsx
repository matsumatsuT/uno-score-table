'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loading } from '@/components/ui/Loading';
import { useTRPC } from '@/utils/trpc';

type FormData = {
  newPlayerName: string;
};

// `/` の client 画面。
// プレイヤー一覧表示 / 選択 / マスタへの新規追加 / セッション作成 + 遷移を1コンポーネントに集約。
export const TopPage = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const playersQuery = useQuery(trpc.listPlayers.queryOptions());
  const addPlayer = useMutation({
    ...trpc.addPlayer.mutationOptions(),
    onSuccess: async (newPlayer) => {
      // マスタ一覧を最新化 + 追加した本人を自動選択
      await queryClient.invalidateQueries({
        queryKey: trpc.listPlayers.queryKey(),
      });
      setSelectedIds((prev) =>
        prev.includes(newPlayer.id) ? prev : [...prev, newPlayer.id]
      );
      reset();
    },
  });
  const createSession = useMutation(trpc.createSession.mutationOptions());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const newPlayerName = watch('newPlayerName');

  const toggleSelect = (playerId: string) => {
    setSelectedIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAll = () => {
    const all = playersQuery.data ?? [];
    setSelectedIds(all.map((p) => p.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const handleAddPlayer = (data: FormData) => {
    addPlayer.mutate({ name: data.newPlayerName.trim() });
  };

  const handleStartGame = async () => {
    if (selectedIds.length < 2) return;
    try {
      const result = await createSession.mutateAsync({ playerIds: selectedIds });
      router.push(`/game/${result.id}`);
    } catch (error) {
      // createSession.error に反映されるため、UI 側のエラー表示で扱う
      console.error('セッション作成エラー:', error);
    }
  };

  if (playersQuery.isLoading) {
    return <Loading message="プレイヤー一覧を読み込み中..." />;
  }

  if (playersQuery.error) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-red-600">エラー: {playersQuery.error.message}</p>
      </div>
    );
  }

  if (createSession.isPending) {
    return <Loading message="セッションを作成中..." />;
  }

  if (createSession.error) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-xl text-red-600 mb-4">エラーが発生しました</p>
        <p className="text-gray-600 mb-4">{createSession.error.message}</p>
        <button
          type="button"
          onClick={() => createSession.reset()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          再試行
        </button>
      </div>
    );
  }

  const players = playersQuery.data ?? [];

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">参加メンバー選択</h2>

      {/* 既存プレイヤー一覧（マスタから） */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">プレイヤー一覧</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-sm px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              全員選択
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-sm px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                クリア
              </button>
            )}
          </div>
        </div>
        {players.length === 0 ? (
          <p className="text-sm text-gray-500">
            プレイヤーが登録されていません。下から追加してください。
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {players.map((player) => {
              const isSelected = selectedIds.includes(player.id);
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => toggleSelect(player.id)}
                  className={`px-3 py-1 rounded border transition-colors ${
                    isSelected
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  {player.name} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 新規追加（マスタに登録） */}
      <form onSubmit={handleSubmit(handleAddPlayer)} className="mb-6">
        <h3 className="font-semibold mb-2">新しいプレイヤーを追加</h3>
        <div className="flex gap-2">
          <input
            {...register('newPlayerName', {
              required: '名前を入力してください',
              validate: (value) => {
                const trimmed = value.trim();
                if (!trimmed) return '名前を入力してください';
                if (players.some((p) => p.name === trimmed)) {
                  return '同じ名前のプレイヤーが既に存在します（上のリストから選択してください）';
                }
                return true;
              },
            })}
            placeholder="プレイヤー名を入力"
            disabled={addPlayer.isPending}
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!newPlayerName?.trim() || addPlayer.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {addPlayer.isPending ? '...' : '追加'}
          </button>
        </div>
        {errors.newPlayerName && (
          <p className="text-red-500 text-sm mt-1">
            {errors.newPlayerName.message}
          </p>
        )}
        {addPlayer.error && (
          <p className="text-red-500 text-sm mt-1">
            {addPlayer.error.message}
          </p>
        )}
      </form>

      {/* 選択数表示 */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm font-semibold text-blue-900">
            選択中: {selectedIds.length}名
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleStartGame}
        disabled={selectedIds.length < 2}
        className="w-full py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 font-semibold"
      >
        ゲーム開始 {selectedIds.length >= 2 ? '' : '(最低2名必要)'}
      </button>
    </div>
  );
};
