'use client';

import { useState } from 'react';

interface Player {
  id: string;
  name: string;
}

interface GameResult {
  playerId: string;
  points: number;
  isWinner: boolean;
}

interface PaymentRecord {
  from: string;
  to: string;
  amount: number;
}

interface ResultsDisplayProps {
  players: Player[];
  games: Array<{
    id: string;
    results: GameResult[];
    payments: PaymentRecord[];
  }>;
  onNewGame: () => void;
  onFinishSession: () => void;
}

export function ResultsDisplay({
  players,
  games,
  onNewGame,
  onFinishSession,
}: ResultsDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || playerId;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}円`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">試合結果</h2>
        <p className="text-gray-600">現在 {games.length} 試合完了</p>
      </div>

      {/* 試合概要 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">試合概要</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            {showDetails ? '詳細を非表示' : '詳細を表示'}
          </button>
        </div>
        <div className="text-center text-gray-600">
          <span className="text-2xl font-bold text-gray-800">{games.length}</span> 試合完了
        </div>
      </div>

      {/* 試合詳細（切り替え表示） */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">試合履歴</h3>
          <div className="space-y-4">
            {games.map((game, index) => {
              const winner = game.results.find(r => r.isWinner);
              const winnerName = winner ? getPlayerName(winner.playerId) : '不明';

              return (
                <div key={game.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">{index + 1}試合目</h4>
                    <span className="text-green-600 font-bold">勝者: {winnerName}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">ポイント詳細</h5>
                      <ul className="space-y-1 text-sm">
                        {game.results.map(result => (
                          <li key={result.playerId} className="flex justify-between">
                            <span>{getPlayerName(result.playerId)}</span>
                            <span className={result.isWinner ? 'text-green-600 font-bold' : ''}>
                              {result.isWinner ? '勝者' : `${result.points}ポイント`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">支払い詳細</h5>
                      <ul className="space-y-1 text-sm">
                        {game.payments.map((payment, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>
                              {getPlayerName(payment.from)} → {getPlayerName(payment.to)}
                            </span>
                            <span className="font-bold text-red-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={onNewGame}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
        >
          次の試合
        </button>
        <button
          onClick={onFinishSession}
          className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
        >
          セッション終了
        </button>
      </div>
    </div>
  );
}
