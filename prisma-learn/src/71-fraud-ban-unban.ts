// Chapter 71 — fraud ban / unban with an audit trail.
// The ban check runs inside the order transaction, not from a stale page load.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const tenantId = 'ten_globex';
const customerId = 'cus_globex_dave';
const actorId = 'usr_globex_admin';

async function ban(reason: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.customer.updateMany({
      where: { tenantId, id: customerId, bannedAt: null },
      data: { bannedAt: new Date(), banReason: reason },
    });
    if (updated.count === 0) throw new Error('already banned or missing');
    await tx.fraudEvent.create({
      data: { tenantId, customerId, action: 'BAN', reason, actorId },
    });
    return { banned: true };
  });
}

async function unban(reason: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.customer.updateMany({
      where: { tenantId, id: customerId, bannedAt: { not: null } },
      data: { bannedAt: null, banReason: null },
    });
    if (updated.count === 0) throw new Error('not banned');
    await tx.fraudEvent.create({
      data: { tenantId, customerId, action: 'UNBAN', reason, actorId },
    });
    return { banned: false };
  });
}

console.log('ban:', await ban('Card testing pattern detected'));

// Order placement re-reads the ban flag inside the same transaction.
async function placeOrderForDave() {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({
      where: { tenantId, id: customerId },
      select: { bannedAt: true },
    });
    if (!customer) throw new Error('customer not found');
    if (customer.bannedAt) throw new Error('customer is banned');
    return tx.order.create({
      data: {
        tenantId,
        customerId,
        number: `CH71-${Date.now()}`,
        status: 'PENDING',
        subtotalCents: 100,
        totalCents: 100,
      },
      select: { id: true, number: true },
    });
  });
}

try {
  await placeOrderForDave();
} catch (error) {
  console.log('order blocked:', (error as Error).message);
}

// Internal view vs public view.
const internal = await prisma.customer.findUnique({
  where: { id: customerId },
  select: { id: true, bannedAt: true, banReason: true },
});
console.log('internal record:', internal);

function toPublicProfile(row: { id: string; bannedAt: Date | null }) {
  return { id: row.id, status: row.bannedAt ? 'restricted' : 'active' };
}
console.log('public profile:', toPublicProfile(internal!));
console.log('public profile leaks no reason/date:', !('banReason' in toPublicProfile(internal!)));

console.log('unban:', await unban('False positive after manual review'));

const audit = await prisma.fraudEvent.findMany({
  where: { tenantId, customerId },
  select: { action: true, reason: true, actorId: true, createdAt: true },
  orderBy: { createdAt: 'asc' },
});
console.log('audit trail:');
console.log(audit);

// Cleanup the demo audit rows and leave Dave active.
await prisma.fraudEvent.deleteMany({
  where: { tenantId, customerId, reason: { in: ['Card testing pattern detected', 'False positive after manual review'] } },
});
console.log('cleanup done');

await prisma.$disconnect();
