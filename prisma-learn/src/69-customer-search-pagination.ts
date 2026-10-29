// Chapter 69 — customer search with tenant scope and cursor pagination.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const ids = Array.from({ length: 12 }, (_, i) => `cus_ch69_${String(i + 1).padStart(2, '0')}`);
await prisma.customer.createMany({
  data: ids.map((id, i) => ({
    id,
    tenantId: i % 2 === 0 ? 'ten_acme' : 'ten_globex',
    email: `${id}@example.test`,
    name: `Search User ${String(i + 1).padStart(2, '0')}`,
    displayName: `Search ${i + 1}`,
  })),
  skipDuplicates: true,
});

const search = 'Search User';
const pageSize = 3;

const page1 = await prisma.customer.findMany({
  where: {
    tenantId: 'ten_acme',
    deletedAt: null,
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ],
  },
  orderBy: [{ name: 'asc' }, { id: 'asc' }],
  take: pageSize,
  select: { id: true, name: true, tenantId: true },
});
console.log('page 1:', page1);

const page2 = await prisma.customer.findMany({
  where: {
    tenantId: 'ten_acme',
    deletedAt: null,
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ],
  },
  orderBy: [{ name: 'asc' }, { id: 'asc' }],
  cursor: { id: page1.at(-1)!.id },
  skip: 1,
  take: pageSize,
  select: { id: true, name: true, tenantId: true },
});
console.log('page 2:', page2);

const total = await prisma.customer.count({
  where: {
    tenantId: 'ten_acme',
    deletedAt: null,
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ],
  },
});
console.log('total matching in acme:', total);
console.log('every row is acme:', [...page1, ...page2].every((row) => row.tenantId === 'ten_acme'));

// The query plan for the contains filter: no B-tree prefix, so expect a scan.
const plan = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT id, name FROM customers
  WHERE tenant_id = ${'ten_acme'} AND deleted_at IS NULL AND name ILIKE ${'%Search User%'}
  ORDER BY name ASC, id ASC
  LIMIT ${pageSize}
`;
console.log('--- search plan ---');
console.log(plan.map((row) => row['QUERY PLAN']).join('\n'));

// Indexes that support the common path (tenant + name) and the cursor.
const indexes = await prisma.$queryRaw<Array<{ indexdef: string }>>`
  SELECT indexdef FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'customers'
  ORDER BY indexname
`;
console.log('customer indexes:');
for (const index of indexes) console.log('-', index.indexdef);

await prisma.customer.deleteMany({ where: { id: { in: ids } } });
console.log('cleanup done');

await prisma.$disconnect();
