// Prisma 7 configuration file (replaces datasource url / generator config from v6).
// Docs: https://www.prisma.io/docs/orm/reference/prisma-config-reference
import 'dotenv/config'; // Prisma 7 does NOT load .env automatically.
import { defineConfig } from 'prisma/config';

// ---------------------------------------------------------------------------
// Hard safety gate: this project may only talk to the local throwaway DB.
// The same rule is enforced by scripts/preflight.mjs before every npm script.
// ---------------------------------------------------------------------------
const rawUrl = process.env.DATABASE_URL ?? '';
const url = new URL(rawUrl);
const allowed =
  ['postgresql:', 'postgres:'].includes(url.protocol) &&
  ['localhost', '127.0.0.1', '::1'].includes(url.hostname) &&
  url.port === '5433' &&
  url.pathname === '/prisma_learn' &&
  url.username === 'postgres';

if (!allowed) {
  throw new Error(
    'REFUSING TO RUN: DATABASE_URL must be postgresql://postgres:***@localhost:5433/prisma_learn',
  );
}

export default defineConfig({
  // Where the schema lives.
  schema: 'prisma/schema.prisma',

  migrations: {
    // Where migration SQL is written.
    path: 'prisma/migrations',
    // Prisma 7 no longer seeds automatically after migrate dev/reset.
    seed: 'tsx prisma/seed.ts',
  },

  datasource: {
    // Used by the CLI for migrations, db push, Studio, etc.
    url: rawUrl,
  },
});
