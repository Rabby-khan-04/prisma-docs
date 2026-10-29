# 05. Prisma Studio

## 1) Simple explanation (like I'm 7)
Prisma Studio is a web UI to browse and edit data in your database. It's great for learning and inspecting fixtures, but it's a manual tool — you should never use it to run bulk destructive changes in production without a plan.

## 2) Real name
**Prisma Studio** (launched via `npx prisma studio`).

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/05-prisma-studio.ts`

```ts
// Chapter 05 — Prisma Studio data check.
// Studio is a CLI, not an import. This script prints the rows Studio will show.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const tenants = await prisma.tenant.findMany({
  select: {
    slug: true,
    name: true,
    plan: true,
    _count: { select: { customers: true, products: true, orders: true } },
  },
  orderBy: { slug: 'asc' },
});
for (const tenant of tenants) {
  console.log(tenant.slug, tenant.name, tenant.plan, tenant._count);
}

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
```
acme Acme Outdoors PRO { customers: 2, products: 3, orders: 2 }
globex Globex Electronics FREE { customers: 2, products: 3, orders: 2 }
```

## 5) What I should see
Two tenants with their counts matching the fixture. Studio would show the same data in a browsable UI.

## 6) When to use it / when NOT to
**Use when:** Inspecting seed data, exploring relations visually, or debugging a small dataset locally.  
**Don't use when:** Editing production data casually, running large updates/deletes, or treating it as an audit trail. Always use migrations and version-controlled scripts for schema/data changes.

## 7) Common mistakes
- Editing data directly in Studio and forgetting to record the change.
- Opening Studio against the wrong database (always check your guarded URL).
- Assuming Studio enforces application-level tenant checks (it uses the DB connection you give it).

## 8) Try it yourself (hint + reset instructions)
**Hint:** Run `npm run db:studio` from `prisma-learn/` (guarded). Browse `Product` and `Order` with related rows.  
**Reset:** `SEED_RESET=1 npx prisma db seed` restores the two-tenant fixture.

## 9) Next
[06. Models, fields, optionality](./06-models-fields-optionality.md)
