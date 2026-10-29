# 15. Self relations

## 1) Simple explanation (like I'm 7)
A self relation is when a table relates to itself. Like categories that can have parent categories, or employees who have managers.

## 2) Real name
**Self-referential relation** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/15-self-relations.ts`

```ts
// Chapter 15 — self relation.
// Category.parentId points back to Category.id (adjacency list).
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const created = await prisma.category.create({
  data: {
    id: 'cat_ch15_gaming',
    tenantId: 'ten_acme',
    parentId: 'cat_acme_laptops',
    name: 'Gaming Laptops',
    slug: 'gaming-laptops',
  },
  select: { id: true, name: true, parent: { select: { name: true, slug: true } } },
});
console.log('created child:', created);

const tree = await prisma.category.findMany({
  where: { tenantId: 'ten_acme', parentId: null },
  select: {
    name: true,
    children: { select: { name: true, children: { select: { name: true } } } },
  },
});
console.dir(tree, { depth: 5 });

await prisma.category.delete({ where: { id: 'cat_ch15_gaming' } });
await prisma.$disconnect();
```

## 4) The SQL behind it (real `prisma:query` output)
Creates child category, reads tree with nested children, deletes it.

## 5) What I should see
`Gaming Laptops` has parent `Laptops`. Tree query shows nested structure.

## 6) When to use it / when NOT to
**Use when:** Modeling hierarchies like categories, comments threads, org charts.  
**Don't use when:** Deep hierarchies need recursive queries — Prisma doesn't do recursive CTEs automatically; use raw SQL or a closure table for deep trees.

## 7) Common mistakes
- Forgetting to make `parentId` nullable (root nodes have no parent).
- Not using named relations if you have multiple self-relations on the same model.
- Circular references causing issues.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Create a deeper tree. Try to delete a parent with children and see referential action behavior.  
**Reset:** Category deleted at end.

## 9) Next
[16. Referential actions](./16-referential-actions.md)
