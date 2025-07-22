import { z } from 'zod';

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const GameResultSchema = z.object({
  gameId: z.string(),
  playerId: z.string(),
  points: z.number(),
  isWinner: z.boolean(),
});

export const GameSessionSchema = z.object({
  id: z.string(),
  players: z.array(PlayerSchema),
  games: z.array(z.object({
    id: z.string(),
    results: z.array(GameResultSchema),
  })),
  createdAt: z.date(),
});

export type Player = z.infer<typeof PlayerSchema>;
export type GameResult = z.infer<typeof GameResultSchema>;
export type GameSession = z.infer<typeof GameSessionSchema>;