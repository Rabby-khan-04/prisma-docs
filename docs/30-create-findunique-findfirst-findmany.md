# 30. create, findUnique, findFirst, findMany

## 1) Simple explanation (like I'm 7)
`create` adds a row. `findUnique` finds by unique key. `findFirst` finds first match. `findMany` finds all matches.

## 2) Real name
**Prisma Client CRUD reads/writes** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/30-create-findunique-findfirst-findmany.ts`

```ts
// Chapter 30 — create, findUnique, findFirst, findMany.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const created = await prisma.product.create({
  data: {
    id: 'prd_ch30_demo',
    tenantId: 'ten_acme',
    sku: 'CH30-DEMO',
    slug: 'ch30-demo',
    name: 'Chapter 30 Demo',
    priceCents: 1999,
    stock: 3,
  },
  select: { id: true, name: true, priceCents: true },
});
console.log('create:', created);

const byId = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch30_demo' } },
  select: { id: true, name: true },
});
console.log('findUnique (tenant + id):', byId);

const first = await prisma.product.findFirst({
  where: { tenantId: 'ten_acme', active: true },
  orderBy: { priceCents: 'desc' },
  select: { name: true, priceCents: true },
});
console.log('findFirst:', first);

const many = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', priceCents: { gte: 10000 } },
  orderBy: { priceCents: 'asc' },
  take: 3,
  select: { name: true, priceCents: true },
});
console.log('findMany:', many);

await prisma.product.delete({ where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_ch30_demo' } } });
await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
INSERT, SELECT with unique composite key, SELECT with ORDER BY, SELECT with WHERE and LIMIT.

## 5) What I should see
All four operations work as expected with tenant scoping.

## 6) When to use it / when NOT to
**Use when:** Standard CRUD operations.  
**Don't use when:** Using `findUnique` on non-unique fields (use `findFirst`).

## 7) Common mistakes
- Using `findUnique` without a unique identifier.
- Forgetting tenantId in where clauses.
- Not using `select` to limit fields.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Try `findFirst` vs `findMany` with same filter.  
**Reset:** Row deleted at end.

## 9) Next
[31. update, upsert, delete](./31-update-upsert-delete.md)
