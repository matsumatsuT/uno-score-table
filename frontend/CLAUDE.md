# Frontend ルール

このディレクトリで作業するときの規約。global の `nextjs-rules` skill に加えて、本プロジェクト固有のルール。

> **アーキテクチャ**: Next.js 集約構成。`frontend/` 1つで FE + API + DB アクセスを完結。別 backend サーバーは存在しない（旧 `backend/` ディレクトリは廃止済み）。

---

## 1. 構成サマリ

| レイヤ | 配置 |
|---|---|
| ページ / UI | `src/app/**`, `src/components/**` |
| tRPC ルーター | `src/server/routers/gameRouter.ts` |
| tRPC エンドポイント | `src/app/api/trpc/[trpc]/route.ts` |
| DB スキーマ（Drizzle） | `src/server/db/schema.ts` |
| DB 接続 | `src/server/db/index.ts`（`@neondatabase/serverless` + `drizzle-orm/neon-serverless`） |
| マイグレーション | `src/server/db/migrations/` |
| シード | `scripts/seed.ts` |

DB は **Neon Postgres**。接続文字列は `.env.local` の `DATABASE_URL`。

### db スクリプト
```bash
pnpm db:generate   # スキーマからマイグレーション SQL を生成
pnpm db:migrate    # 生成済みマイグレーションを Neon に適用
pnpm db:push       # generate + apply（dev 用、TTY が必要）
pnpm db:studio     # ブラウザで DB を覗ける GUI
pnpm db:seed       # PRESET プレイヤーを投入（idempotent）
```

---

## 2. import パス規約

### 原則
- **`../` で上に登る相対 import は禁止**
- `@/*` で frontend/src 以下を参照

### 使い分け
| 対象 | 書き方 | 例 |
|---|---|---|
| `src/` 内の他ディレクトリ | `@/...` | `import { Loading } from '@/components/ui/Loading'` |
| **同一フォルダ内の colocate ファイル** | `./Sibling`（許可） | `import { ResultsView } from './ResultsView'` |

### なぜ colocate だけ `./` を許すか
App Router の page と同フォルダに配置された専用コンポーネントは、`./` の方が **colocation の意図** が読み手に伝わる。`@/app/game/[sessionId]/results/ResultsView` のように動的ルートのブラケットがパスに混じる alias は可読性を毀損するため。

### alias の追加方法
`tsconfig.json` の `compilerOptions.paths` に追加 → IDE で `TypeScript: Restart TS Server`。

---

## 3. tRPC 利用規約

### 採用パッケージ
- **`@trpc/tanstack-react-query` (v11.17+)** を使用
- クラシックの `@trpc/react-query` / `createTRPCReact` は使わない

### 主要ファイル
- `src/utils/trpc.ts` … `createTRPCContext<AppRouter>()` から `TRPCProvider` / `useTRPC` / `useTRPCClient` を export
- `src/utils/trpc.server.ts` … Server Component 用。`createTRPCOptionsProxy({ router, ctx, queryClient })` で **HTTP を経由せず router を直接呼ぶ**
- `src/providers/TrpcProvider.tsx` … `httpBatchLink({ url: '/api/trpc' })` でクライアント側はバッチング有効

### 呼び出しパターン

**Client Component**:
```ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/utils/trpc';

const trpc = useTRPC();
const { data } = useQuery(trpc.getSession.queryOptions({ id }));
const mutation = useMutation(trpc.createSession.mutationOptions());
```

**Server Component（prefetch）**:
```ts
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient, serverTrpc } from '@/utils/trpc.server';

const queryClient = getQueryClient();
await queryClient.prefetchQuery(serverTrpc.getSession.queryOptions({ id }));
return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <ClientView id={id} />
  </HydrationBoundary>
);
```

### 禁止事項
- **手書きの `queryKey: [...]` で `useQuery` を呼ばない**。`queryOptions(...)` 経由必須（prefetch と key が食い違うとキャッシュヒットしなくなる）

### 現在の procedure（5つ）
| procedure | 種別 | 用途 |
|---|---|---|
| `listPlayers` | query | プレイヤーマスタ一覧 |
| `addPlayer` | mutation | プレイヤー追加（同名は idempotent に既存返却） |
| `createSession` | mutation | セッション作成（`playerIds` で参加者指定） |
| `addGameResult` | mutation | 試合追加 |
| `getSession` | query | セッション全データ取得（players, games, summary 統合） |

### prefetch の状態
| ページ | 状態 |
|---|---|
| `/` | データなし、SessionCreator で client side mutation のみ |
| `/game/[id]` | useQuery のみ（mutation 主体なので prefetch 不要） |
| `/game/[id]/results` | ✅ Server Component で `getSession` prefetch 済み |
| `/game/[id]/finished` | useQuery のみ |

---

## 4. DB スキーマ

5テーブル。`onDelete` ルールに注意:
- `sessions` → `session_players`, `games`: cascade（セッション削除で連鎖）
- `players` → `session_players`, `game_results`: restrict（参照中は削除不可）

| テーブル | 主な役割 |
|---|---|
| `players` | プレイヤーマスタ。`name` UNIQUE |
| `sessions` | セッション（ユーザー用語: ゲーム） |
| `session_players` | セッション参加者の中間テーブル（`position` で表示順保持） |
| `games` | セッション内の試合（`sequence` UNIQUE per session） |
| `game_results` | 試合 × プレイヤーの結果（`points`, `is_winner`） |

ID はすべて UUID。トランザクションは `db.transaction()`（Pool 経由で WebSocket）。

### マスタプレイヤーの追加方針
- `addPlayer` procedure で UI から追加可能
- 重複は idempotent（同名なら既存を返す）
- 初期 seed: 父, 母, ちほ, 大貴, たいき, はるな（`scripts/seed.ts`）

---

## 5. Server / Client Component の分離

- ページ（`page.tsx`）は **デフォルトで Server Component**
- 静的なレイアウトは Server Component 側に置く
- インタラクションが要る部分だけ Client Component に切り出し、ツリーの葉に配置
- 共通 loading UI は `@/components/ui/Loading`、ルートセグメントの loading は `app/loading.tsx`

---

## 6. その他

- 型定義は `type`（`interface` は使わない）
- コンポーネント定義はアロー関数（`function` 宣言は使わない）
- 上記2点は global の `nextjs-rules` 由来
