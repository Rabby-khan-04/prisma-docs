# 01. What an ORM is

## 1) Simple explanation (like I'm 7)
An ORM (Object-Relational Mapper) lets you talk to a database using objects and methods in your programming language, instead of writing raw SQL strings everywhere. It translates your code like `prisma.product.findFirst(...)` into SQL like `SELECT ... FROM products WHERE ...`, and turns the database rows back into JavaScript objects.

## 2) Real name
**ORM (Object-Relational Mapper)** — Prisma Client is an ORM/query builder that generates SQL for you.

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/01-what-is-an-orm.ts`

```ts
// Chapter 01 — what an ORM does for you.
// Same question, once in Prisma Client and once in raw SQL.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const ormResult = await prisma.product.findFirst({
  where: { tenantId: 'ten_acme', slug: 'trail-laptop' },
  select: { id: true, name: true, priceCents: true },
});
console.log('Prisma result:', ormResult);

const rawResult = await prisma.$queryRaw<
  Array<{ id: string; name: string; price_cents: number }>
>`SELECT id, name, price_cents FROM products WHERE tenant_id = ${'ten_acme'} AND slug = ${'trail-laptop'}`;
console.log('Raw result:', rawResult);

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
```
prisma:query SELECT "public"."products"."id", "public"."products"."name", "public"."products"."price_cents" FROM "public"."products" WHERE ("public"."products"."tenant_id" = $1 AND "public"."products"."slug" = $2) LIMIT $3 OFFSET $4 -- params=["ten_acme","trail-laptop","1","0"]
Prisma result: { id: 'prd_acme_laptop', name: 'Trail Laptop 14', priceCents: 129900 }
prisma:query SELECT id, name, price_cents FROM products WHERE tenant_id = $1 AND slug = $2 -- params=["ten_acme","trail-laptop"]
Raw result: [
  {
    id: 'prd_acme_laptop',
    name: 'Trail Laptop 14',
    price_cents: 129900
  }
]
```

## 5) What I should see
Prisma Client returns camelCase fields (`priceCents`), raw SQL returns snake_case columns as they appear in the result. Both return the same row. The ORM handles mapping, parameterization, and object construction.

## 6) When to use it / when NOT to
**Use when:** You want type safety, relationship navigation, less boilerplate for common CRUD, and portable query construction.  
**Don't use when:** You need a very specific PostgreSQL feature that is easier to express directly, or you need to squeeze every last byte of performance on a complex reporting query. Prisma still lets you drop to raw SQL (`$queryRaw`) when needed.

## 7) Common mistakes
- Thinking the ORM "hides" the database — constraints, indexes, and SQL still matter.
- Mixing up Prisma field names (camelCase) with database column names (snake_case). `@map`/`@@map` handle mapping.
- Assuming an ORM call is free of queries — it generates SQL every time unless you add caching yourself.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Try changing `select` to `include` and see how Prisma shapes the query. Compare the SQL.  
**Reset:** The fixture is restored by `SEED_RESET=1 npx prisma db seed` from `prisma-learn/`. Always run `npm run db:check` first.

## 9) Next
[02. What Prisma is and is not](./02-what-prisma-is-and-is-not.md)
