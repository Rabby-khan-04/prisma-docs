# 14. Many-to-many relations

## 1) Simple explanation (like I'm 7)
Many products can have many tags, and many tags can belong to many products. You can let Prisma manage an implicit join table, or create an explicit one with extra fields.

## 2) Real name
**Implicit vs explicit many-to-many** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/14-relations-many-to-many.ts`

```ts
// Chapter 14 — many-to-many: explicit ProductTag vs implicit Article/Label.
// DANGER DEMO: the implicit join table has no tenantId, so it happily links
// an Acme article to a Globex label. The script disconnects it again.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const product = await prisma.product.findUnique({
  where: { id: 'prd_acme_laptop' },
  select: { name: true, tags: { select: { tag: { select: { name: true, slug: true } } } } },
});
console.log('explicit ProductTag:', JSON.stringify(product));

const joinTable = await prisma.$queryRaw<Array<{ table_name: string }>>`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN ('product_tags', '_ArticleToLabel')
  ORDER BY table_name
`;
console.log('join tables:', joinTable.map((row) => row.table_name));

const before = await prisma.article.findUnique({
  where: { id: 'art_acme_trail' },
  select: { tenantId: true, title: true, labels: { select: { tenantId: true, name: true } } },
});
console.log('before cross-tenant connect:', JSON.stringify(before));

const crossed = await prisma.article.update({
  where: { id: 'art_acme_trail' },
  data: { labels: { connect: { id: 'lbl_globex_mobile' } } },
  select: { tenantId: true, title: true, labels: { select: { tenantId: true, name: true } } },
});
console.log('⚠️ after cross-tenant connect:', JSON.stringify(crossed));

await prisma.article.update({
  where: { id: 'art_acme_trail' },
  data: { labels: { disconnect: { id: 'lbl_globex_mobile' } } },
});
console.log('cross-tenant link removed');

await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
Shows `product_tags` (explicit, with tenantId in composite key) vs `_ArticleToLabel` (implicit, no tenantId). The cross-tenant connect succeeds because the implicit join table has no tenant isolation.

## 5) What I should see
Explicit join model `ProductTag` has `@@id([tenantId, productId, tagId])` and tenant FKs — prevents cross-tenant links. Implicit `_ArticleToLabel` has no tenantId and allows cross-tenant connections (dangerous in multi-tenant systems).

## 6) When to use it / when NOT to
**Use when:** For multi-tenant data, prefer **explicit** join models so you can include `tenantId` and enforce isolation. Implicit is fine for single-tenant or non-tenant-scoped data.  
**Don't use when:** Using implicit M2M in a multi-tenant system without extra guards.

## 7) Common mistakes
- Assuming implicit M2M is safe for multi-tenancy.
- Not being able to add metadata to implicit join tables.
- Forgetting tenant checks in nested writes.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Look up both join tables. Try to add tenantId to implicit join — Prisma won't do it automatically; you need an explicit model.  
**Reset:** The cross-tenant link is disconnected at the end.

## 9) Next
[15. Self relations](./15-self-relations.md)
