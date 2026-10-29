// Chapter 39 — offset vs cursor pagination.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

await prisma.product.createMany({
  data: Array.from({ length: 25 }, (_, i) => ({
    id: `prd_ch39_${String(i + 1).padStart(2, '0')}`,
    tenantId: 'ten_acme',
    sku: `CH39-${String(i + 1).padStart(2, '0')}`,
    slug: `ch39-${String(i + 1).padStart(2, '0')}`,
    name: `Pagination Product ${i + 1}`,
    priceCents: 1000 + i,
    stock: 10,
  })),
  skipDuplicates: true,
});

const page1 = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', id: { startsWith: 'prd_ch39_' } },
  orderBy: { id: 'asc' },
  take: 3,
  select: { id: true, name: true },
});
console.log('offset page 1:', page1);

const page2Offset = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', id: { startsWith: 'prd_ch39_' } },
  orderBy: { id: 'asc' },
  skip: 3,
  take: 3,
  select: { id: true, name: true },
});
console.log('offset page 2:', page2Offset);

const cursorPage = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', id: { startsWith: 'prd_ch39_' } },
  orderBy: { id: 'asc' },
  cursor: { id: page1.at(-1)!.id },
  skip: 1,
  take: 3,
  select: { id: true, name: true },
});
console.log('cursor after last id:', cursorPage);

const total = await prisma.product.count({ where: { tenantId: 'ten_acme', id: { startsWith: 'prd_ch39_' } } });
console.log('total:', total);

await prisma.product.deleteMany({ where: { tenantId: 'ten_acme', id: { startsWith: 'prd_ch39_' } } });
await prisma.$disconnect();
