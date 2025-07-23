'use client';

import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/utils/trpc';

interface PlayerBalance {
  playerId: string;
  playerName: string;
  totalPaid: number;
  totalReceived: number;
  netBalance: number;
}

interface IndividualSettlement {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
}

export default function FinishedPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  // tRPCでセッション情報を取得
  const { data: session } = trpc.getSession.useQuery({ sessionId });
  const { data: balanceData } = trpc.calculateFinalBalances.useQuery({ sessionId });

  const handleStartOver = () => {
    router.push('/');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}円`;
  };

  if (!session || !balanceData) {
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
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">セッション終了</h2>
            <p className="text-gray-600 mb-8">
              全 {session.games.length} 試合が完了しました。お疲れ様でした！
            </p>
            
            {/* 最終精算 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">最終精算</h3>
              {balanceData.individualSettlements.length > 0 ? (
                <div className="space-y-3">
                  {balanceData.individualSettlements.map((settlement, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-800">
                          {settlement.fromPlayerName}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="font-medium text-gray-800">
                          {settlement.toPlayerName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-red-600">
                          {formatCurrency(settlement.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  精算不要です
                </div>
              )}
            </div>

            {/* 各プレイヤーの収支 */}
            {balanceData.balances.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">各プレイヤーの収支</h3>
                <div className="space-y-2">
                  {balanceData.balances
                    .sort((a, b) => b.netBalance - a.netBalance)
                    .map(balance => (
                    <div 
                      key={balance.playerId} 
                      className={`p-4 rounded-lg ${
                        balance.netBalance > 0 ? 'bg-green-100 text-green-800' :
                        balance.netBalance < 0 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <span className="font-bold">{balance.playerName}: </span>
                      <span className="text-lg">
                        {balance.netBalance > 0 ? '+' : ''}
                        {formatCurrency(balance.netBalance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={handleStartOver}
              className="px-8 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
            >
              新しいセッションを開始
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}