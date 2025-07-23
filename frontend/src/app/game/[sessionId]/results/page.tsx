'use client';

import { useRouter, useParams } from 'next/navigation';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { trpc } from '@/utils/trpc';

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

interface Game {
  id: string;
  results: GameResult[];
  payments: PaymentRecord[];
}

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

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  // tRPCでデータを取得
  const { data: session } = trpc.getSession.useQuery({ sessionId });
  const { data: gameHistory } = trpc.getGameHistory.useQuery({ sessionId });
  const { data: balanceData } = trpc.calculateFinalBalances.useQuery({ sessionId });

  const handleNewGame = () => {
    router.push(`/game/${sessionId}`);
  };

  const handleFinishSession = () => {
    router.push(`/game/${sessionId}/finished`);
  };

  if (!session || !gameHistory || !balanceData) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-xl">結果を読み込み中...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ResultsDisplay
          players={session.players}
          games={gameHistory}
          finalBalances={balanceData.balances}
          individualSettlements={balanceData.individualSettlements}
          onNewGame={handleNewGame}
          onFinishSession={handleFinishSession}
        />
      </div>
    </main>
  );
}