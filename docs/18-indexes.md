# 18. Indexes

## 1) Simple explanation (like I'm 7)
Indexes help PostgreSQL find rows faster, like an index in a book. But they slow down writes and take space. Prisma creates some automatically, you add others with `@@index`.

## 2) Real name
**Database indexes (`@@index`)** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/18-indexes.ts`

```ts
// Chapter 18 — indexes: what Prisma created and whether PostgreSQL uses it.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const indexes = await prisma.$queryRaw<Array<{ tablename: string; indexname: string; indexdef: string }>>`
  SELECT tablename, indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename IN ('products', 'orders', 'order_items')
  ORDER BY tablename, indexname
`;
console.table(indexes);

const plan = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT id, name, price_cents
  FROM products
  WHERE tenant_id = ${'ten_acme'} AND active = ${true}
  ORDER BY created_at DESC
  LIMIT 10
`;
console.log(plan.map((row) => row['QUERY PLAN']).join('\n'));

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
Shows indexes on products/orders/order_items and EXPLAIN plan using `products_tenant_id_active_created_at_idx`.

## 5) What I should see
Prisma creates indexes for unique constraints and foreign keys. The composite index is used for tenant-scoped filtered queries.

## 6) When to use it / when NOT to
**Use when:** You query by specific columns frequently (especially tenantId + filters).  
**Don't use when:** Indexing everything — writes get slower, indexes take space.

## 7) Common mistakes
- Missing indexes on foreign keys used in joins.
- Wrong column order in composite indexes.
- Not checking EXPLAIN plans.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Add `@@index([tenantId, name])` and compare EXPLAIN. Remove it.  
**Reset:** No changes to schema needed for reading.

## 9) Next
[19. Composite keys and unique constraints](./19-composite-keys-and-unique.md)
