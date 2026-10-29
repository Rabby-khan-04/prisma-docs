// Chapter 17 — DANGER DEMO: cascade deletion, run inside a rolled-back transaction.
// Nothing is permanently deleted; the counts show what *would* happen.
import { createPrisma } from './lib/prisma.js';
import type { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma();
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

const counts = (tx: Prisma.TransactionClient) =>
  tx.$queryRaw<Array<{ tenant_id: string; orders: bigint; items: bigint; payments: bigint }>>`
    SELECT t.id AS tenant_id,
      (SELECT count(*) FROM orders o WHERE o.tenant_id = t.id) AS orders,
      (SELECT count(*) FROM order_items i WHERE i.tenant_id = t.id) AS items,
      (SELECT count(*) FROM payments p WHERE p.tenant_id = t.id) AS payments
    FROM tenants t ORDER BY t.id
  `;

const orderCounts = (tx: Prisma.TransactionClient) =>
  tx.$queryRaw<Array<{ order_id: string; items: bigint; payments: bigint }>>`
    SELECT o.id AS order_id,
      (SELECT count(*) FROM order_items i WHERE i.order_id = o.id) AS items,
      (SELECT count(*) FROM payments p WHERE p.order_id = o.id) AS payments
    FROM orders o WHERE o.id = 'ord_acme_1002'
  `;

console.log('--- before ---');
console.table(await prisma.$queryRaw<Array<Record<string, bigint | string>>>`
  SELECT t.id AS tenant_id,
    (SELECT count(*) FROM orders o WHERE o.tenant_id = t.id) AS orders,
    (SELECT count(*) FROM order_items i WHERE i.tenant_id = t.id) AS items,
    (SELECT count(*) FROM payments p WHERE p.tenant_id = t.id) AS payments
  FROM tenants t ORDER BY t.id
`);

await rolledBack(async (tx) => {
  console.log('--- delete ONE ORDER (items/payments cascade) ---');
  console.log('order 1002 before:', await orderCounts(tx));
  await tx.order.delete({ where: { id: 'ord_acme_1002' } });
  console.log('order 1002 after:', await orderCounts(tx));
});

try {
  await prisma.$transaction(async (tx) => {
    await tx.customer.delete({ where: { id: 'cus_acme_bob' } });
  });
} catch (error) {
  console.log('--- delete CUSTOMER with orders is blocked:', (error as { code?: string }).code);
}

const afterTenantDelete = await rolledBack(async (tx) => {
  console.log('--- delete TENANT acme (everything cascades) ---');
  await tx.tenant.delete({ where: { id: 'ten_acme' } });
  return counts(tx);
});
console.log('after tenant delete (inside rollback):');
console.table(afterTenantDelete);

console.log('--- after rollback (data is intact) ---');
console.table(await prisma.$queryRaw<Array<Record<string, bigint | string>>>`
  SELECT t.id AS tenant_id,
    (SELECT count(*) FROM orders o WHERE o.tenant_id = t.id) AS orders,
    (SELECT count(*) FROM order_items i WHERE i.tenant_id = t.id) AS items,
    (SELECT count(*) FROM payments p WHERE p.tenant_id = t.id) AS payments
  FROM tenants t ORDER BY t.id
`);

await prisma.$disconnect();
