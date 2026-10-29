# 13. One-to-many relations

## 1) Simple explanation (like I'm 7)
One customer can have many orders. One tenant can have many products. The "many" side holds the foreign key.

## 2) Real name
**One-to-many relation** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/13-relations-one-to-many.ts`

```ts
// Chapter 13 — one-to-many relation.
// Tenant 1---N Product and Customer 1---N Order.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const tenant = await prisma.tenant.findUnique({
  where: { id: 'ten_acme' },
  select: {
    slug: true,
    products: { select: { name: true, priceCents: true }, orderBy: { priceCents: 'desc' } },
    customers: {
      select: { name: true, orders: { select: { number: true, status: true, totalCents: true } } },
    },
  },
});
console.dir(tenant, { depth: 6 });

const customer = await prisma.customer.findUnique({
  where: { id: 'cus_acme_alice' },
  select: { name: true, _count: { select: { orders: true } } },
});
console.log('alice order count:', customer);

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
Nested reads generate multiple queries joined by Prisma (or uses IN clauses).

## 5) What I should see
Nested data: tenant with products and customers with their orders. Count via `_count`.

## 6) When to use it / when NOT to
**Use when:** Modeling parent-child relationships.  
**Don't use when:** Loading massive trees in one go without pagination — can cause N+1 or huge payloads (see chapters 43, 64).

## 7) Common mistakes
- Forgetting indexes on foreign keys.
- Loading all relations without limits.
- Not scoping by tenantId in queries.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Use `include` vs `select`. Try `_count` on relations.  
**Reset:** No changes.

## 9) Next
[14. Many-to-many relations](./14-relations-many-to-many.md)
