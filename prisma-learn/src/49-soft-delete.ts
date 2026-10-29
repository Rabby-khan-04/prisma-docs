// Chapter 49 — soft delete with deletedAt.
// A soft delete is just an UPDATE. Nothing enforces the filter for you.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const created = await prisma.product.create({
  data: {
    id: 'prd_ch49_soft',
    tenantId: 'ten_acme',
    sku: 'CH49-SOFT',
    slug: 'ch49-soft',
    name: 'Soft Deleted Product',
    priceCents: 4200,
    stock: 3,
  },
  select: { id: true, slug: true, deletedAt: true },
});
console.log('created:', created);

await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch49_soft' } },
  data: { deletedAt: new Date(), active: false },
});

// ❌ Forgetting the filter: the "deleted" row is still returned.
const forgotten = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', id: 'prd_ch49_soft' },
  select: { id: true, name: true, deletedAt: true },
});
console.log('⚠️ without deletedAt filter:', forgotten);

// ✅ The filter every read must apply.
const visible = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', id: 'prd_ch49_soft', deletedAt: null },
  select: { id: true },
});
console.log('✅ with deletedAt: null:', visible);

// Soft delete does NOT free the unique key. The old row still owns the slug.
try {
  await prisma.product.create({
    data: {
      tenantId: 'ten_acme',
      sku: 'CH49-SOFT-NEW',
      slug: 'ch49-soft',
      name: 'Replacement Product',
      priceCents: 4300,
    },
  });
} catch (error) {
  console.log('re-create with same slug:', (error as { code?: string }).code);
}

// Restore is an UPDATE too.
await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch49_soft' } },
  data: { deletedAt: null, active: true },
});
const restored = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch49_soft' } },
  select: { id: true, deletedAt: true, active: true },
});
console.log('restored:', restored);

// Real hard delete is explicit, and only for fixtures/admin tooling.
await prisma.product.delete({ where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch49_soft' } } });

await prisma.$disconnect();
