// Chapter 72 — admin customer list with totals, without N+1.
// 2 queries total: page of customers + grouped order stats.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ silent: true });
let selects = 0;
prisma.$on('query', (event) => {
  if (event.query.trim().toUpperCase().startsWith('SELECT')) selects += 1;
});

const tenantId = 'ten_acme';
const pageSize = 2;
const page = 1;

selects = 0;
const customers = await prisma.customer.findMany({
  where: { tenantId, deletedAt: null },
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  skip: (page - 1) * pageSize,
  take: pageSize,
  select: { id: true, name: true, email: true, loyaltyPoints: true },
});

const stats = await prisma.order.groupBy({
  by: ['customerId'],
  where: { tenantId, status: { in: ['PAID', 'FULFILLED'] } },
  _count: { _all: true },
  _sum: { totalCents: true },
  _max: { placedAt: true },
});

const byCustomer = new Map(stats.map((row) => [row.customerId, row]));
const rows = customers.map((customer) => {
  const stat = byCustomer.get(customer.id);
  return {
    ...customer,
    orderCount: stat?._count._all ?? 0,
    lifetimeCents: stat?._sum.totalCents ?? 0,
    lastOrderAt: stat?._max.placedAt?.toISOString() ?? null,
  };
});

console.log(`page ${page}, page size ${pageSize}`);
console.log(rows);
console.log('SELECT queries used:', selects, '(1 customers + 1 groupBy)');

// Sorting by lifetime value needs the aggregate before pagination, not after.
const topCustomers = await prisma.$queryRaw<Array<{ customer_id: string; lifetime_cents: bigint }>>`
  SELECT customer_id, SUM(total_cents)::bigint AS lifetime_cents
  FROM orders
  WHERE tenant_id = ${tenantId} AND status IN ('PAID', 'FULFILLED')
  GROUP BY customer_id
  ORDER BY lifetime_cents DESC
  LIMIT 3
`;
console.log('top customers by lifetime value:', topCustomers);

// Total count for the admin pagination footer (one extra query, still no N+1).
const total = await prisma.customer.count({ where: { tenantId, deletedAt: null } });
console.log('total customers in tenant:', total);

await prisma.$disconnect();
