// Chapter 67 — place an order safely in one transaction.
// Prices always come from the database. Stock is decremented conditionally.
import { createPrisma } from './lib/prisma.js';
import type { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma({ logSql: false });

type PlaceOrderInput = {
  tenantId: string;
  customerId: string;
  idempotencyKey: string;
  items: Array<{ productId: string; quantity: number }>;
};

class OrderError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function placeOrder(input: PlaceOrderInput) {
  if (!input.items.length) throw new OrderError('empty order', 400);
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new OrderError('invalid quantity', 400);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Idempotency: a retry returns the original order instead of charging twice.
    const existing = await tx.order.findUnique({
      where: { tenantId_idempotencyKey: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey } },
      include: { items: true, payments: true },
    });
    if (existing) return { order: existing, replayed: true };

    // 2. Customer must exist in this tenant and must not be banned.
    const customer = await tx.customer.findFirst({
      where: { tenantId: input.tenantId, id: input.customerId, deletedAt: null },
      select: { id: true, bannedAt: true },
    });
    if (!customer) throw new OrderError('customer not found', 404);
    if (customer.bannedAt) throw new OrderError('customer is banned', 403);

    // 3. Snapshot product data and reduce stock atomically.
    const lines: Array<Prisma.OrderItemCreateWithoutOrderInput & { productId: string }> = [];
    for (const item of input.items) {
      const product = await tx.product.findFirst({
        where: { tenantId: input.tenantId, id: item.productId, deletedAt: null, active: true },
        select: { id: true, name: true, sku: true, priceCents: true },
      });
      if (!product) throw new OrderError('product not found', 404);

      const stock = await tx.product.updateMany({
        where: { tenantId: input.tenantId, id: product.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (stock.count === 0) throw new OrderError(`out of stock: ${product.sku}`, 409);

      lines.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
        lineTotalCents: product.priceCents * item.quantity,
      });
    }

    const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);

    // 4. Order + items + payment are one atomic write.
    const order = await tx.order.create({
      data: {
        tenantId: input.tenantId,
        customerId: input.customerId,
        number: `CH67-${Date.now()}`,
        status: 'PENDING',
        subtotalCents,
        discountCents: 0,
        totalCents: subtotalCents,
        idempotencyKey: input.idempotencyKey,
        items: { create: lines },
        payments: {
          create: [
            {
              provider: 'stripe',
              providerRef: `pi_${input.idempotencyKey}`,
              amountCents: subtotalCents,
              status: 'PENDING',
            },
          ],
        },
      },
      include: { items: true, payments: true },
    });

    return { order, replayed: false };
  });
}

const first = await placeOrder({
  tenantId: 'ten_acme',
  customerId: 'cus_acme_alice',
  idempotencyKey: 'ch67-idem-1',
  items: [
    { productId: 'prd_acme_mouse', quantity: 2 },
    { productId: 'prd_acme_chair', quantity: 1 },
  ],
});
console.log('created:', {
  id: first.order.id,
  totalCents: first.order.totalCents,
  replayed: first.replayed,
  items: first.order.items.map((item) => ({ sku: item.sku, qty: item.quantity, line: item.lineTotalCents })),
});

const replay = await placeOrder({
  tenantId: 'ten_acme',
  customerId: 'cus_acme_alice',
  idempotencyKey: 'ch67-idem-1',
  items: [{ productId: 'prd_acme_mouse', quantity: 2 }],
});
console.log('replay:', { sameOrder: replay.order.id === first.order.id, replayed: replay.replayed });

try {
  await placeOrder({
    tenantId: 'ten_acme',
    customerId: 'cus_acme_bob',
    idempotencyKey: 'ch67-idem-oos',
    items: [{ productId: 'prd_acme_chair', quantity: 999 }],
  });
} catch (error) {
  console.log('out of stock:', (error as OrderError).status, (error as Error).message);
}

// Cleanup: remove the demo order and restore the stock we decremented.
const order = first.order;
await prisma.order.delete({ where: { id: order.id } });
for (const item of order.items) {
  await prisma.product.update({
    where: { tenantId_id: { tenantId: item.tenantId, id: item.productId } },
    data: { stock: { increment: item.quantity } },
  });
}
console.log('cleanup done; stock restored');

await prisma.$disconnect();
