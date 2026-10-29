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
