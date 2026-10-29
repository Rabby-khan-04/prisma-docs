// Chapter 16 — onDelete / onUpdate as PostgreSQL FK rules.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const fks = await prisma.$queryRaw<
  Array<{ table_name: string; constraint_name: string; delete_rule: string; update_rule: string; definition: string }>
>`
  SELECT
    conrelid::regclass::text AS table_name,
    conname AS constraint_name,
    CASE confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE'
                     WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS delete_rule,
    CASE confupdtype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE'
                     WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS update_rule,
    pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
  WHERE contype = 'f'
    AND conrelid IN ('orders'::regclass, 'order_items'::regclass, 'payments'::regclass,
                     'customer_profiles'::regclass, 'categories'::regclass)
  ORDER BY table_name, constraint_name
`;
console.table(fks.map(({ definition, ...rest }) => rest));
for (const fk of fks) console.log(`${fk.constraint_name}: ${fk.definition}`);

await prisma.$disconnect();
