// Chapter 52 — composite keys make cross-tenant links impossible.
// The database, not the application, rejects these rows.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

console.log('--- tenant-scoped unique constraints and composite FKs ---');
const constraints = await prisma.$queryRaw<
  Array<{ table_name: string; constraint_name: string; definition: string }>
>`
  SELECT conrelid::regclass::text AS table_name,
         conname AS constraint_name,
         pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
  WHERE conrelid IN ('products'::regclass, 'orders'::regclass, 'order_items'::regclass,
                     'customer_profiles'::regclass, 'product_tags'::regclass)
    AND contype IN ('u', 'f', 'p')
  ORDER BY table_name, constraint_name
`;
for (const row of constraints) console.log(`${row.table_name} | ${row.constraint_name} | ${row.definition}`);

// Same slug in two tenants: allowed, because the unique key starts with tenant_id.
const sameSlug = await prisma.product.findMany({
  where: { slug: 'trail-laptop' },
  select: { id: true, tenantId: true, slug: true },
  orderBy: { tenantId: 'asc' },
});
console.log('same slug across tenants:', sameSlug);

// Cross-tenant order: customer from globex, tenant acme.
try {
  await prisma.$executeRaw`
    INSERT INTO orders (id, tenant_id, customer_id, number, status, subtotal_cents,
                        discount_cents, total_cents, currency, placed_at, created_at, updated_at)
    VALUES (${'ord_ch52_cross'}, ${'ten_acme'}, ${'cus_globex_carol'}, ${'CH52-X'},
            CAST(${'PENDING'} AS "OrderStatus"), 100, 0, 100, 'USD', now(), now(), now())
  `;
} catch (error) {
  const e = error as { code?: string; message?: string };
  console.log('cross-tenant order rejected:', e.code);
  console.log(e.message?.split('\n').find((line) => line.includes('violates foreign key')) ?? '');
}

// Cross-tenant order item: order from acme, product from globex.
try {
  await prisma.orderItem.create({
    data: {
      tenantId: 'ten_acme',
      orderId: 'ord_acme_1001',
      productId: 'prd_globex_phone',
      productName: 'Orbit Phone',
      sku: 'GLX-PHO-01',
      unitPriceCents: 79900,
      quantity: 1,
      lineTotalCents: 79900,
    },
  });
} catch (error) {
  console.log('cross-tenant order item rejected:', (error as { code?: string }).code);
}

// Cross-tenant explicit M2M link: product from acme, tag from globex.
try {
  await prisma.productTag.create({
    data: { tenantId: 'ten_acme', productId: 'prd_acme_laptop', tagId: 'tag_globex_sale' },
  });
} catch (error) {
  console.log('cross-tenant product tag rejected:', (error as { code?: string }).code);
}

// The correct way: resolve every id inside the tenant first.
const [product, tag] = await Promise.all([
  prisma.product.findFirst({ where: { tenantId: 'ten_acme', id: 'prd_acme_mouse' }, select: { id: true } }),
  prisma.tag.findFirst({ where: { tenantId: 'ten_acme', id: 'tag_acme_new' }, select: { id: true } }),
]);
console.log('resolved inside tenant:', { product, tag });

await prisma.$disconnect();
