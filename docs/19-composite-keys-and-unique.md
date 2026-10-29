# 19. Composite keys and unique constraints

## 1) Simple explanation (like I'm 7)
Sometimes uniqueness depends on two columns together. Like "slug must be unique per tenant" — same slug can exist in different tenants. Composite FKs enforce that related rows must be in the same tenant.

## 2) Real name
**Composite unique keys and composite foreign keys** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/19-composite-keys-and-unique.ts`

```ts
// Chapter 19 — composite unique constraints and composite foreign keys.
// Same slug is fine across tenants, but a cross-tenant order is impossible.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const sameSlug = await prisma.product.findMany({
  where: { slug: 'trail-laptop' },
  select: { id: true, tenantId: true, slug: true, name: true },
  orderBy: { tenantId: 'asc' },
});
console.log('same slug, two tenants:', sameSlug);

try {
  await prisma.product.create({
    data: {
      tenantId: 'ten_acme',
      sku: 'CH19-DUP-01',
      slug: 'trail-laptop',
      name: 'Duplicate slug inside Acme',
      priceCents: 100,
    },
  });
} catch (error) {
  console.log('duplicate slug in one tenant:', (error as { code?: string }).code);
}

try {
  await prisma.$executeRaw`
    INSERT INTO orders (id, tenant_id, customer_id, number, status, subtotal_cents, discount_cents,
                        total_cents, currency, placed_at, created_at, updated_at)
    VALUES (${'ord_ch19_cross'}, ${'ten_acme'}, ${'cus_globex_carol'}, ${'CH19-X'},
            CAST(${'PENDING'} AS "OrderStatus"), 100, 0, 100, 'USD', now(), now(), now())
  `;
} catch (error) {
  console.log('cross-tenant FK rejected:', (error as { code?: string }).code);
  console.log((error as { message?: string }).message?.split('\n').slice(0, 4).join('\n'));
}

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
Same slug exists in both tenants. Duplicate in same tenant fails. Cross-tenant FK insert fails with `23503`.

## 5) What I should see
`@@unique([tenantId, slug])` allows same slug across tenants. Composite FK `@@unique([tenantId, id])` + references make cross-tenant links impossible at DB level.

## 6) When to use it / when NOT to
**Use when:** Building multi-tenant systems — composite keys enforce tenant isolation.  
**Don't use when:** Single-tenant systems where global uniqueness is needed.

## 7) Common mistakes
- Using global unique constraints in multi-tenant systems.
- Not creating composite FKs properly.
- Forgetting to include tenantId in composite keys.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Look up composite uniques in schema. Try different combinations.  
**Reset:** No permanent changes.

## 9) Next
[20. Index column order and EXPLAIN](./20-index-column-order-explain.md)
