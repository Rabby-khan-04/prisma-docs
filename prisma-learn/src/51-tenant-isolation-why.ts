// Chapter 51 — why every tenant-owned query must include tenantId.
// One missing filter turns a normal query into a cross-tenant data leak.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

console.log('--- global queries (admin/reporting only) ---');
console.log('all products:', await prisma.product.count());
console.log('all orders:', await prisma.order.count());
console.log('all customers:', await prisma.customer.count());

console.log('--- tenant-scoped queries (every request path) ---');
for (const tenantId of ['ten_acme', 'ten_globex']) {
  const [products, orders, customers] = await Promise.all([
    prisma.product.count({ where: { tenantId } }),
    prisma.order.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId } }),
  ]);
  console.log(tenantId, { products, orders, customers });
}

// The dangerous shape: a filter that looks right but is not tenant-scoped.
const slug = 'trail-laptop';
const globalBySlug = await prisma.product.findMany({
  where: { slug },
  select: { id: true, tenantId: true, name: true },
});
console.log('⚠️ slug lookup without tenant:', globalBySlug);

const scopedBySlug = await prisma.product.findFirst({
  where: { tenantId: 'ten_acme', slug },
  select: { id: true, tenantId: true, name: true },
});
console.log('✅ slug lookup with tenant:', scopedBySlug);

// Cross-tenant aggregate: the same column, two very different answers.
const globalRevenue = await prisma.order.aggregate({ _sum: { totalCents: true } });
const acmeRevenue = await prisma.order.aggregate({
  where: { tenantId: 'ten_acme' },
  _sum: { totalCents: true },
});
console.log('global revenue cents:', globalRevenue._sum.totalCents);
console.log('acme revenue cents:', acmeRevenue._sum.totalCents);

// A tenant-owned row must never be addressable by id alone at the API boundary.
const byIdOnly = await prisma.customer.findUnique({
  where: { id: 'cus_globex_carol' },
  select: { id: true, tenantId: true, email: true },
});
console.log('⚠️ findUnique by id only:', byIdOnly);

const byTenantAndId = await prisma.customer.findFirst({
  where: { tenantId: 'ten_acme', id: 'cus_globex_carol' },
  select: { id: true },
});
console.log('✅ same id, scoped to acme:', byTenantAndId);

await prisma.$disconnect();
