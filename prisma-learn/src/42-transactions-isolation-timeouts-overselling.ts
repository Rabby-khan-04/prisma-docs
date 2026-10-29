// Chapter 42 — the overselling race.
// Two buyers try to buy the last item at the same time.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

await prisma.product.upsert({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch42_last' } },
  update: { stock: 1, priceCents: 5000 },
  create: {
    id: 'prd_ch42_last',
    tenantId: 'ten_acme',
    sku: 'CH42-LAST',
    slug: 'ch42-last',
    name: 'Last Item',
    priceCents: 5000,
    stock: 1,
  },
});

const buy = (buyer: string) =>
  prisma.product.updateMany({
    where: { tenantId: 'ten_acme', id: 'prd_ch42_last', stock: { gte: 1 } },
    data: { stock: { decrement: 1 } },
  }).then((result) => ({ buyer, count: result.count }));

const [a, b] = await Promise.all([buy('buyer-A'), buy('buyer-B')]);
console.log('conditional updates:', a, b);

const remaining = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch42_last' } },
  select: { stock: true },
});
console.log('remaining stock:', remaining);

// The lost-update pattern: both read 1, both write 0, both think they won.
await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch42_last' } },
  data: { stock: 1 },
});
const readThenWrite = async (buyer: string) => {
  const product = await prisma.product.findUnique({
    where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch42_last' } },
    select: { stock: true },
  });
  if ((product?.stock ?? 0) < 1) return { buyer, sold: false };
  await prisma.product.update({
    where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch42_last' } },
    data: { stock: 0 },
  });
  return { buyer, sold: true };
};
const [c, d] = await Promise.all([readThenWrite('buyer-C'), readThenWrite('buyer-D')]);
console.log('read-then-write:', c, d);

await prisma.product.delete({ where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch42_last' } } });
await prisma.$disconnect();
