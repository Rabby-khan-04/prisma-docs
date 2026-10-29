// Chapter 36 — nested reads.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const order = await prisma.order.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'ord_acme_1001' } },
  select: {
    number: true,
    status: true,
    totalCents: true,
    customer: { select: { name: true, email: true } },
    items: {
      select: {
        productName: true,
        quantity: true,
        unitPriceCents: true,
        lineTotalCents: true,
        product: { select: { slug: true, stock: true } },
      },
      orderBy: { lineTotalCents: 'desc' },
    },
    payments: { select: { provider: true, status: true, amountCents: true } },
  },
});
console.dir(order, { depth: 6 });

await prisma.$disconnect();
