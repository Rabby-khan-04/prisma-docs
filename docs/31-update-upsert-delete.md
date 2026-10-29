# 31. update, upsert, delete

## 1) Simple explanation (like I'm 7)
`update` changes existing rows. `upsert` creates if missing, updates if exists. `delete` removes a row. `updateMany`/`deleteMany` affect multiple rows.

## 2) Real name
**Updates and deletes** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/31-update-upsert-delete.ts`

```ts
// Chapter 31 — update, upsert, delete, and P2025.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const upserted = await prisma.coupon.upsert({
  where: { tenantId_code: { tenantId: 'ten_acme', code: 'CH31' } },
  update: { active: true },
  create: {
    id: 'cpn_ch31',
    tenantId: 'ten_acme',
    code: 'CH31',
    type: 'PERCENT',
    percentOff: 15,
    minOrderCents: 1000,
  },
  select: { id: true, code: true, percentOff: true },
});
console.log('upsert create:', upserted);

const updated = await prisma.coupon.update({
  where: { tenantId_code: { tenantId: 'ten_acme', code: 'CH31' } },
  data: { percentOff: 20 },
  select: { code: true, percentOff: true },
});
console.log('update:', updated);

try {
  await prisma.coupon.update({
    where: { tenantId_code: { tenantId: 'ten_acme', code: 'NOPE' } },
    data: { active: false },
  });
} catch (error) {
  console.log('missing row:', (error as { code?: string }).code);
}

await prisma.coupon.delete({
  where: { tenantId_code: { tenantId: 'ten_acme', code: 'CH31' } },
});
console.log('deleted');

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
UPSERT becomes INSERT ... ON CONFLICT, UPDATE, error P2025 on missing row, DELETE.

## 5) What I should see
Upsert creates then we update it. Updating missing row throws P2025. Delete removes it.

## 6) When to use it / when NOT to
**Use when:** Conditional creates/updates, or ensuring idempotency.  
**Don't use when:** Using `update` without handling P2025 for "update if exists" patterns.

## 7) Common mistakes
- Not handling P2025 errors.
- Using `update` when row might not exist.
- Forgetting tenantId in where clauses.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Try `updateMany` vs `update`.  
**Reset:** Cleaned up.

## 9) Next
[32. Bulk operations](./32-bulk-operations.md)
