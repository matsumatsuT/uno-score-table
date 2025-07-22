'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface Player {
  id: string;
  name: string;
}

interface GameBoardProps {
  players: Player[];
  onGameComplete: (results: GameResult[]) => void;
}

interface GameResult {
  playerId: string;
  points: number;
  isWinner: boolean;
}

interface FormData {
  [key: string]: string;
}

export function GameBoard({ players, onGameComplete }: GameBoardProps) {
  const [winner, setWinner] = useState<string>('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  const watchedValues = watch();

  const submitGame = (data: FormData) => {
    const results: GameResult[] = players.map(player => ({
      playerId: player.id,
      points: player.id === winner ? 0 : parseInt(data[player.id] || '0'),
      isWinner: player.id === winner,
    }));

    onGameComplete(results);
  };

  const isValid = () => {
    if (!winner) return false;
    
    for (const player of players) {
      if (player.id !== winner) {
        const points = watchedValues[player.id];
        if (!points || parseInt(points) < 0) return false;
      }
    }
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">試合結果入力</h2>
      
      <form onSubmit={handleSubmit(submitGame)} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">勝者を選択</h3>
          <div className="grid grid-cols-2 gap-2">
            {players.map(player => (
              <label key={player.id} className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value={player.id}
                  checked={winner === player.id}
                  onChange={(e) => setWinner(e.target.value)}
                  className="mr-2"
                />
                <span>{player.name}</span>
              </label>
            ))}
          </div>
        </div>

        {winner && (
          <div>
            <h3 className="text-lg font-semibold mb-3">各プレイヤーのポイント</h3>
            <div className="space-y-3">
              {players.map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">{player.name}</span>
                  {player.id === winner ? (
                    <span className="text-green-600 font-bold">勝者 (0ポイント)</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        {...register(player.id, { 
                          required: 'ポイントを入力してください',
                          min: { value: 0, message: '0以上の値を入力してください' }
                        })}
                        type="number"
                        min="0"
                        placeholder="ポイント"
                        className="w-20 p-2 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">ポイント</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid()}
          className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 font-semibold"
        >
          試合結果を記録
        </button>
      </form>
    </div>
  );
}