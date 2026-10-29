# 12. One-to-one relations

## 1) Simple explanation (like I'm 7)
A one-to-one means "one row in table A relates to at most one row in table B". The foreign key usually lives on one side and has a UNIQUE constraint.

## 2) Real name
**One-to-one relation with FK and @unique** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/12-relations-one-to-one.ts`

```ts
// Chapter 12 — one-to-one relation.
// CustomerProfile holds the FK and a per-tenant unique constraint.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const profile = await prisma.customerProfile.create({
  data: {
    id: 'prf_ch12_bob',
    tenantId: 'ten_acme',
    customerId: 'cus_acme_bob',
    avatarUrl: 'https://example.test/bob.png',
    marketingOptIn: true,
  },
});
console.log('profile:', profile);

const customer = await prisma.customer.findUnique({
  where: { id: 'cus_acme_bob' },
  select: { id: true, name: true, profile: { select: { avatarUrl: true, marketingOptIn: true } } },
});
console.log('customer -> profile:', customer);

const reverse = await prisma.customerProfile.findUnique({
  where: { tenantId_customerId: { tenantId: 'ten_acme', customerId: 'cus_acme_bob' } },
  select: { id: true, customer: { select: { name: true, email: true } } },
});
console.log('profile -> customer:', reverse);

await prisma.customerProfile.delete({ where: { id: 'prf_ch12_bob' } });
await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
Creates profile, reads customer with nested profile, reads profile with nested customer. All using composite keys.

## 5) What I should see
One-to-one navigation works both directions. `CustomerProfile` has `@@unique([tenantId, customerId])`.

## 6) When to use it / when NOT to
**Use when:** Extending a model (optional details) without bloating the main table.  
**Don't use when:** Always creating the related row together unless necessary — consider making it required or combining tables.

## 7) Common mistakes
- Forgetting UNIQUE on FK (would allow multiple profiles per customer).
- Putting FK on the wrong side.
- Not using composite keys for tenant isolation.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Try creating two profiles for the same customer — should fail.  
**Reset:** Profile deleted at end.

## 9) Next
[13. One-to-many relations](./13-relations-one-to-many.md)
