// Chapter 02 — what Prisma is and is not.
// Prisma is a client/migration tool, not a cache: the same call hits SQL every time.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const first = await prisma.product.count({ where: { tenantId: 'ten_acme' } });
const second = await prisma.product.count({ where: { tenantId: 'ten_acme' } });
console.log('count twice:', first, second);

// Raw SQL still works, and PostgreSQL returns count() as bigint.
const [{ count }] = await prisma.$queryRaw<Array<{ count: bigint }>>`
  SELECT count(*)::bigint AS count FROM products WHERE tenant_id = ${'ten_acme'}
`;
console.log('raw count type:', typeof count, count.toString());

// Prisma does not hide the database: constraints still fire.
try {
  await prisma.tenant.create({ data: { id: 'ten_dup', slug: 'acme', name: 'Duplicate slug' } });
} catch (error) {
  console.log('database still enforces UNIQUE:', (error as { code?: string }).code);
}

await prisma.$disconnect();
