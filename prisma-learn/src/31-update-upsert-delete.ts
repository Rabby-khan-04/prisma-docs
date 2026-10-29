// Chapter 31 — update, upsert, delete, and P2025.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const upserted = await prisma.coupon.upsert({
  where: { tenantId_code: { tenantId: 'ten_acme', code: 'CH31' } },
  update: { active: true },
  create: {
    id: 'cpn_ch31',
    tenantId: 'ten_acme',
    code: 'CH31',
    type: 'PERCENT',
    percentOff: 15,
    minOrderCents: 1000,
  },
  select: { id: true, code: true, percentOff: true },
});
console.log('upsert create:', upserted);

const updated = await prisma.coupon.update({
  where: { tenantId_code: { tenantId: 'ten_acme', code: 'CH31' } },
  data: { percentOff: 20 },
  select: { code: true, percentOff: true },
});
console.log('update:', updated);

try {
  await prisma.coupon.update({
    where: { tenantId_code: { tenantId: 'ten_acme', code: 'NOPE' } },
    data: { active: false },
  });
} catch (error) {
  console.log('missing row:', (error as { code?: string }).code);
}

await prisma.coupon.delete({
  where: { tenantId_code: { tenantId: 'ten_acme', code: 'CH31' } },
});
console.log('deleted');

await prisma.$disconnect();
