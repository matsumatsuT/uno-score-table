import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next.js のバンドラに渡さず、node_modules から直接使う
  // ws は bufferutil/utf-8-validate のオプショナルなネイティブ依存を抱えていて、
  // バンドルされると "bufferUtil.mask is not a function" のような実行時エラーが出る
  serverExternalPackages: ['ws', '@neondatabase/serverless'],
};

export default nextConfig;
