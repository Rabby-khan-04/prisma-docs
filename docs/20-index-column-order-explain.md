# 20. Index column order and EXPLAIN

## 1) Simple explanation (like I'm 7)
In a composite index `(tenant_id, active, created_at)`, PostgreSQL can use it if you filter by `tenant_id` first. If you skip `tenant_id` and only filter by `active`, it might not use the index efficiently.

## 2) Real name
**Index leftmost-prefix rule and query planning** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/20-index-column-order-explain.ts`

```ts
// Chapter 20 — index column order and EXPLAIN.
// Index: (tenant_id, active, created_at). Leftmost columns must be present.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const friendly = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT id FROM products
  WHERE tenant_id = ${'ten_acme'} AND active = ${true}
  ORDER BY created_at DESC
  LIMIT 10
`;
console.log('--- tenant_id + active + created_at (index-friendly) ---');
console.log(friendly.map((row) => row['QUERY PLAN']).join('\n'));

const wrongPrefix = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT id FROM products
  WHERE active = ${true}
  ORDER BY created_at DESC
  LIMIT 10
`;
console.log('--- active only (index prefix missing) ---');
console.log(wrongPrefix.map((row) => row['QUERY PLAN']).join('\n'));

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
First query can use the composite index. Second may do a scan or less efficient plan.

## 5) What I should see
Leftmost-prefix rule in action. Column order in `@@index` matters for multi-column queries.

## 6) When to use it / when NOT to
**Use when:** Designing indexes for your actual query patterns. Put most selective/filtering columns first.  
**Don't use when:** Creating indexes without checking EXPLAIN plans.

## 7) Common mistakes
- Putting low-cardinality columns first.
- Creating indexes that don't match query patterns.
- Not considering sort order.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Try different combinations. Add different indexes and compare.  
**Reset:** No changes.

## 9) Next
[21. migrate dev vs deploy vs push](./21-migrate-dev-deploy-push.md)
