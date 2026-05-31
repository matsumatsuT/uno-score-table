import 'server-only';

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@/server/db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Node.js ランタイム上で動くとき、@neondatabase/serverless は明示的に WebSocket 実装を要求する
// （Edge ランタイムでは window.WebSocket が使われるのでこの代入は無害）
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
