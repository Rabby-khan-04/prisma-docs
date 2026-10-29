// Chapter 34 — sorting.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const byPrice = await prisma.product.findMany({
  where: { tenantId: 'ten_acme' },
  orderBy: [{ priceCents: 'desc' }, { id: 'asc' }],
  select: { name: true, priceCents: true },
});
console.log('price desc:', byPrice);

const byName = await prisma.product.findMany({
  where: { tenantId: 'ten_globex' },
  orderBy: { name: 'asc' },
  select: { name: true },
});
console.log('name asc:', byName);

const byRelation = await prisma.order.findMany({
  where: { tenantId: 'ten_acme' },
  orderBy: { customer: { name: 'asc' } },
  select: { number: true, customer: { select: { name: true } } },
});
console.log('order by customer name:', byRelation);

await prisma.$disconnect();
