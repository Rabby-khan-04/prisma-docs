// Chapter 30 — create, findUnique, findFirst, findMany.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const created = await prisma.product.create({
  data: {
    id: 'prd_ch30_demo',
    tenantId: 'ten_acme',
    sku: 'CH30-DEMO',
    slug: 'ch30-demo',
    name: 'Chapter 30 Demo',
    priceCents: 1999,
    stock: 3,
  },
  select: { id: true, name: true, priceCents: true },
});
console.log('create:', created);

const byId = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch30_demo' } },
  select: { id: true, name: true },
});
console.log('findUnique (tenant + id):', byId);

const first = await prisma.product.findFirst({
  where: { tenantId: 'ten_acme', active: true },
  orderBy: { priceCents: 'desc' },
  select: { name: true, priceCents: true },
});
console.log('findFirst:', first);

const many = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', priceCents: { gte: 10000 } },
  orderBy: { priceCents: 'asc' },
  take: 3,
  select: { name: true, priceCents: true },
});
console.log('findMany:', many);

await prisma.product.delete({ where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch30_demo' } } });
await prisma.$disconnect();
