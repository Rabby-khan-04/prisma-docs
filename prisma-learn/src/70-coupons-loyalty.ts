// Chapter 70 — coupons and loyalty without races.
// Counter limit + unique redemption + atomic points, all in one transaction.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

await prisma.coupon.upsert({
  where: { tenantId_code: { tenantId: 'ten_acme', code: 'CH70' } },
  update: { active: true, maxRedemptions: 1, redemptionCount: 0 },
  create: {
    id: 'cpn_ch70',
    tenantId: 'ten_acme',
    code: 'CH70',
    type: 'PERCENT',
    percentOff: 10,
    minOrderCents: 1000,
    maxRedemptions: 1,
  },
});

class CouponError extends Error {}

async function redeem(input: { tenantId: string; code: string; customerId: string; orderId: string }) {
  return prisma.$transaction(async (tx) => {
    const coupon = await tx.coupon.findFirst({
      where: { tenantId: input.tenantId, code: input.code, active: true },
      select: { id: true, maxRedemptions: true },
    });
    if (!coupon) throw new CouponError('coupon not found');

    // Conditional counter update: only one concurrent caller can win the last use.
    const limit = coupon.maxRedemptions ?? Number.MAX_SAFE_INTEGER;
    const counted = await tx.coupon.updateMany({
      where: { tenantId: input.tenantId, id: coupon.id, redemptionCount: { lt: limit } },
      data: { redemptionCount: { increment: 1 } },
    });
    if (counted.count === 0) throw new CouponError('coupon limit reached');

    await tx.couponRedemption.create({
      data: {
        tenantId: input.tenantId,
        couponId: coupon.id,
        customerId: input.customerId,
        orderId: input.orderId,
      },
    });

    // Points: never go below zero, even under concurrency.
    const points = 10;
    const spent = await tx.customer.updateMany({
      where: { tenantId: input.tenantId, id: input.customerId, loyaltyPoints: { gte: points } },
      data: { loyaltyPoints: { decrement: points } },
    });
    if (spent.count === 0) throw new CouponError('not enough points');

    await tx.loyaltyLedger.create({
      data: {
        tenantId: input.tenantId,
        customerId: input.customerId,
        orderId: input.orderId,
        delta: -points,
        reason: `coupon:${input.code}`,
      },
    });

    return { couponId: coupon.id, pointsSpent: points };
  });
}

const attempts = await Promise.allSettled([
  redeem({ tenantId: 'ten_acme', code: 'CH70', customerId: 'cus_acme_alice', orderId: 'ord_acme_1001' }),
  redeem({ tenantId: 'ten_acme', code: 'CH70', customerId: 'cus_acme_bob', orderId: 'ord_acme_1002' }),
]);
console.log('concurrent redemptions:', attempts.map((attempt) =>
  attempt.status === 'fulfilled' ? { ok: true, ...attempt.value } : { ok: false, error: (attempt.reason as Error).message },
));

const coupon = await prisma.coupon.findUnique({
  where: { tenantId_code: { tenantId: 'ten_acme', code: 'CH70' } },
  select: { redemptionCount: true, maxRedemptions: true },
});
console.log('coupon counter:', coupon);

// Duplicate for the same customer is blocked by the unique key.
await prisma.coupon.update({
  where: { tenantId_code: { tenantId: 'ten_acme', code: 'CH70' } },
  data: { maxRedemptions: 10, redemptionCount: 0 },
});
try {
  await redeem({ tenantId: 'ten_acme', code: 'CH70', customerId: 'cus_acme_alice', orderId: 'ord_acme_1001' });
  await redeem({ tenantId: 'ten_acme', code: 'CH70', customerId: 'cus_acme_alice', orderId: 'ord_acme_1001' });
} catch (error) {
  console.log('duplicate redemption:', (error as { code?: string }).code ?? (error as Error).message);
}

// Negative balance prevention.
const before = await prisma.customer.findUnique({
  where: { id: 'cus_acme_bob' },
  select: { loyaltyPoints: true },
});
const drained = await prisma.customer.updateMany({
  where: { tenantId: 'ten_acme', id: 'cus_acme_bob', loyaltyPoints: { gte: 999999 } },
  data: { loyaltyPoints: { decrement: 999999 } },
});
const after = await prisma.customer.findUnique({
  where: { id: 'cus_acme_bob' },
  select: { loyaltyPoints: true },
});
console.log('negative balance blocked:', drained.count === 0, before?.loyaltyPoints, after?.loyaltyPoints);

// Cleanup demo rows and restore fixture points.
const redemptions = await prisma.couponRedemption.findMany({
  where: { tenantId: 'ten_acme', couponId: 'cpn_ch70' },
  select: { id: true, customerId: true },
});
await prisma.couponRedemption.deleteMany({ where: { id: { in: redemptions.map((row) => row.id) } } });
await prisma.loyaltyLedger.deleteMany({ where: { tenantId: 'ten_acme', reason: 'coupon:CH70' } });
await prisma.coupon.delete({ where: { tenantId_code: { tenantId: 'ten_acme', code: 'CH70' } } });
await prisma.customer.updateMany({
  where: { tenantId: 'ten_acme', id: 'cus_acme_alice' },
  data: { loyaltyPoints: 120 },
});
await prisma.customer.updateMany({
  where: { tenantId: 'ten_acme', id: 'cus_acme_bob' },
  data: { loyaltyPoints: 10 },
});
console.log('cleanup done');

await prisma.$disconnect();
