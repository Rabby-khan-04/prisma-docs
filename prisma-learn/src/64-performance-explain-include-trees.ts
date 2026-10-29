// Chapter 64 — read the generated SQL and keep include trees small.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ silent: true });
let queries = 0;
prisma.$on('query', () => {
  queries += 1;
});

// A three-level include is several queries, not one magic join.
queries = 0;
const deep = await prisma.customer.findMany({
  where: { tenantId: 'ten_acme' },
  include: {
    orders: {
      include: {
        items: { include: { product: true } },
        payments: true,
      },
    },
  },
});
const bytes = Buffer.byteLength(JSON.stringify(deep, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)));
console.log('deep include queries:', queries, 'customers:', deep.length, 'payload bytes:', bytes);

// Pagination first, relations second: `take` limits the parents, not children.
queries = 0;
const paged = await prisma.customer.findMany({
  where: { tenantId: 'ten_acme' },
  take: 1,
  orderBy: { createdAt: 'asc' },
  select: {
    name: true,
    orders: {
      take: 1,
      orderBy: { placedAt: 'desc' },
      select: { number: true, totalCents: true, items: { select: { productName: true, quantity: true } } },
    },
  },
});
console.log('paged include queries:', queries, 'payload:', paged);

// The join PostgreSQL sees for the parent/child relationship.
const plan = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT c.id, o.id, o.total_cents
  FROM customers c
  LEFT JOIN orders o ON o.tenant_id = c.tenant_id AND o.customer_id = c.id
  WHERE c.tenant_id = ${'ten_acme'}
`;
console.log('--- join plan ---');
console.log(plan.map((row) => row['QUERY PLAN']).join('\n'));

// Write cost: one interactive transaction with order + items + payment.
const ROLLBACK = Symbol('rollback');
queries = 0;
try {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        tenantId: 'ten_acme',
        customerId: 'cus_acme_alice',
        number: 'CH64-COST',
        status: 'PENDING',
        subtotalCents: 4900,
        totalCents: 4900,
        items: {
          create: [
            {
              productId: 'prd_acme_mouse',
              productName: 'Trail Mouse',
              sku: 'ACME-MOU-01',
              unitPriceCents: 4900,
              quantity: 1,
              lineTotalCents: 4900,
            },
          ],
        },
        payments: {
          create: [
            {
              provider: 'stripe',
              providerRef: 'pi_ch64_cost',
              amountCents: 4900,
              status: 'PENDING',
            },
          ],
        },
      },
      select: { id: true },
    });
    console.log('nested write created order:', order.id);
    throw { [ROLLBACK]: true };
  });
} catch (error) {
  if (!(error && typeof error === 'object' && ROLLBACK in error)) throw error;
}
console.log('nested write queries (rolled back):', queries);

await prisma.$disconnect();
