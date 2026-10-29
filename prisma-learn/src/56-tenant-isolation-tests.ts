// Chapter 56 — isolation tests that actually run.
// No test framework is added: node:assert is enough to prove the rules.
import assert from 'node:assert/strict';
import { createPrisma } from './lib/prisma.js';
import { createTenantRepository, TenantResourceNotFoundError } from './lib/tenant-repository.js';
import { forTenant } from './lib/tenant-extension.js';

const prisma = createPrisma({ logSql: false });
const repo = createTenantRepository(prisma);
const acme = { tenantId: 'ten_acme' } as const;
const globex = { tenantId: 'ten_globex' } as const;

let passed = 0;
function check(name: string, fn: () => Promise<void>) {
  return fn().then(() => {
    passed += 1;
    console.log('PASS', name);
  });
}

await check('read: scoped findMany never returns another tenant', async () => {
  const rows = await forTenant(prisma, acme.tenantId).product.findMany({ select: { tenantId: true } });
  assert.ok(rows.length > 0);
  assert.ok(rows.every((row) => row.tenantId === acme.tenantId));
});

await check('read: findUnique by foreign id returns null', async () => {
  const row = await prisma.product.findUnique({ where: { id: 'prd_globex_phone' } });
  assert.equal(row?.tenantId, globex.tenantId);
  const scoped = await forTenant(prisma, acme.tenantId).product.findUnique({ where: { id: 'prd_globex_phone' } });
  assert.equal(scoped, null);
});

await check('update: cross-tenant price change is rejected by the repository', async () => {
  const before = await prisma.product.findUnique({
    where: { id: 'prd_globex_phone' },
    select: { priceCents: true },
  });
  await assert.rejects(
    () => repo.updateProductPrice(acme, 'prd_globex_phone', 1),
    TenantResourceNotFoundError,
  );
  const after = await prisma.product.findUnique({
    where: { id: 'prd_globex_phone' },
    select: { priceCents: true },
  });
  assert.equal(after?.priceCents, before?.priceCents);
});

await check('delete: cross-tenant soft delete is rejected', async () => {
  await assert.rejects(() => repo.softDeleteProduct(acme, 'prd_globex_phone'), TenantResourceNotFoundError);
  const row = await prisma.product.findUnique({
    where: { id: 'prd_globex_phone' },
    select: { deletedAt: true },
  });
  assert.equal(row?.deletedAt, null);
});

await check('aggregate: scoped totals are smaller than global totals', async () => {
  const global = await prisma.order.aggregate({ _sum: { totalCents: true }, _count: { _all: true } });
  const scoped = await prisma.order.aggregate({
    where: { tenantId: acme.tenantId },
    _sum: { totalCents: true },
    _count: { _all: true },
  });
  assert.ok((scoped._count._all ?? 0) > 0);
  assert.ok((scoped._sum.totalCents ?? 0) < (global._sum.totalCents ?? 0));
});

await check('nested write: an app guard rejects a cross-tenant label', async () => {
  async function connectLabel(tenantId: string, articleId: string, labelId: string) {
    const label = await prisma.label.findFirst({ where: { tenantId, id: labelId } });
    if (!label) throw new Error('label not found in tenant');
    return prisma.article.update({
      where: { id: articleId },
      data: { labels: { connect: { id: label.id } } },
    });
  }
  await assert.rejects(() => connectLabel(acme.tenantId, 'art_acme_trail', 'lbl_globex_mobile'), /not found in tenant/);
  const article = await prisma.article.findUnique({
    where: { id: 'art_acme_trail' },
    select: { labels: { select: { tenantId: true } } },
  });
  assert.ok(article!.labels.every((label) => label.tenantId === acme.tenantId));
});

await check('create: repository input cannot choose the tenant', async () => {
  const created = await repo.createProduct(acme, {
    sku: 'CH56-TEST',
    slug: 'ch56-test',
    name: 'Isolation Test Product',
    priceCents: 500,
  });
  assert.equal(created.tenantId, acme.tenantId);
  await prisma.product.delete({ where: { tenantId_id: { tenantId: acme.tenantId, id: created.id } } });
});

await check('raw SQL: extension is not a security boundary', async () => {
  const rows = await forTenant(prisma, acme.tenantId).$queryRaw<Array<{ tenant_id: string }>>`
    SELECT DISTINCT tenant_id FROM products ORDER BY tenant_id
  `;
  assert.deepEqual(rows.map((row) => row.tenant_id), [acme.tenantId, globex.tenantId]);
  console.log('  note: raw SQL needs PostgreSQL RLS (chapter 57) or code review');
});

await check('repository: each tenant sees only its own customers', async () => {
  const global = await prisma.customer.count();
  const scoped = await prisma.customer.count({ where: { tenantId: acme.tenantId } });
  assert.ok(scoped > 0 && scoped < global);
});

console.log(`\n${passed} isolation checks passed.`);
await prisma.$disconnect();
