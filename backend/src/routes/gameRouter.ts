import { z } from 'zod';
import { initTRPC } from '@trpc/server';
import { GameSession } from '../types';
import { calculateGamePayments, calculateTotalBalances, calculateIndividualSettlements } from '../utils/gameCalculations';

const t = initTRPC.create();

let gameData: {
  sessions: Map<string, GameSession>;
  currentSessionId: string | null;
} = {
  sessions: new Map(),
  currentSessionId: null,
};

export const gameRouter = t.router({
  createSession: t.procedure
    .input(z.object({
      players: z.array(z.string()),
    }))
    .mutation(({ input }) => {
      const sessionId = Date.now().toString();
      const players = input.players.map((name, index) => ({
        id: `player_${index}`,
        name,
      }));
      
      gameData.sessions.set(sessionId, {
        id: sessionId,
        players,
        games: [],
        createdAt: new Date(),
      });
      gameData.currentSessionId = sessionId;
      
      return { sessionId, players };
    }),

  addGameResult: t.procedure
    .input(z.object({
      sessionId: z.string(),
      results: z.array(z.object({
        playerId: z.string(),
        points: z.number(),
        isWinner: z.boolean(),
      })),
    }))
    .mutation(({ input }) => {
      const session = gameData.sessions.get(input.sessionId);
      if (!session) throw new Error('Session not found');

      const gameId = `game_${session.games.length + 1}`;
      const gameResults = input.results.map(result => ({
        gameId,
        ...result,
      }));

      session.games.push({
        id: gameId,
        results: gameResults,
      });

      const payments = calculateGamePayments(gameResults, session.players);
      
      return { gameId, payments };
    }),

  getSession: t.procedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(({ input }) => {
      const session = gameData.sessions.get(input.sessionId);
      if (!session) throw new Error('Session not found');
      
      return session;
    }),

  calculateFinalBalances: t.procedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(({ input }) => {
      const session = gameData.sessions.get(input.sessionId);
      if (!session) throw new Error('Session not found');

      const allGamesResults = session.games.map(game => game.results);
      const balances = calculateTotalBalances(allGamesResults, session.players);
      const individualSettlements = calculateIndividualSettlements(allGamesResults, session.players);
      
      return { balances, individualSettlements };
    }),

  getCurrentSession: t.procedure
    .query(() => {
      if (!gameData.currentSessionId) return null;
      
      const session = gameData.sessions.get(gameData.currentSessionId);
      return session || null;
    }),

  getGameHistory: t.procedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(({ input }) => {
      const session = gameData.sessions.get(input.sessionId);
      if (!session) throw new Error('Session not found');
      
      return session.games.map(game => ({
        id: game.id,
        results: game.results,
        payments: calculateGamePayments(game.results, session.players),
      }));
    }),

  finishSession: t.procedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(({ input }) => {
      const session = gameData.sessions.get(input.sessionId);
      if (!session) throw new Error('Session not found');
      
      const allGamesResults = session.games.map(game => game.results);
      const balances = calculateTotalBalances(allGamesResults, session.players);
      const individualSettlements = calculateIndividualSettlements(allGamesResults, session.players);
      
      // セッション終了時の処理（必要に応じて）
      
      return { 
        sessionId: input.sessionId,
        totalGames: session.games.length,
        balances, 
        individualSettlements 
      };
    }),
});

export type AppRouter = typeof gameRouter;