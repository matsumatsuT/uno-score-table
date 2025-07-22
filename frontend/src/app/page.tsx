'use client';

import { useState } from 'react';
import { PlayerRegistration } from '../components/PlayerRegistration';
import { GameBoard } from '../components/GameBoard';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { calculateGamePayments, calculateTotalBalances } from '../utils/gameCalculations';

type GameState = 'registration' | 'playing' | 'results' | 'finished';

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

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('registration');
  const [sessionId, setSessionId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [finalBalances, setFinalBalances] = useState<any[]>([]);

  // Mock tRPC functionality for now
  // const createSessionMutation = trpc.createSession.useMutation();
  // const addGameResultMutation = trpc.addGameResult.useMutation();
  // const { data: balances } = trpc.calculateFinalBalances.useQuery(
  //   { sessionId },
  //   { enabled: sessionId !== '' && games.length > 0 }
  // );

  const handlePlayersComplete = async (playerNames: string[]) => {
    // Mock session creation
    const sessionId = Date.now().toString();
    const playersData = playerNames.map((name, index) => ({
      id: `player_${index}`,
      name,
    }));
    
    setSessionId(sessionId);
    setPlayers(playersData);
    setGameState('playing');
  };

  const handleGameComplete = async (results: GameResult[]) => {
    const gameId = `game_${games.length + 1}`;
    const payments = calculateGamePayments(results, players);

    const newGame: Game = {
      id: gameId,
      results,
      payments,
    };

    setGames(prev => [...prev, newGame]);
    
    // Calculate updated balances
    const allGamesResults = [...games, newGame].map(game => game.results);
    const balances = calculateTotalBalances(allGamesResults, players);
    setFinalBalances(balances);
    
    setGameState('results');
  };

  const handleNewGame = () => {
    setGameState('playing');
  };

  const handleFinishSession = () => {
    setGameState('finished');
  };

  const handleStartOver = () => {
    setGameState('registration');
    setSessionId('');
    setPlayers([]);
    setGames([]);
    setFinalBalances([]);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          UNO Score Table
        </h1>
        
        {gameState === 'registration' && (
          <PlayerRegistration onComplete={handlePlayersComplete} />
        )}

        {gameState === 'playing' && (
          <GameBoard
            players={players}
            onGameComplete={handleGameComplete}
          />
        )}

        {gameState === 'results' && (
          <ResultsDisplay
            players={players}
            games={games}
            finalBalances={finalBalances}
            onNewGame={handleNewGame}
            onFinishSession={handleFinishSession}
          />
        )}

        {gameState === 'finished' && (
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">セッション終了</h2>
              <p className="text-gray-600 mb-8">
                全 {games.length} 試合が完了しました。お疲れ様でした！
              </p>
              
              {finalBalances.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">最終結果</h3>
                  <div className="space-y-2">
                    {finalBalances
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
                          {balance.netBalance.toLocaleString()}円
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
        )}
      </div>
    </main>
  );
}