// Chapter 33 — filtering operators.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const inList = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', sku: { in: ['ACME-LAP-01', 'ACME-MOU-01'] } },
  select: { sku: true, name: true },
});
console.log('in:', inList);

const range = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', priceCents: { gte: 4900, lt: 100000 } },
  select: { name: true, priceCents: true },
});
console.log('range:', range);

const search = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', name: { contains: 'trail', mode: 'insensitive' } },
  select: { name: true },
});
console.log('contains insensitive:', search);

const either = await prisma.product.findMany({
  where: {
    tenantId: 'ten_acme',
    OR: [{ stock: 0 }, { priceCents: { lt: 5000 } }],
  },
  select: { name: true, stock: true, priceCents: true },
});
console.log('OR:', either);

const nulls = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', description: null },
  select: { name: true, description: true },
});
console.log('null description:', nulls);

await prisma.$disconnect();
