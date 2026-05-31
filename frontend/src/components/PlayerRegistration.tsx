'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loading } from '@/components/ui/Loading';
import { useTRPC } from '@/utils/trpc';

type PlayerRegistrationProps = {
  onComplete: (playerIds: string[]) => void;
};

type FormData = {
  newPlayerName: string;
};

export const PlayerRegistration = ({ onComplete }: PlayerRegistrationProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const playersQuery = useQuery(trpc.listPlayers.queryOptions());
  const addPlayer = useMutation({
    ...trpc.addPlayer.mutationOptions(),
    onSuccess: async (newPlayer) => {
      // マスタ一覧を最新化 + 追加した本人を自動選択
      await queryClient.invalidateQueries({
        queryKey: trpc.listPlayers.queryKey(),
      });
      setSelectedIds((prev) => new Set(prev).add(newPlayer.id));
      reset();
    },
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const newPlayerName = watch('newPlayerName');

  const toggleSelect = (playerId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const all = playersQuery.data ?? [];
    setSelectedIds(new Set(all.map((p) => p.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const handleAddPlayer = (data: FormData) => {
    addPlayer.mutate({ name: data.newPlayerName.trim() });
  };

  const handleStartGame = () => {
    if (selectedIds.size >= 2) {
      onComplete(Array.from(selectedIds));
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
            {selectedIds.size > 0 && (
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
              const isSelected = selectedIds.has(player.id);
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
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm font-semibold text-blue-900">
            選択中: {selectedIds.size}名
          </p>
        </div>
      )}

      <button
        onClick={handleStartGame}
        disabled={selectedIds.size < 2}
        className="w-full py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 font-semibold"
      >
        ゲーム開始 {selectedIds.size >= 2 ? '' : '(最低2名必要)'}
      </button>
    </div>
  );
};
