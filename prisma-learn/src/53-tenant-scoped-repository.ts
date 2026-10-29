// Chapter 53 — a tenant-scoped repository.
// The type system makes it hard to run a tenant query without a TenantContext.
import { createPrisma } from './lib/prisma.js';
import { createTenantRepository, TenantResourceNotFoundError } from './lib/tenant-repository.js';

const prisma = createPrisma({ logSql: false });
const repo = createTenantRepository(prisma);

const acme = { tenantId: 'ten_acme' } as const;
const globex = { tenantId: 'ten_globex' } as const;

console.log('acme products:', await repo.listProducts(acme));
console.log('globex products:', await repo.listProducts(globex));

// A product that exists, but in the other tenant.
try {
  await repo.getProduct(acme, 'prd_globex_phone');
} catch (error) {
  console.log('acme reading globex product:', (error as Error).name, '-', (error as Error).message);
}

// A write attempts the same cross-tenant id: updateMany matches zero rows.
try {
  await repo.updateProductPrice(acme, 'prd_globex_phone', 1);
} catch (error) {
  console.log('acme updating globex product:', error instanceof TenantResourceNotFoundError);
}

// A create cannot choose a tenant: createProduct has no tenantId parameter.
const created = await repo.createProduct(acme, {
  sku: 'CH53-REPO',
  slug: 'ch53-repo',
  name: 'Repository Product',
  priceCents: 1234,
  stock: 2,
});
console.log('created in acme:', created);

// The same repository instance, called with globex, cannot see it.
try {
  await repo.getProduct(globex, created.id);
} catch (error) {
  console.log('globex reading acme product:', (error as Error).name);
}

console.log('acme revenue by customer:', await repo.revenueByCustomer(acme));
console.log('globex revenue by customer:', await repo.revenueByCustomer(globex));

await prisma.product.delete({ where: { tenantId_id: { tenantId: 'ten_acme', id: created.id } } });
await prisma.$disconnect();
