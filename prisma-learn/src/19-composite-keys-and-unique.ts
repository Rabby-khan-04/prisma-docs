// Chapter 19 — composite unique constraints and composite foreign keys.
// Same slug is fine across tenants, but a cross-tenant order is impossible.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const sameSlug = await prisma.product.findMany({
  where: { slug: 'trail-laptop' },
  select: { id: true, tenantId: true, slug: true, name: true },
  orderBy: { tenantId: 'asc' },
});
console.log('same slug, two tenants:', sameSlug);

try {
  await prisma.product.create({
    data: {
      tenantId: 'ten_acme',
      sku: 'CH19-DUP-01',
      slug: 'trail-laptop',
      name: 'Duplicate slug inside Acme',
      priceCents: 100,
    },
  });
} catch (error) {
  console.log('duplicate slug in one tenant:', (error as { code?: string }).code);
}

try {
  await prisma.$executeRaw`
    INSERT INTO orders (id, tenant_id, customer_id, number, status, subtotal_cents, discount_cents,
                        total_cents, currency, placed_at, created_at, updated_at)
    VALUES (${'ord_ch19_cross'}, ${'ten_acme'}, ${'cus_globex_carol'}, ${'CH19-X'},
            CAST(${'PENDING'} AS "OrderStatus"), 100, 0, 100, 'USD', now(), now(), now())
  `;
} catch (error) {
  console.log('cross-tenant FK rejected:', (error as { code?: string }).code);
  console.log((error as { message?: string }).message?.split('\n').slice(0, 4).join('\n'));
}

await prisma.$disconnect();
