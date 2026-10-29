// Chapter 40 — count, aggregate, groupBy.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const count = await prisma.order.count({ where: { tenantId: 'ten_acme' } });
console.log('count:', count);

const totals = await prisma.order.aggregate({
  where: { tenantId: 'ten_acme' },
  _sum: { totalCents: true, discountCents: true },
  _avg: { totalCents: true },
  _min: { totalCents: true },
  _max: { totalCents: true },
});
console.log('aggregate:', totals);

const byStatus = await prisma.order.groupBy({
  by: ['status'],
  where: { tenantId: 'ten_acme' },
  _count: { _all: true },
  _sum: { totalCents: true },
  orderBy: { status: 'asc' },
});
console.log('groupBy status:', byStatus);

const busyCustomers = await prisma.order.groupBy({
  by: ['customerId'],
  where: { tenantId: 'ten_acme' },
  _sum: { totalCents: true },
  having: { totalCents: { _sum: { gt: 50000 } } },
});
console.log('having sum > 50000:', busyCustomers);

await prisma.$disconnect();
