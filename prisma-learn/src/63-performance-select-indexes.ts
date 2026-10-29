// Chapter 63 — select only what you need, and index the filters you use.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const full = await prisma.product.findMany({ where: { tenantId: 'ten_acme' } });
const narrow = await prisma.product.findMany({
  where: { tenantId: 'ten_acme' },
  select: { id: true, name: true, priceCents: true },
});
const asJson = (value: unknown) => JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v));
console.log('full row bytes:', Buffer.byteLength(asJson(full)));
console.log('narrow row bytes:', Buffer.byteLength(asJson(narrow)));
console.log('same row count:', full.length, narrow.length);

// Measure many repetitions to smooth out noise.
async function time(label: string, fn: () => Promise<unknown>, runs = 200) {
  const started = performance.now();
  for (let i = 0; i < runs; i += 1) await fn();
  console.log(label, Math.round(performance.now() - started), 'ms /', runs, 'runs');
}
await time('full rows   ', () => prisma.product.findMany({ where: { tenantId: 'ten_acme' } }));
await time('narrow rows ', () =>
  prisma.product.findMany({ where: { tenantId: 'ten_acme' }, select: { id: true, name: true, priceCents: true } }),
);

// `contains` cannot use a normal B-tree index; `startsWith` can use the prefix.
const containsPlan = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT id, name FROM products
  WHERE tenant_id = ${'ten_acme'} AND name ILIKE ${'%trail%'}
`;
console.log('--- contains (%trail%) ---');
console.log(containsPlan.map((row) => row['QUERY PLAN']).join('\n'));

const prefixPlan = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT id, name FROM products
  WHERE tenant_id = ${'ten_acme'} AND name LIKE ${'Trail%'}
`;
console.log('--- startsWith (Trail%) ---');
console.log(prefixPlan.map((row) => row['QUERY PLAN']).join('\n'));

const indexes = await prisma.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
  SELECT indexname, indexdef FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'products'
  ORDER BY indexname
`;
console.log('product indexes:');
for (const index of indexes) console.log('-', index.indexdef);

await prisma.$disconnect();
