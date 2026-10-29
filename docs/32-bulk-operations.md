# 32. Bulk operations

## 1) Simple explanation (like I'm 7)
`createMany` inserts many rows at once. `updateMany` updates many. `deleteMany` deletes many. Faster than loops, but return counts not full objects.

## 2) Real name
**Bulk operations** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/32-bulk-operations.ts`

```ts
// Chapter 32 — bulk operations.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const created = await prisma.product.createMany({
  data: [
    { id: 'prd_ch32_a', tenantId: 'ten_acme', sku: 'CH32-A', slug: 'ch32-a', name: 'Bulk A', priceCents: 1000 },
    { id: 'prd_ch32_b', tenantId: 'ten_acme', sku: 'CH32-B', slug: 'ch32-b', name: 'Bulk B', priceCents: 2000 },
    { id: 'prd_ch32_c', tenantId: 'ten_acme', sku: 'CH32-C', slug: 'ch32-c', name: 'Bulk C', priceCents: 3000 },
  ],
  skipDuplicates: true,
});
console.log('createMany count:', created.count);

const createdAndReturned = await prisma.product.createManyAndReturn({
  data: [
    { id: 'prd_ch32_d', tenantId: 'ten_acme', sku: 'CH32-D', slug: 'ch32-d', name: 'Bulk D', priceCents: 4000 },
    { id: 'prd_ch32_e', tenantId: 'ten_acme', sku: 'CH32-E', slug: 'ch32-e', name: 'Bulk E', priceCents: 5000 },
  ],
  select: { id: true, name: true, priceCents: true },
});
console.log('createManyAndReturn:', createdAndReturned);

const updated = await prisma.product.updateMany({
  where: { tenantId: 'ten_acme', id: { startsWith: 'prd_ch32_' } },
  data: { priceCents: { increment: 500 } },
});
console.log('updateMany count:', updated.count);

const deleted = await prisma.product.deleteMany({
  where: { tenantId: 'ten_acme', id: { startsWith: 'prd_ch32_' } },
});
console.log('deleteMany count:', deleted.count);

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
Multi-row INSERT, INSERT ... RETURNING for createManyAndReturn, UPDATE with increment, DELETE. Note: `createManyAndReturn` doesn't take `where` in Prisma 7.10.1.

## 5) What I should see
Bulk operations are efficient. `createManyAndReturn` needs `data`, not `where`.

## 6) When to use it / when NOT to
**Use when:** Inserting/updating/deleting many rows.  
**Don't use when:** You need relations/validation per row - bulk ops skip some Prisma features.

## 7) Common mistakes
- Forgetting `skipDuplicates`.
- Using `where` with `createManyAndReturn` (not supported).
- Not scoping by tenantId with updateMany/deleteMany (dangerous).

## 8) Try it yourself (hint + reset instructions)
**Hint:** Compare loop vs createMany performance conceptually.  
**Reset:** Cleaned up.

## 9) Next
[33. Filtering operators](./33-filtering-operators.md)
