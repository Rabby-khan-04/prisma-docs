// Chapter 01 — what an ORM does for you.
// Same question, once in Prisma Client and once in raw SQL.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const ormResult = await prisma.product.findFirst({
  where: { tenantId: 'ten_acme', slug: 'trail-laptop' },
  select: { id: true, name: true, priceCents: true },
});
console.log('Prisma result:', ormResult);

const rawResult = await prisma.$queryRaw<
  Array<{ id: string; name: string; price_cents: number }>
>`SELECT id, name, price_cents FROM products WHERE tenant_id = ${'ten_acme'} AND slug = ${'trail-laptop'}`;
console.log('Raw result:', rawResult);

await prisma.$disconnect();
