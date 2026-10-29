// Chapter 60 — connection pooling.
// The pool size is a hard limit. Extra queries wait in the queue.
import { createPrisma } from './lib/prisma.js';

async function bench(poolMax: number, concurrency: number) {
  const client = createPrisma({ logSql: false, max: poolMax });
  const started = performance.now();
  await Promise.all(
    Array.from(
      { length: concurrency },
      () => client.$queryRaw`SELECT count(*)::int AS ok FROM (SELECT pg_sleep(0.15)) AS sleep`,
    ),
  );
  const elapsed = Math.round(performance.now() - started);
  await client.$disconnect();
  return { poolMax, concurrency, elapsedMs: elapsed };
}

console.log('each query sleeps 150ms');
console.log(await bench(2, 6));
console.log(await bench(6, 6));
console.log(await bench(1, 4));

// Server limits: the pool must stay below what PostgreSQL allows.
const settings = createPrisma({ logSql: false });
const [limits] = await settings.$queryRaw<Array<{ max_connections: string; superuser_reserved: string }>>`
  SELECT current_setting('max_connections') AS max_connections,
         current_setting('superuser_reserved_connections') AS superuser_reserved
`;
console.log('server limits:', limits);
await settings.$disconnect();

// Pool sizing rule of thumb:
//   app_instances * pool_max + admin_reserve < max_connections
console.log('example: 4 instances * 10 connections + 5 reserved = 45 < 100');

// PgBouncer notes (Prisma 7 + adapter-pg):
// - transaction mode multiplexes many clients onto few server connections.
// - session-level features (LISTEN, session temp tables, some prepared statements)
//   are not safe in transaction mode.
// - set the pg pool small when a pooler is in front; the pooler does the fan-in.
