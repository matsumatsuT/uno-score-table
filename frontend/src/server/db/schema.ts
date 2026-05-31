import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ────────────────────────────────────────────────
// プレイヤーマスタ
// セッションをまたいで存在する。name は unique 制約あり。
// ────────────────────────────────────────────────
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ────────────────────────────────────────────────
// セッション本体（ユーザ用語: ゲーム）
// ────────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ────────────────────────────────────────────────
// セッション参加プレイヤー（中間テーブル）
// position は表示順
// ────────────────────────────────────────────────
export const sessionPlayers = pgTable(
  'session_players',
  {
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.playerId] })]
);

// ────────────────────────────────────────────────
// 試合（ユーザ用語: 試合）
// 同一セッション内で sequence は一意
// ────────────────────────────────────────────────
export const games = pgTable(
  'games',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [uniqueIndex('games_session_sequence_idx').on(t.sessionId, t.sequence)]
);

// ────────────────────────────────────────────────
// 試合結果（試合 × プレイヤー）
// ────────────────────────────────────────────────
export const gameResults = pgTable(
  'game_results',
  {
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'restrict' }),
    points: integer('points').notNull(),
    isWinner: boolean('is_winner').notNull(),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.playerId] })]
);

export type Player = typeof players.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GameResultRow = typeof gameResults.$inferSelect;
