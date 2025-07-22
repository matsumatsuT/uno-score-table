'use client';

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

interface PlayerBalance {
  playerId: string;
  playerName: string;
  totalPaid: number;
  totalReceived: number;
  netBalance: number;
}

interface ResultsDisplayProps {
  players: Player[];
  games: Array<{
    id: string;
    results: GameResult[];
    payments: PaymentRecord[];
  }>;
  finalBalances: PlayerBalance[];
  onNewGame: () => void;
  onFinishSession: () => void;
}

export function ResultsDisplay({ 
  players, 
  games, 
  finalBalances, 
  onNewGame, 
  onFinishSession 
}: ResultsDisplayProps) {
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

      {/* 試合毎の結果 */}
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

      {/* 累計収支 */}
      {finalBalances.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">累計収支</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">プレイヤー</th>
                  <th className="text-right py-2">支払い合計</th>
                  <th className="text-right py-2">受取合計</th>
                  <th className="text-right py-2">収支</th>
                </tr>
              </thead>
              <tbody>
                {finalBalances
                  .sort((a, b) => b.netBalance - a.netBalance)
                  .map(balance => (
                  <tr key={balance.playerId} className="border-b">
                    <td className="py-3 font-medium">{balance.playerName}</td>
                    <td className="text-right py-3 text-red-600">
                      -{formatCurrency(balance.totalPaid)}
                    </td>
                    <td className="text-right py-3 text-green-600">
                      +{formatCurrency(balance.totalReceived)}
                    </td>
                    <td className={`text-right py-3 font-bold ${
                      balance.netBalance > 0 ? 'text-green-600' : 
                      balance.netBalance < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {balance.netBalance > 0 ? '+' : ''}
                      {formatCurrency(balance.netBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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