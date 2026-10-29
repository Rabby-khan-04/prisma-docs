// Chapter 44 — raw queries: tagged template vs unsafe interpolation.
import { createPrisma } from './lib/prisma.js';
import { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma();

const tenantInput = 'ten_acme';

const safe = await prisma.$queryRaw<Array<{ id: string; tenant_id: string; name: string }>>`
  SELECT id, tenant_id, name FROM products WHERE tenant_id = ${tenantInput}
`;
console.log('safe rows:', safe.length, safe.map((row) => row.tenant_id));

// ⚠️ DANGER DEMO: the input is concatenated into SQL.
const attack = "' OR 1=1 --";
const unsafe = await prisma.$queryRawUnsafe<Array<{ id: string; tenant_id: string; name: string }>>(
  `SELECT id, tenant_id, name FROM products WHERE tenant_id = '${attack}'`,
);
console.log('⚠️ unsafe rows:', unsafe.length, unsafe.map((row) => row.tenant_id));

// Prisma.sql builds a safe dynamic fragment.
const column = Prisma.raw('name');
const dynamic = await prisma.$queryRaw<Array<{ name: string }>>(
  Prisma.sql`SELECT ${column} FROM products WHERE tenant_id = ${tenantInput} ORDER BY name ASC LIMIT 2`,
);
console.log('Prisma.sql:', dynamic);

// Parameterized write, then revert.
await prisma.$executeRaw`
  UPDATE products SET stock = stock + 1 WHERE tenant_id = ${tenantInput} AND id = ${'prd_acme_mouse'}
`;
await prisma.$executeRaw`
  UPDATE products SET stock = stock - 1 WHERE tenant_id = ${tenantInput} AND id = ${'prd_acme_mouse'}
`;
console.log('parameterized write reverted');

await prisma.$disconnect();
