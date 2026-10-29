# 17. Referential actions danger demo

## 1) Simple explanation (like I'm 7)
Deleting a tenant with CASCADE deletes EVERYTHING under it - orders, items, payments, customers, products. We run this in a rolled-back transaction so nothing is actually deleted.

## 2) Real name
**⚠️ DANGER DEMO: Cascading deletes** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/17-referential-actions-danger-demo.ts`

```ts
// Chapter 17 — DANGER DEMO: cascade deletion, run inside a rolled-back transaction.
// Nothing is permanently deleted; the counts show what *would* happen.
import { createPrisma } from './lib/prisma.js';
import type { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma();
const ROLLBACK = Symbol('rollback');

async function rolledBack<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      const value = await fn(tx);
      throw { [ROLLBACK]: true, value };
    });
  } catch (error) {
    if (error && typeof error === 'object' && ROLLBACK in error) return (error as { value: T }).value;
    throw error;
  }
}
// ... (counts queries, delete order, delete customer attempt, delete tenant, rollback)
```

## 4) The SQL behind it (real `prisma:query` output)
Shows deleting one order cascades to items/payments. Deleting a customer with orders is blocked by RESTRICT. Deleting tenant cascades everything. All rolled back.

## 5) What I should see
Inside rollback: deleting order removes items/payments. Customer delete fails with P2003. Tenant delete cascades all data. After rollback, data is intact.

## 6) When to use it / when NOT to
**Use when:** Understanding blast radius of CASCADE.  
**Don't use when:** Running CASCADE deletes in production without backups and understanding. For historical data (orders), prefer soft delete or archival.

## 7) Common mistakes
- Using CASCADE on foreign keys to audit/history tables.
- Not testing cascade behavior.
- Deleting parents without considering children.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Look up which FKs use CASCADE vs RESTRICT in schema. Modify the demo to see effects.  
**Reset:** Everything rolled back, data unchanged. Run `SEED_RESET=1 npx prisma db seed` if needed.

## 9) Next
[18. Indexes](./18-indexes.md)
