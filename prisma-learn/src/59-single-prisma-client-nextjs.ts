// Chapter 59 — one PrismaClient per process.
// New clients per request leak pool connections. Reuse a singleton.
import { createPrisma, prisma as singletonA } from './lib/prisma.js';
import { prisma as singletonB } from './lib/prisma.js';

console.log('two imports of the singleton are the same object:', singletonA === singletonB);

const [pidA] = await singletonA.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`;
console.log('singleton backend pid:', pidA.pid);

// ❌ Two separate clients = two separate pools.
const leakyA = createPrisma({ logSql: false });
const leakyB = createPrisma({ logSql: false });
const [leakPidA] = await leakyA.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`;
const [leakPidB] = await leakyB.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`;
console.log('two ad-hoc clients use different backends:', leakPidA.pid, leakPidB.pid, leakPidA.pid !== leakPidB.pid);

// The Next.js dev-server pattern: globalThis survives hot reload.
const GLOBAL_KEY = Symbol.for('prisma-learn.client');
function getPrisma() {
  const globalStore = globalThis as unknown as Record<symbol, ReturnType<typeof createPrisma> | undefined>;
  if (!globalStore[GLOBAL_KEY]) {
    globalStore[GLOBAL_KEY] = createPrisma({ logSql: false });
  }
  return globalStore[GLOBAL_KEY]!;
}
console.log('getPrisma() twice returns one client:', getPrisma() === getPrisma());

const [connections] = await singletonA.$queryRaw<Array<{ n: bigint }>>`
  SELECT count(*)::bigint AS n FROM pg_stat_activity WHERE datname = current_database()
`;
console.log('connections in this database while clients are open:', connections.n.toString());

await leakyA.$disconnect();
await leakyB.$disconnect();
await getPrisma().$disconnect();

// Graceful shutdown: close the pool when the process ends.
process.on('SIGTERM', async () => {
  await singletonA.$disconnect();
  process.exit(0);
});
console.log('SIGTERM handler registered; singleton stays open for reuse');

await singletonA.$disconnect();
