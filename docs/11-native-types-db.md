# 11. Native types with @db.*

## 1) Simple explanation (like I'm 7)
Sometimes you want to be explicit about the exact PostgreSQL type. `@db.VarChar(254)`, `@db.Timestamptz(3)`, `@db.Decimal(3,2)`, `@db.JsonB` tell Prisma exactly what to create.

## 2) Real name
**Native database type attributes** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/11-native-types-db.ts`

```ts
// Chapter 11 — native database types (@db.*).
// Shows exactly which PostgreSQL types Prisma created.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const columns = await prisma.$queryRaw<
  Array<{
    column_name: string;
    data_type: string;
    udt_name: string;
    character_maximum_length: number | null;
    numeric_precision: number | null;
    numeric_scale: number | null;
  }>
>`
  SELECT column_name, data_type, udt_name, character_maximum_length, numeric_precision, numeric_scale
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'products'
  ORDER BY ordinal_position
`;
console.table(columns);

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
Shows actual PostgreSQL types for `products` columns (character varying with lengths, integer, boolean, numeric, bigint, jsonb, timestamp with time zone, etc.).

## 5) What I should see
Explicit types like `character varying(40)`, `integer`, `boolean`, `numeric(3,2)`, `bigint`, `jsonb`, `timestamp with time zone`.

## 6) When to use it / when NOT to
**Use when:** You need precise control over types (length limits, precision, specific PG types).  
**Don't use when:** Default types are fine and you don't need DB-specific constraints.

## 7) Common mistakes
- Using `@db.Text` everywhere when `@db.VarChar(n)` with a limit is better for validation.
- Forgetting `@db.Timestamptz` for time-aware data.
- Using `Float` for money (we use integer cents — see chapter 45).

## 8) Try it yourself (hint + reset instructions)
**Hint:** Compare `@db.VarChar(30)` vs plain `String`. Look at `OrderItem` snapshots using `@db.VarChar`.  
**Reset:** No changes.

## 9) Next
[12. One-to-one relations](./12-relations-one-to-one.md)
