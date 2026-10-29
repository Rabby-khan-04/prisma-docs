// Chapter 11 — native database types (@db.*).
// Shows exactly which PostgreSQL types Prisma created.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const columns = await prisma.$queryRaw<
  Array<{
    column_name: string;
    data_type: string;
    udt_name: string;
    character_maximum_length: number | null;
    numeric_precision: number | null;
    numeric_scale: number | null;
  }>
>`
  SELECT column_name, data_type, udt_name, character_maximum_length, numeric_precision, numeric_scale
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'products'
  ORDER BY ordinal_position
`;
console.table(columns);

await prisma.$disconnect();
