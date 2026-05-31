// 計算・API レスポンスで使う共通型
// DB スキーマの行型ではない（DB 行型は @/server/db/schema を参照）

export type Player = {
  id: string;
  name: string;
};

export type GameResult = {
  gameId: string;
  playerId: string;
  points: number;
  isWinner: boolean;
};
