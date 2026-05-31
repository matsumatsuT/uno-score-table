import { initTRPC, TRPCError } from '@trpc/server';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/server/db';
import {
  gameResults,
  games,
  players,
  sessionPlayers,
  sessions,
} from '@/server/db/schema';
import type { GameResult, Player } from '@/server/types';
import {
  calculateGamePayments,
  calculateIndividualSettlements,
  calculateTotalBalances,
} from '@/server/utils/gameCalculations';

const t = initTRPC.create();

const uuid = z.string().uuid();

export const gameRouter = t.router({
  // ────────────────────────────────────────────────
  // プレイヤーマスタ
  // ────────────────────────────────────────────────
  listPlayers: t.procedure.query(async () => {
    return await db
      .select({ id: players.id, name: players.name })
      .from(players)
      .orderBy(asc(players.createdAt));
  }),

  addPlayer: t.procedure
    .input(z.object({ name: z.string().trim().min(1).max(50) }))
    .mutation(async ({ input }) => {
      // 既存と同名なら追加せず、既存を返す（idempotent）
      const [inserted] = await db
        .insert(players)
        .values({ name: input.name })
        .onConflictDoNothing({ target: players.name })
        .returning({ id: players.id, name: players.name });

      if (inserted) return inserted;

      const [existing] = await db
        .select({ id: players.id, name: players.name })
        .from(players)
        .where(eq(players.name, input.name))
        .limit(1);
      if (!existing) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Player upsert failed',
        });
      }
      return existing;
    }),

  // ────────────────────────────────────────────────
  // セッション
  // ────────────────────────────────────────────────
  createSession: t.procedure
    .input(
      z.object({
        playerIds: z.array(uuid).min(2),
      })
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const [session] = await tx
          .insert(sessions)
          .values({})
          .returning({ id: sessions.id });

        await tx.insert(sessionPlayers).values(
          input.playerIds.map((playerId, position) => ({
            sessionId: session.id,
            playerId,
            position,
          }))
        );

        return { id: session.id };
      });
    }),

  addGameResult: t.procedure
    .input(
      z.object({
        sessionId: uuid,
        results: z
          .array(
            z.object({
              playerId: uuid,
              points: z.number().int().nonnegative(),
              isWinner: z.boolean(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        // 該当セッションの最新 sequence + 1 を採番
        const lastGame = await tx
          .select({ sequence: games.sequence })
          .from(games)
          .where(eq(games.sessionId, input.sessionId))
          .orderBy(desc(games.sequence))
          .limit(1);
        const nextSequence = (lastGame[0]?.sequence ?? 0) + 1;

        const [game] = await tx
          .insert(games)
          .values({
            sessionId: input.sessionId,
            sequence: nextSequence,
          })
          .returning({ id: games.id });

        await tx.insert(gameResults).values(
          input.results.map((r) => ({
            gameId: game.id,
            playerId: r.playerId,
            points: r.points,
            isWinner: r.isWinner,
          }))
        );

        return { gameId: game.id };
      });
    }),

  getSession: t.procedure
    .input(z.object({ id: uuid }))
    .query(async ({ input }) => {
      // セッション本体
      const [session] = await db
        .select({ id: sessions.id, createdAt: sessions.createdAt })
        .from(sessions)
        .where(eq(sessions.id, input.id))
        .limit(1);

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // 参加プレイヤー（position 順）
      const sessionPlayerRows = await db
        .select({
          id: players.id,
          name: players.name,
          position: sessionPlayers.position,
        })
        .from(sessionPlayers)
        .innerJoin(players, eq(sessionPlayers.playerId, players.id))
        .where(eq(sessionPlayers.sessionId, input.id))
        .orderBy(asc(sessionPlayers.position));

      const sessionPlayersForCalc: Player[] = sessionPlayerRows.map((p) => ({
        id: p.id,
        name: p.name,
      }));

      // 試合（sequence 順）
      const gameRows = await db
        .select({
          id: games.id,
          sequence: games.sequence,
        })
        .from(games)
        .where(eq(games.sessionId, input.id))
        .orderBy(asc(games.sequence));

      // 全試合の結果を一括取得
      const gameIds = gameRows.map((g) => g.id);
      const resultRows = gameIds.length
        ? await db
            .select({
              gameId: gameResults.gameId,
              playerId: gameResults.playerId,
              points: gameResults.points,
              isWinner: gameResults.isWinner,
            })
            .from(gameResults)
            .where(inArray(gameResults.gameId, gameIds))
        : [];

      // 試合ごとに結果を束ねつつ payments を計算
      const gamesWithDetail = gameRows.map((g) => {
        const results: GameResult[] = resultRows
          .filter((r) => r.gameId === g.id)
          .map((r) => ({
            gameId: r.gameId,
            playerId: r.playerId,
            points: r.points,
            isWinner: r.isWinner,
          }));

        const payments = calculateGamePayments(results, sessionPlayersForCalc);

        return {
          id: g.id,
          sequence: g.sequence,
          results,
          payments,
        };
      });

      // セッション全体のサマリ（累計収支と最適化精算）
      const allGamesResults = gamesWithDetail.map((g) => g.results);
      const balances = calculateTotalBalances(
        allGamesResults,
        sessionPlayersForCalc
      );
      const settlements = calculateIndividualSettlements(
        allGamesResults,
        sessionPlayersForCalc
      );

      return {
        id: session.id,
        createdAt: session.createdAt,
        players: sessionPlayersForCalc,
        games: gamesWithDetail,
        summary: {
          balances,
          settlements,
        },
      };
    }),
});

export type AppRouter = typeof gameRouter;
