// Chapter 18 — indexes: what Prisma created and whether PostgreSQL uses it.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const indexes = await prisma.$queryRaw<Array<{ tablename: string; indexname: string; indexdef: string }>>`
  SELECT tablename, indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename IN ('products', 'orders', 'order_items')
  ORDER BY tablename, indexname
`;
console.table(indexes);

const plan = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT id, name, price_cents
  FROM products
  WHERE tenant_id = ${'ten_acme'} AND active = ${true}
  ORDER BY created_at DESC
  LIMIT 10
`;
console.log(plan.map((row) => row['QUERY PLAN']).join('\n'));

await prisma.$disconnect();
