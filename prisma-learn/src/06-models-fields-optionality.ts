// Chapter 06 — models, fields, optionality.
// description is nullable ("String?"); active has a default; tenantId is required.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const created = await prisma.product.create({
  data: {
    id: 'prd_ch06_optional',
    tenantId: 'ten_acme',
    sku: 'CH06-OPT-01',
    slug: 'ch06-optional',
    name: 'Optional Field Demo',
    description: null, // explicit null is allowed
    priceCents: 1000,
    // stock and active are omitted -> database/client defaults apply
  },
  select: { id: true, description: true, stock: true, active: true },
});
console.log('created:', created);

const missing = await prisma.product.create({
  data: {
    id: 'prd_ch06_missing',
    tenantId: 'ten_acme',
    sku: 'CH06-MISS-01',
    slug: 'ch06-missing',
    name: 'Omitted Description',
    priceCents: 500,
  },
  select: { description: true },
});
console.log('omitted description:', missing);

await prisma.product.deleteMany({ where: { id: { in: ['prd_ch06_optional', 'prd_ch06_missing'] } } });
await prisma.$disconnect();
