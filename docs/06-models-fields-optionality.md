# 06. Models, fields, optionality

## 1) Simple explanation (like I'm 7)
A model in `schema.prisma` becomes a table in PostgreSQL. Fields become columns. `String?` means the column can be NULL (optional). Omitted fields with defaults get filled in automatically.

## 2) Real name
**Model, scalar fields, optionality (`?`)** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/06-models-fields-optionality.ts`

```ts
// Chapter 06 — models, fields, optionality.
// description is nullable ("String?"); active has a default; tenantId is required.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const created = await prisma.product.create({
  data: {
    id: 'prd_ch06_optional',
    tenantId: 'ten_acme',
    sku: 'CH06-OPT-01',
    slug: 'ch06-optional',
    name: 'Optional Field Demo',
    description: null, // explicit null is allowed
    priceCents: 1000,
    // stock and active are omitted -> database/client defaults apply
  },
  select: { id: true, description: true, stock: true, active: true },
});
console.log('created:', created);

const missing = await prisma.product.create({
  data: {
    id: 'prd_ch06_missing',
    tenantId: 'ten_acme',
    sku: 'CH06-MISS-01',
    slug: 'ch06-missing',
    name: 'Omitted Description',
    priceCents: 500,
  },
  select: { description: true },
});
console.log('omitted description:', missing);

await prisma.product.deleteMany({ where: { id: { in: ['prd_ch06_optional', 'prd_ch06_missing'] } } });
await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
```
prisma:query INSERT INTO "public"."products" ("id","tenant_id","sku","slug","name","description","price_cents","stock","active","view_count","created_at","updated_at") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING "public"."products"."id", "public"."products"."description", "public"."products"."stock", "public"."products"."active" -- params=["prd_ch06_optional","ten_acme","CH06-OPT-01","ch06-optional","Optional Field Demo",null,1000,"0",true,"0","2026-10-28T05:42:40.152Z","2026-10-28T05:42:40.152Z"]
created: { id: 'prd_ch06_optional', description: null, stock: 0, active: true }
prisma:query INSERT INTO "public"."products" ("id","tenant_id","sku","slug","name","price_cents","stock","active","view_count","created_at","updated_at") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING "public"."products"."description" -- params=["prd_ch06_missing","ten_acme","CH06-MISS-01","ch06-missing","Omitted Description",500,"0",true,"0","2026-10-28T05:42:40.166Z","2026-10-28T05:42:40.166Z"]
omitted description: { description: null }
prisma:query DELETE FROM "public"."products" WHERE "public"."products"."id" IN ($1,$2) -- params=["prd_ch06_optional","prd_ch06_missing"]
```

## 5) What I should see
Explicit `null` and omitted optional field both result in `NULL` in the database. `stock` defaults to `0`, `active` defaults to `true`.

## 6) When to use it / when NOT to
**Use when:** Modeling required vs optional data. Use `?` for nullable columns, set defaults for sensible values.  
**Don't use when:** Using empty strings to mean "no value" — be explicit about NULL vs empty string based on business rules.

## 7) Common mistakes
- Confusing "omitted" with "undefined" — Prisma treats omitted optional fields as NULL when there's no default.
- Forgetting that `String` without `?` is required (NOT NULL).
- Not considering NULL semantics in `where` clauses (need `equals: null` or relation filters).

## 8) Try it yourself (hint + reset instructions)
**Hint:** Create a product without `sku` (required) and see the validation error.  
**Reset:** Rows created are deleted at the end of the script.

## 9) Next
[07. IDs, defaults, updatedAt](./07-ids-defaults-updatedat.md)
