// Chapter 68 — reduce stock without overselling.
// Conditional UPDATE ... WHERE stock >= qty is the cheapest correct guard.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

await prisma.product.upsert({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch68_last' } },
  update: { stock: 1, priceCents: 5000 },
  create: {
    id: 'prd_ch68_last',
    tenantId: 'ten_acme',
    sku: 'CH68-LAST',
    slug: 'ch68-last',
    name: 'Last Unit',
    priceCents: 5000,
    stock: 1,
  },
});

async function buyConditional(buyer: string, quantity: number) {
  const result = await prisma.product.updateMany({
    where: { tenantId: 'ten_acme', id: 'prd_ch68_last', stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });
  return result.count === 1 ? { buyer, sold: true } : { buyer, sold: false, reason: 'out of stock' };
}

console.log('--- two concurrent buyers, conditional update ---');
console.log(await Promise.all([buyConditional('buyer-A', 1), buyConditional('buyer-B', 1)]));
console.log('stock after:', await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch68_last' } },
  select: { stock: true },
}));

// Reset for the row-lock variant.
await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch68_last' } },
  data: { stock: 1 },
});

async function buyWithRowLock(buyer: string, quantity: number) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ stock: number }>>`
      SELECT stock FROM products
      WHERE tenant_id = ${'ten_acme'} AND id = ${'prd_ch68_last'}
      FOR UPDATE
    `;
    if (!rows[0] || rows[0].stock < quantity) return { buyer, sold: false, reason: 'out of stock' };
    await tx.$executeRaw`
      UPDATE products SET stock = stock - ${quantity}, updated_at = now()
      WHERE tenant_id = ${'ten_acme'} AND id = ${'prd_ch68_last'}
    `;
    return { buyer, sold: true };
  });
}

console.log('--- two concurrent buyers, SELECT ... FOR UPDATE ---');
console.log(await Promise.all([buyWithRowLock('buyer-C', 1), buyWithRowLock('buyer-D', 1)]));
console.log('stock after:', await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch68_last' } },
  select: { stock: true },
}));

// Idempotency: retrying the same request must not decrement twice.
async function buyIdempotent(key: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.loyaltyLedger.findFirst({
        where: { tenantId: 'ten_acme', reason: `stock:${key}` },
        select: { id: true },
      });
      if (existing) return { replayed: true };
      const updated = await tx.product.updateMany({
        where: { tenantId: 'ten_acme', id: 'prd_ch68_last', stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      });
      if (updated.count === 0) throw new Error('out of stock');
      await tx.loyaltyLedger.create({
        data: {
          tenantId: 'ten_acme',
          customerId: 'cus_acme_alice',
          delta: 0,
          reason: `stock:${key}`,
        },
      });
      return { replayed: false };
    });
    return result;
  } catch (error) {
    return { error: (error as Error).message };
  }
}

await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch68_last' } },
  data: { stock: 2 },
});
console.log('idempotent first call:', await buyIdempotent('ch68-order-1'));
console.log('idempotent retry:    ', await buyIdempotent('ch68-order-1'));
console.log('stock after retry:', await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch68_last' } },
  select: { stock: true },
}));

// Cleanup.
await prisma.loyaltyLedger.deleteMany({ where: { tenantId: 'ten_acme', reason: 'stock:ch68-order-1' } });
await prisma.product.delete({ where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch68_last' } } });

await prisma.$disconnect();
