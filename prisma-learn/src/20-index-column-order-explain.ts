// Chapter 20 — index column order and EXPLAIN.
// Index: (tenant_id, active, created_at). Leftmost columns must be present.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const friendly = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT id FROM products
  WHERE tenant_id = ${'ten_acme'} AND active = ${true}
  ORDER BY created_at DESC
  LIMIT 10
`;
console.log('--- tenant_id + active + created_at (index-friendly) ---');
console.log(friendly.map((row) => row['QUERY PLAN']).join('\n'));

const wrongPrefix = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT id FROM products
  WHERE active = ${true}
  ORDER BY created_at DESC
  LIMIT 10
`;
console.log('--- active only (index prefix missing) ---');
console.log(wrongPrefix.map((row) => row['QUERY PLAN']).join('\n'));

await prisma.$disconnect();
