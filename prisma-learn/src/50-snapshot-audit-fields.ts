// Chapter 50 — snapshot and audit fields.
// Order items keep their own copy of name/sku/price. History must not join live data.
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

const read = () =>
  prisma.orderItem.findFirst({
    where: { tenantId: 'ten_acme', orderId: 'ord_acme_1001', productId: 'prd_acme_laptop' },
    select: {
      productName: true,
      sku: true,
      unitPriceCents: true,
      quantity: true,
      lineTotalCents: true,
      product: { select: { name: true, sku: true, priceCents: true } },
    },
  });

console.log('--- before the live product changes ---');
console.log(await read());

const changed = await rolledBack(async (tx) => {
  await tx.product.update({
    where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_laptop' } },
    data: { name: 'Renamed After The Sale', priceCents: 999999 },
  });
  return tx.orderItem.findFirst({
    where: { tenantId: 'ten_acme', orderId: 'ord_acme_1001', productId: 'prd_acme_laptop' },
    select: {
      productName: true,
      sku: true,
      unitPriceCents: true,
      lineTotalCents: true,
      product: { select: { name: true, priceCents: true } },
    },
  });
});

console.log('--- inside the change (rolled back afterwards) ---');
console.log('order snapshot vs live product:', changed);

// Audit trail: who did what, when, and why.
const audit = await prisma.fraudEvent.findMany({
  where: { tenantId: 'ten_globex', customerId: 'cus_globex_carol' },
  select: { action: true, reason: true, actorId: true, createdAt: true },
  orderBy: { createdAt: 'asc' },
});
console.log('fraud audit rows:', audit);

const ledger = await prisma.loyaltyLedger.findMany({
  where: { tenantId: 'ten_acme', customerId: 'cus_acme_alice' },
  select: { delta: true, reason: true, orderId: true, createdAt: true },
  orderBy: { createdAt: 'asc' },
});
console.log('loyalty audit rows:', ledger);

// Audit rows are append-only: no update/delete path in application code.
console.log('audit rows are insert-only by convention and by code review');

await prisma.$disconnect();
