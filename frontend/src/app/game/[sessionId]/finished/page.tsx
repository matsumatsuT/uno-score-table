'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/Loading';
import { useTRPC } from '@/utils/trpc';

const FinishedPage = () => {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const trpc = useTRPC();
  const sessionQuery = useQuery(
    trpc.getSession.queryOptions({ id: sessionId })
  );

  const handleStartOver = () => {
    router.push('/');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}円`;
  };

  if (sessionQuery.error) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xl text-red-600 mb-4">エラーが発生しました</p>
          <p className="text-gray-600 mb-4">{sessionQuery.error.message}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ホームに戻る
          </button>
        </div>
      </main>
    );
  }

  if (sessionQuery.isLoading || !sessionQuery.data) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Loading message="セッション情報を読み込み中..." />
        </div>
      </main>
    );
  }

  const session = sessionQuery.data;
  const { balances, settlements } = session.summary;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">
              セッション終了
            </h2>
            <p className="text-gray-600 mb-8">
              全 {session.games.length} 試合が完了しました。お疲れ様でした！
            </p>

            {/* 最終精算 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">最終精算</h3>
              {settlements.length > 0 ? (
                <div className="space-y-3">
                  {settlements.map((settlement, index) => (
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
            {balances.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">各プレイヤーの収支</h3>
                <div className="space-y-2">
                  {[...balances]
                    .sort((a, b) => b.netBalance - a.netBalance)
                    .map((balance) => (
                      <div
                        key={balance.playerId}
                        className={`p-4 rounded-lg ${
                          balance.netBalance > 0
                            ? 'bg-green-100 text-green-800'
                            : balance.netBalance < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <span className="font-bold">
                          {balance.playerName}:{' '}
                        </span>
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
};

export default FinishedPage;
