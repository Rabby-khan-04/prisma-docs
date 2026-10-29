# 10. Enums

## 1) Simple explanation (like I'm 7)
An enum is a fixed list of allowed values. PostgreSQL creates an enum type, Prisma generates TypeScript types for it, and invalid values are rejected by the database.

## 2) Real name
**Prisma enums and PostgreSQL enum types** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/10-enums.ts`

```ts
// Chapter 10 — enums.
// Prisma enums become PostgreSQL enum types; invalid values are rejected by the DB.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const enumValues = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
  SELECT e.enumlabel
  FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
  WHERE t.typname = 'OrderStatus'
  ORDER BY e.enumsortorder
`;
console.log('OrderStatus values:', enumValues.map((v) => v.enumlabel).join(', '));

const order = await prisma.order.create({
  data: {
    id: 'ord_ch10_enum',
    tenantId: 'ten_acme',
    customerId: 'cus_acme_alice',
    number: 'CH10-0001',
    status: 'PAID',
    subtotalCents: 1000,
    totalCents: 1000,
  },
  select: { id: true, status: true },
});
console.log('created order:', order);

try {
  await prisma.$executeRawUnsafe(`UPDATE orders SET status = 'NOT_A_STATUS' WHERE id = 'ord_ch10_enum'`);
} catch (error) {
  console.log('database rejects unknown enum:', (error as { code?: string }).code);
}

await prisma.order.delete({ where: { id: 'ord_ch10_enum' } });
await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
```
OrderStatus values: PENDING, PAID, FULFILLED, CANCELLED, REFUNDED
created order: { id: 'ord_ch10_enum', status: 'PAID' }
database rejects unknown enum: 22P02
```

## 5) What I should see
Enum values defined in schema become PostgreSQL enum type. Invalid values are rejected with code `22P02`.

## 6) When to use it / when NOT to
**Use when:** You have a fixed, small set of states that rarely change.  
**Don't use when:** You need to add/remove values frequently in production — adding values to enums in PostgreSQL has caveats, removing is hard. Consider a lookup table instead for evolving sets.

## 7) Common mistakes
- Trying to add enum values without a proper migration strategy.
- Not handling enum type changes in production.
- Mixing string literals with Prisma enum types.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Look up `OrderStatus` enum in schema.prisma. Try creating with an invalid status via Prisma.  
**Reset:** Order deleted at end of script.

## 9) Next
[11. Native types with @db.*](./11-native-types-db.md)
