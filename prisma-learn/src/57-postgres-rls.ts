// Chapter 57 — PostgreSQL Row-Level Security.
// The table owner (postgres) bypasses RLS, so we switch to a non-owner role.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

type Counts = { customers: number; products: number; orders: number };

async function countsAs(tenantId: string | null): Promise<Counts> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL ROLE rls_app');
    if (tenantId) {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
    }
    const [customers] = await tx.$queryRaw<Array<{ n: bigint }>>`SELECT count(*)::bigint AS n FROM customers`;
    const [products] = await tx.$queryRaw<Array<{ n: bigint }>>`SELECT count(*)::bigint AS n FROM products`;
    const [orders] = await tx.$queryRaw<Array<{ n: bigint }>>`SELECT count(*)::bigint AS n FROM orders`;
    return {
      customers: Number(customers.n),
      products: Number(products.n),
      orders: Number(orders.n),
    };
  });
}

console.log('--- as the table owner (postgres bypasses RLS) ---');
console.log('owner sees:', {
  customers: await prisma.customer.count(),
  products: await prisma.product.count(),
  orders: await prisma.order.count(),
});

console.log('--- as rls_app with no app.tenant_id ---');
console.log('no tenant set:', await countsAs(null));

console.log('--- as rls_app with app.tenant_id ---');
const acme = await countsAs('ten_acme');
const globex = await countsAs('ten_globex');
console.log('ten_acme:', acme);
console.log('ten_globex:', globex);

console.log('--- cross-tenant UPDATE is filtered to zero rows ---');
const updated = await prisma.$transaction(async (tx) => {
  await tx.$executeRawUnsafe('SET LOCAL ROLE rls_app');
  await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = 'ten_globex'`);
  return tx.$executeRaw`UPDATE customers SET name = ${'HACKED'} WHERE tenant_id = ${'ten_acme'}`;
});
console.log('rows updated while acting as globex:', updated);

console.log('--- cross-tenant INSERT is rejected by WITH CHECK ---');
try {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL ROLE rls_app');
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = 'ten_globex'`);
    await tx.$executeRaw`
      INSERT INTO customers (id, tenant_id, email, name, display_name, loyalty_points, tier,
                             created_at, updated_at)
      VALUES (${'cus_ch57_cross'}, ${'ten_acme'}, ${'ch57@acme.test'}, ${'Cross Tenant'},
              ${'Cross'}, 0, ${'BRONZE'}, now(), now())
    `;
  });
} catch (error) {
  console.log('insert rejected:', (error as { code?: string }).code);
}

console.log('--- owner still sees the untouched truth ---');
console.log('acme customer names:', await prisma.customer.findMany({
  where: { tenantId: 'ten_acme' },
  select: { name: true },
  orderBy: { name: 'asc' },
}));

await prisma.$disconnect();
