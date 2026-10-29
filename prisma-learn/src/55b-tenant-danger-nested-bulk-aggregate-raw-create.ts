// Chapter 55b — ⚠️ DANGER DEMOS: nested relations, aggregates, raw SQL,
// and a create that trusts a tenantId from the request body.
// All mutations are rolled back.
import { createPrisma } from './lib/prisma.js';
import { forTenant } from './lib/tenant-extension.js';
import type { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma({ logSql: false });
const ROLLBACK = Symbol('rollback');

async function rolledBack<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      const value = await fn(tx);
      throw { [ROLLBACK]: true, value };
    });
  } catch (error) {
    if (error && typeof error === 'object' && ROLLBACK in error) return (error as { value: T }).value;
    throw error;
  }
}

console.log('--- ⚠️ nested relation write: implicit M2M crosses tenants ---');
const crossed = await rolledBack(async (tx) => {
  await tx.article.update({
    where: { id: 'art_acme_trail' },
    data: { labels: { connect: { id: 'lbl_globex_mobile' } } },
  });
  return tx.article.findUnique({
    where: { id: 'art_acme_trail' },
    select: { tenantId: true, title: true, labels: { select: { tenantId: true, name: true } } },
  });
});
console.log('Acme article now has a Globex label:', crossed);

console.log('--- ⚠️ groupBy without tenantId ---');
const globalGroups = await prisma.order.groupBy({
  by: ['tenantId', 'status'],
  _count: { _all: true },
  _sum: { totalCents: true },
  orderBy: [{ tenantId: 'asc' }, { status: 'asc' }],
});
console.log('global grouping:', globalGroups);

console.log('--- ⚠️ aggregate without tenantId ---');
const globalTotal = await prisma.order.aggregate({ _sum: { totalCents: true }, _count: { _all: true } });
console.log('global order totals (both tenants):', globalTotal);

console.log('--- ⚠️ raw SQL bypasses the tenant extension ---');
const acme = forTenant(prisma, 'ten_acme');
const raw = await acme.$queryRaw<Array<{ tenant_id: string; total: bigint }>>`
  SELECT tenant_id, count(*)::bigint AS total FROM customers GROUP BY tenant_id ORDER BY tenant_id
`;
console.log('raw rows through acme extension:', raw);

console.log('--- ⚠️ create trusts tenantId from the request body ---');
const bodyFromRequest = {
  tenantId: 'ten_globex', // attacker-controlled
  sku: 'CH55B-SPOOF',
  slug: 'ch55b-spoof',
  name: 'Spoofed Tenant Product',
  priceCents: 100,
};
const spoofed = await rolledBack(async (tx) => {
  const before = await tx.product.count({ where: { tenantId: 'ten_globex' } });
  const product = await tx.product.create({ data: bodyFromRequest, select: { id: true, tenantId: true, name: true } });
  const after = await tx.product.count({ where: { tenantId: 'ten_globex' } });
  return { before, after, product };
});
console.log('Acme session created a row in Globex:', spoofed);

console.log('--- after rollback: no cross-tenant write survived ---');
console.log('acme article labels:', await prisma.article.findUnique({
  where: { id: 'art_acme_trail' },
  select: { labels: { select: { tenantId: true, name: true } } },
}));
console.log('globex product count:', await prisma.product.count({ where: { tenantId: 'ten_globex' } }));

await prisma.$disconnect();
