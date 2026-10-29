// Chapter 09 — @map and @@map.
// Prisma field names stay camelCase; PostgreSQL sees snake_case.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const columns = await prisma.$queryRaw<
  Array<{ column_name: string; data_type: string; is_nullable: string }>
>`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'products'
  ORDER BY ordinal_position
`;
console.table(columns);

const mapped = await prisma.product.findFirst({
  where: { tenantId: 'ten_acme', sku: 'ACME-LAP-01' },
  select: { priceCents: true, createdAt: true },
});
console.log('Prisma names:', mapped);
console.log('SQL names: price_cents, created_at');

await prisma.$disconnect();
