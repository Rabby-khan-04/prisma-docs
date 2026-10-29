// Chapter 35 — select vs include, and the danger of returning full models.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const fullUser = await prisma.user.findFirst({
  where: { tenantId: 'ten_acme', email: 'owner@acme.test' },
});
console.log('⚠️ full user contains passwordHash:', fullUser);

const safeUser = await prisma.user.findFirst({
  where: { tenantId: 'ten_acme', email: 'owner@acme.test' },
  select: { id: true, email: true, role: true },
});
console.log('safe select:', safeUser);

const omitted = await prisma.user.findFirst({
  where: { tenantId: 'ten_acme', email: 'owner@acme.test' },
  omit: { passwordHash: true },
});
console.log('omit passwordHash:', omitted);

const orderWithItems = await prisma.order.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'ord_acme_1001' } },
  include: { items: true, payments: true },
});
console.log('include returns whole related rows:', orderWithItems);

await prisma.$disconnect();
