// Chapter 12 — one-to-one relation.
// CustomerProfile holds the FK and a per-tenant unique constraint.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const profile = await prisma.customerProfile.create({
  data: {
    id: 'prf_ch12_bob',
    tenantId: 'ten_acme',
    customerId: 'cus_acme_bob',
    avatarUrl: 'https://example.test/bob.png',
    marketingOptIn: true,
  },
});
console.log('profile:', profile);

const customer = await prisma.customer.findUnique({
  where: { id: 'cus_acme_bob' },
  select: { id: true, name: true, profile: { select: { avatarUrl: true, marketingOptIn: true } } },
});
console.log('customer -> profile:', customer);

const reverse = await prisma.customerProfile.findUnique({
  where: { tenantId_customerId: { tenantId: 'ten_acme', customerId: 'cus_acme_bob' } },
  select: { id: true, customer: { select: { name: true, email: true } } },
});
console.log('profile -> customer:', reverse);

await prisma.customerProfile.delete({ where: { id: 'prf_ch12_bob' } });
await prisma.$disconnect();
