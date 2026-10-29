# 02. What Prisma is and is not

## 1) Simple explanation (like I'm 7)
Prisma is a set of tools for working with databases: a schema language, a migration system, and a type-safe client that writes SQL for you. It's not the database itself, it's not a cache, and it won't stop PostgreSQL from enforcing its rules.

## 2) Real name
**Prisma ORM (Client + Migrate + Schema)** — for this course we use **Prisma 7.10.1** with the `prisma-client` generator and a driver adapter.

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/02-what-prisma-is-not.ts`

```ts
// Chapter 02 — what Prisma is and is not.
// Prisma is a client/migration tool, not a cache: the same call hits SQL every time.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const first = await prisma.product.count({ where: { tenantId: 'ten_acme' } });
const second = await prisma.product.count({ where: { tenantId: 'ten_acme' } });
console.log('count twice:', first, second);

// Raw SQL still works, and PostgreSQL returns count() as bigint.
const [{ count }] = await prisma.$queryRaw<Array<{ count: bigint }>>`
  SELECT count(*)::bigint AS count FROM products WHERE tenant_id = ${'ten_acme'}
`;
console.log('raw count type:', typeof count, count.toString());

// Prisma does not hide the database: constraints still fire.
try {
  await prisma.tenant.create({ data: { id: 'ten_dup', slug: 'acme', name: 'Duplicate slug' } });
} catch (error) {
  console.log('database still enforces UNIQUE:', (error as { code?: string }).code);
}

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
```
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."products"."id" FROM "public"."products" WHERE "public"."products"."tenant_id" = $1 OFFSET $2) AS "sub" -- params=["ten_acme","0"]
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."products"."id" FROM "public"."products" WHERE "public"."products"."tenant_id" = $1 OFFSET $2) AS "sub" -- params=["ten_acme","0"]
count twice: 3 3
prisma:query 
  SELECT count(*)::bigint AS count FROM products WHERE tenant_id = $1
 -- params=["ten_acme"]
raw count type: bigint 3
database still enforces UNIQUE: P2002
```

## 5) What I should see
Two identical `count()` calls each emit SQL (no automatic caching). Raw `count(*)::bigint` comes back as a `bigint`. Trying to create a tenant with a duplicate `slug` fails with Prisma error code `P2002` because PostgreSQL enforces the UNIQUE constraint.

## 6) When to use it / when NOT to
**Use when:** You want type-safe queries, schema-driven migrations, and explicit control over SQL when needed.  
**Don't use when:** You expect Prisma to be a cache, a schema visualizer that replaces migrations, or something that bypasses database rules. Also don't assume "latest" is safe — we pinned to **7.10.1** because npm `latest` was an RC at the time of setup.

## 7) Common mistakes
- Treating the client as in-memory cached data.
- Assuming Prisma prevents duplicate inserts without a unique constraint.
- Mismatching `prisma` CLI and `@prisma/client` versions (always keep them identical).
- Using patterns from Prisma 8 docs on Prisma 7 (we call out differences throughout).

## 8) Try it yourself (hint + reset instructions)
**Hint:** Add `$on('query')` logging or use `logSql` in `createPrisma` to see every query.  
**Reset:** `SEED_RESET=1 npx prisma db seed` in `prisma-learn/` (after `npm run db:check`).

## 9) Next
[03. Project setup](./03-project-setup.md)
