# 09. Mapping with @map and @@map

## 1) Simple explanation (like I'm 7)
Prisma uses camelCase in your code (`priceCents`), but your database might use snake_case (`price_cents`). `@map` and `@@map` let you bridge the difference without changing either side.

## 2) Real name
**Field and model mapping** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/09-mapping-map-models.ts`

```ts
// Chapter 09 — @map and @@map.
// Prisma field names stay camelCase; PostgreSQL sees snake_case.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const columns = await prisma.$queryRaw<
  Array<{ column_name: string; data_type: string; is_nullable: string }>
>`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'products'
  ORDER BY ordinal_position
`;
console.table(columns);

const mapped = await prisma.product.findFirst({
  where: { tenantId: 'ten_acme', sku: 'ACME-LAP-01' },
  select: { priceCents: true, createdAt: true },
});
console.log('Prisma names:', mapped);
console.log('SQL names: price_cents, created_at');

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
The script shows snake_case columns in the database and camelCase field access in Prisma.

## 5) What I should see
Database columns like `price_cents`, `created_at`, `tenant_id`. Prisma Client uses `priceCents`, `createdAt`, `tenantId`.

## 6) When to use it / when NOT to
**Use when:** Working with legacy databases that use snake_case, or enforcing your team's naming convention.  
**Don't use when:** Starting fresh — pick one convention and stick with it consistently.

## 7) Common mistakes
- Forgetting `@@map("table_name")` and having model/table name mismatches.
- Mixing mapped and unmapped fields carelessly.
- Thinking mapping changes the actual database schema (it doesn't).

## 8) Try it yourself (hint + reset instructions)
**Hint:** Look at `schema.prisma` for `@@map("products")` and `@map("price_cents")`.  
**Reset:** No changes made.

## 9) Next
[10. Enums](./10-enums.md)
