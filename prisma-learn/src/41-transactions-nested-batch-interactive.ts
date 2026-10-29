// Chapter 41 — batch vs interactive transactions.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();
const ROLLBACK = Symbol('rollback');

// Batch: both statements are sent as one transaction.
const batch = await prisma.$transaction([
  prisma.product.update({
    where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_mouse' } },
    data: { priceCents: 5100 },
    select: { name: true, priceCents: true },
  }),
  prisma.coupon.create({
    data: { id: 'cpn_ch41', tenantId: 'ten_acme', code: 'CH41', type: 'FIXED', amountOffCents: 500 },
    select: { code: true, amountOffCents: true },
  }),
]);
console.log('batch committed:', batch);

// Revert the committed changes so the fixture stays stable.
await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_mouse' } },
  data: { priceCents: 4900 },
});
await prisma.coupon.delete({ where: { id: 'cpn_ch41' } });

// Interactive: use the transaction client, and roll back deliberately.
try {
  await prisma.$transaction(async (tx) => {
    const coupon = await tx.coupon.create({
      data: { id: 'cpn_ch41_rollback', tenantId: 'ten_acme', code: 'CH41R', type: 'PERCENT', percentOff: 5 },
      select: { id: true, code: true },
    });
    console.log('inside transaction:', coupon);
    throw { [ROLLBACK]: true };
  });
} catch (error) {
  if (!(error && typeof error === 'object' && ROLLBACK in error)) throw error;
  console.log('interactive transaction rolled back');
}

const exists = await prisma.coupon.count({ where: { id: 'cpn_ch41_rollback' } });
console.log('row after rollback:', exists);

await prisma.$disconnect();
