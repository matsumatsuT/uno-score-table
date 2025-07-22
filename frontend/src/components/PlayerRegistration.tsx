'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface PlayerRegistrationProps {
  onComplete: (players: string[]) => void;
}

interface FormData {
  playerName: string;
}

export function PlayerRegistration({ onComplete }: PlayerRegistrationProps) {
  const [players, setPlayers] = useState<string[]>([]);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>();

  const playerName = watch('playerName');

  const addPlayer = (data: FormData) => {
    if (data.playerName.trim()) {
      setPlayers([...players, data.playerName.trim()]);
      reset();
    }
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const startGame = () => {
    if (players.length >= 2) {
      onComplete(players);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">参加メンバー登録</h2>
      
      <form onSubmit={handleSubmit(addPlayer)} className="mb-6">
        <div className="flex gap-2">
          <input
            {...register('playerName', { 
              required: '名前を入力してください',
              validate: (value) => {
                if (players.includes(value.trim())) {
                  return '同じ名前のプレイヤーが既に存在します';
                }
                return true;
              }
            })}
            placeholder="プレイヤー名を入力"
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!playerName?.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            追加
          </button>
        </div>
        {errors.playerName && (
          <p className="text-red-500 text-sm mt-1">{errors.playerName.message}</p>
        )}
      </form>

      {players.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">登録済みプレイヤー ({players.length}名)</h3>
          <ul className="space-y-2">
            {players.map((player, index) => (
              <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{player}</span>
                <button
                  onClick={() => removePlayer(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={startGame}
        disabled={players.length < 2}
        className="w-full py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 font-semibold"
      >
        ゲーム開始 {players.length >= 2 ? '' : '(最低2名必要)'}
      </button>
    </div>
  );
}