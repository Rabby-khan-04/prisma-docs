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
