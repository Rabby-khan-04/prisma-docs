// Chapter 08 — unique constraints.
// Same email is allowed in two tenants, but not twice in one tenant.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const a = await prisma.customer.create({
  data: { id: 'cus_ch08_acme', tenantId: 'ten_acme', email: 'shared@example.test', name: 'Acme Shared' },
  select: { id: true, tenantId: true, email: true },
});
console.log('acme created:', a);

const b = await prisma.customer.create({
  data: { id: 'cus_ch08_globex', tenantId: 'ten_globex', email: 'shared@example.test', name: 'Globex Shared' },
  select: { id: true, tenantId: true, email: true },
});
console.log('globex created:', b);

try {
  await prisma.customer.create({
    data: { tenantId: 'ten_acme', email: 'shared@example.test', name: 'Duplicate in Acme' },
  });
} catch (error) {
  const e = error as { code?: string; meta?: unknown };
  console.log('duplicate rejected:', e.code, JSON.stringify(e.meta));
}

await prisma.customer.deleteMany({ where: { id: { in: ['cus_ch08_acme', 'cus_ch08_globex'] } } });
await prisma.$disconnect();
