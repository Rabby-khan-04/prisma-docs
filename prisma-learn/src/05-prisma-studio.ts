// Chapter 05 — Prisma Studio data check.
// Studio is a CLI, not an import. This script prints the rows Studio will show.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const tenants = await prisma.tenant.findMany({
  select: {
    slug: true,
    name: true,
    plan: true,
    _count: { select: { customers: true, products: true, orders: true } },
  },
  orderBy: { slug: 'asc' },
});
for (const tenant of tenants) {
  console.log(tenant.slug, tenant.name, tenant.plan, tenant._count);
}

await prisma.$disconnect();
