# 16. Referential actions (onDelete / onUpdate)

## 1) Simple explanation (like I'm 7)
When you delete or update a parent row, what happens to child rows? `CASCADE` deletes children too. `RESTRICT`/`NoAction` prevents deletion. `SetNull` sets FK to NULL.

## 2) Real name
**Foreign key referential actions** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/16-referential-actions.ts`

```ts
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
```

## 4) The SQL behind it (real `prisma:query` output)
Shows actual FK constraints with CASCADE, RESTRICT, etc.

## 5) What I should see
Order items cascade when order deleted. Deleting a customer with orders is RESTRICTed. Profile cascades when customer deleted.

## 6) When to use it / when NOT to
**Use when:** Choosing the right safety level. CASCADE is convenient but dangerous; RESTRICT prevents accidental deletion.  
**Don't use when:** Using CASCADE everywhere without understanding the blast radius.

## 7) Common mistakes
- CASCADE deleting historical data unintentionally.
- Not realizing referential actions are enforced by PostgreSQL.
- Confusing `onDelete` in Prisma schema with application logic.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Look at schema.prisma `onDelete` values. Try deleting in chapter 17.  
**Reset:** No changes.

## 9) Next
[17. Referential actions danger demo](./17-referential-actions-danger-demo.md)
