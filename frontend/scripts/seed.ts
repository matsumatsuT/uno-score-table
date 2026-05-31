import { config } from 'dotenv';
config({ path: '.env.local' });

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { players } from '@/server/db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

neonConfig.webSocketConstructor = ws;

const PRESET_PLAYERS = ['父', '母', 'ちほ', '大貴', 'たいき', 'はるな'];

const main = async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log(`Seeding ${PRESET_PLAYERS.length} preset players...`);

  // name UNIQUE 制約により、既に存在する場合はスキップ（idempotent）
  const rows = PRESET_PLAYERS.map((name) => ({ name }));
  const inserted = await db
    .insert(players)
    .values(rows)
    .onConflictDoNothing({ target: players.name })
    .returning({ id: players.id, name: players.name });

  console.log(`Inserted ${inserted.length} new players:`);
  inserted.forEach((p) => console.log(`  - ${p.name} (${p.id})`));

  if (inserted.length < PRESET_PLAYERS.length) {
    console.log(
      `${PRESET_PLAYERS.length - inserted.length} players already existed, skipped.`
    );
  }

  await pool.end();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
