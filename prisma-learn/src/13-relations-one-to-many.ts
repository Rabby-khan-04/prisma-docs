// Chapter 13 — one-to-many relation.
// Tenant 1---N Product and Customer 1---N Order.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const tenant = await prisma.tenant.findUnique({
  where: { id: 'ten_acme' },
  select: {
    slug: true,
    products: { select: { name: true, priceCents: true }, orderBy: { priceCents: 'desc' } },
    customers: {
      select: { name: true, orders: { select: { number: true, status: true, totalCents: true } } },
    },
  },
});
console.dir(tenant, { depth: 6 });

const customer = await prisma.customer.findUnique({
  where: { id: 'cus_acme_alice' },
  select: { name: true, _count: { select: { orders: true } } },
});
console.log('alice order count:', customer);

await prisma.$disconnect();
