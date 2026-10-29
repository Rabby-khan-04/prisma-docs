// Chapter 37 — nested writes.
// One-to-one nested create/update/delete on Customer + CustomerProfile.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const customer = await prisma.customer.create({
  data: {
    id: 'cus_ch37',
    tenantId: 'ten_acme',
    email: 'ch37@acme.test',
    name: 'Nested Writer',
    displayName: 'Nested',
    profile: {
      create: {
        id: 'prf_ch37',
        marketingOptIn: true,
      },
    },
  },
  select: { id: true, name: true, profile: { select: { id: true, marketingOptIn: true } } },
});
console.log('nested create:', customer);

const updated = await prisma.customer.update({
  where: { id: 'cus_ch37' },
  data: {
    profile: { update: { marketingOptIn: false } },
  },
  select: { profile: { select: { marketingOptIn: true } } },
});
console.log('nested update:', updated);

await prisma.customer.delete({ where: { id: 'cus_ch37' } });
console.log('nested delete (profile cascades)');

await prisma.$disconnect();
