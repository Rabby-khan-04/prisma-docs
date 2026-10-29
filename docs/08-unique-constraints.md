# 08. Unique constraints

## 1) Simple explanation (like I'm 7)
A unique constraint says "no two rows can have the same value here". Same email is allowed in different tenants, but not twice in the same tenant.

## 2) Real name
**`@unique` and `@@unique`** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/08-unique-constraints.ts`

```ts
// Chapter 08 — unique constraints.
// Same email is allowed in two tenants, but not twice in one tenant.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const a = await prisma.customer.create({
  data: { id: 'cus_ch08_acme', tenantId: 'ten_acme', email: 'shared@example.test', name: 'Acme Shared' },
  select: { id: true, tenantId: true, email: true },
});
console.log('acme created:', a);

const b = await prisma.customer.create({
  data: { id: 'cus_ch08_globex', tenantId: 'ten_globex', email: 'shared@example.test', name: 'Globex Shared' },
  select: { id: true, tenantId: true, email: true },
});
console.log('globex created:', b);

try {
  await prisma.customer.create({
    data: { tenantId: 'ten_acme', email: 'shared@example.test', name: 'Duplicate in Acme' },
  });
} catch (error) {
  const e = error as { code?: string; meta?: unknown };
  console.log('duplicate rejected:', e.code, JSON.stringify(e.meta));
}

await prisma.customer.deleteMany({ where: { id: { in: ['cus_ch08_acme', 'cus_ch08_globex'] } } });
await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
```
prisma:query INSERT INTO "public"."customers" ("id","tenant_id","email","name","display_name","loyalty_points","tier","created_at","updated_at") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "public"."customers"."id", "public"."customers"."tenant_id", "public"."customers"."email" -- params=["cus_ch08_acme","ten_acme","shared@example.test","Acme Shared",null,"0","BRONZE","2026-10-28T05:42:43.152Z","2026-10-28T05:42:43.152Z"]
acme created: { id: 'cus_ch08_acme', tenantId: 'ten_acme', email: 'shared@example.test' }
prisma:query INSERT INTO "public"."customers" ("id","tenant_id","email","name","display_name","loyalty_points","tier","created_at","updated_at") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "public"."customers"."id", "public"."customers"."tenant_id", "public"."customers"."email" -- params=["cus_ch08_globex","ten_globex","shared@example.test","Globex Shared",null,"0","BRONZE","2026-10-28T05:42:43.166Z","2026-10-28T05:42:43.166Z"]
globex created: { id: 'cus_ch08_globex', tenantId: 'ten_globex', email: 'shared@example.test' }
prisma:query INSERT INTO "public"."customers" ("id","tenant_id","email","name","display_name","loyalty_points","tier","created_at","updated_at") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "public"."customers"."id", "public"."customers"."tenant_id", "public"."customers"."email", "public"."customers"."name", "public"."customers"."display_name", "public"."customers"."phone", "public"."customers"."loyalty_points", "public"."customers"."tier", "public"."customers"."banned_at", "public"."customers"."ban_reason", "public"."customers"."notes", "public"."customers"."deleted_at", "public"."customers"."created_at", "public"."customers"."updated_at" -- params=["clyftjzmf0006xgohpkydap2t","ten_acme","shared@example.test","Duplicate in Acme",null,"0","BRONZE","2026-10-28T05:42:43.177Z","2026-10-28T05:42:43.177Z"]
duplicate rejected: P2002 {"target":["tenant_id","email"]}
```

## 5) What I should see
Same email works across tenants. Duplicate in same tenant fails with `P2002` on target `["tenant_id","email"]`.

## 6) When to use it / when NOT to
**Use when:** Enforcing uniqueness at the database level (always do this, app checks aren't enough).  
**Don't use when:** Relying on application-level "check then insert" — race conditions happen.

## 7) Common mistakes
- Creating a global unique on email when you need tenant-scoped uniqueness.
- Ignoring NULLs in unique constraints (PostgreSQL allows multiple NULLs in a unique index unless using partial indexes).
- Not handling `P2002` errors properly in APIs.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Try a global unique vs composite unique. Create two rows with same value in different tenants.  
**Reset:** Rows deleted at end of script.

## 9) Next
[09. Mapping with @map and @@map](./09-mapping-map-models.md)
