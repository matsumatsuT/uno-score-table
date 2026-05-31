import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// .env.local を読み込む（Next.js 規約に合わせる）
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env.local');
}

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './src/server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // 開発用途では verbose / strict は厳しめにしておく
  verbose: true,
  strict: true,
});
