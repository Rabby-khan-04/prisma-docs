// Chapter 38 — relation filters: some, every, none.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const withSaleTag = await prisma.product.findMany({
  where: {
    tenantId: 'ten_acme',
    tags: { some: { tag: { slug: 'sale' } } },
  },
  select: { name: true, tags: { select: { tag: { select: { slug: true } } } } },
});
console.log('some sale tag:', withSaleTag);

const everyInStock = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', orderItems: { every: { quantity: { gte: 1 } } } },
  select: { name: true },
});
console.log('every item quantity >= 1:', everyInStock);

const noOrders = await prisma.customer.findMany({
  where: { tenantId: 'ten_acme', orders: { none: {} } },
  select: { name: true },
});
console.log('customers with no orders:', noOrders);

await prisma.$disconnect();
