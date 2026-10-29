// Chapter 55a — ⚠️ DANGER DEMOS: addressing rows by id only.
// The "session" belongs to Acme, but every id below belongs to Globex.
// Mutations run inside a transaction that is rolled back at the end.
import { createPrisma } from './lib/prisma.js';
import type { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma({ logSql: false });
const ROLLBACK = Symbol('rollback');

async function rolledBack<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      const value = await fn(tx);
      throw { [ROLLBACK]: true, value };
    });
  } catch (error) {
    if (error && typeof error === 'object' && ROLLBACK in error) return (error as { value: T }).value;
    throw error;
  }
}

console.log('--- ⚠️ read: findUnique by id only ---');
const leakedOrder = await prisma.order.findUnique({
  where: { id: 'ord_globex_2001' },
  select: { id: true, tenantId: true, number: true, totalCents: true, customerId: true },
});
console.log('Acme session read a Globex order:', leakedOrder);

console.log('--- ⚠️ update: id only, no tenantId ---');
const updated = await rolledBack(async (tx) => {
  const before = await tx.product.findUnique({
    where: { id: 'prd_globex_phone' },
    select: { tenantId: true, name: true, priceCents: true },
  });
  await tx.product.update({
    where: { id: 'prd_globex_phone' },
    data: { priceCents: 1 },
  });
  const after = await tx.product.findUnique({
    where: { id: 'prd_globex_phone' },
    select: { tenantId: true, name: true, priceCents: true },
  });
  return { before, after };
});
console.log('Globex product changed by an Acme session:', updated);

console.log('--- ⚠️ delete: id only, no tenantId ---');
const deleted = await rolledBack(async (tx) => {
  const result = await tx.fraudEvent.deleteMany({ where: { id: 'frd_globex_carol_unban' } });
  return result.count;
});
console.log('Globex fraud audit rows deleted by an Acme session:', deleted);

console.log('--- ⚠️ updateMany: no tenant filter ---');
const bulk = await rolledBack(async (tx) => {
  const result = await tx.product.updateMany({ data: { active: false } });
  return result.count;
});
console.log('products deactivated across BOTH tenants:', bulk);

console.log('--- ⚠️ deleteMany: no tenant filter ---');
const links = await rolledBack(async (tx) => {
  const result = await tx.productTag.deleteMany({});
  return result.count;
});
console.log('product-tag links deleted across BOTH tenants:', links);

console.log('--- after rollback: production data is unchanged ---');
console.log('globex phone price:', await prisma.product.findUnique({
  where: { id: 'prd_globex_phone' },
  select: { priceCents: true, active: true },
}));
console.log('fraud audit rows:', await prisma.fraudEvent.count({ where: { tenantId: 'ten_globex' } }));
console.log('product-tag links:', await prisma.productTag.count());

await prisma.$disconnect();
