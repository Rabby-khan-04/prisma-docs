// Chapter 32 — bulk operations.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const created = await prisma.product.createMany({
  data: [
    { id: 'prd_ch32_a', tenantId: 'ten_acme', sku: 'CH32-A', slug: 'ch32-a', name: 'Bulk A', priceCents: 1000 },
    { id: 'prd_ch32_b', tenantId: 'ten_acme', sku: 'CH32-B', slug: 'ch32-b', name: 'Bulk B', priceCents: 2000 },
    { id: 'prd_ch32_c', tenantId: 'ten_acme', sku: 'CH32-C', slug: 'ch32-c', name: 'Bulk C', priceCents: 3000 },
  ],
  skipDuplicates: true,
});
console.log('createMany count:', created.count);

const createdAndReturned = await prisma.product.createManyAndReturn({
  data: [
    { id: 'prd_ch32_d', tenantId: 'ten_acme', sku: 'CH32-D', slug: 'ch32-d', name: 'Bulk D', priceCents: 4000 },
    { id: 'prd_ch32_e', tenantId: 'ten_acme', sku: 'CH32-E', slug: 'ch32-e', name: 'Bulk E', priceCents: 5000 },
  ],
  select: { id: true, name: true, priceCents: true },
});
console.log('createManyAndReturn:', createdAndReturned);

const updated = await prisma.product.updateMany({
  where: { tenantId: 'ten_acme', id: { startsWith: 'prd_ch32_' } },
  data: { priceCents: { increment: 500 } },
});
console.log('updateMany count:', updated.count);

const deleted = await prisma.product.deleteMany({
  where: { tenantId: 'ten_acme', id: { startsWith: 'prd_ch32_' } },
});
console.log('deleteMany count:', deleted.count);

await prisma.$disconnect();
