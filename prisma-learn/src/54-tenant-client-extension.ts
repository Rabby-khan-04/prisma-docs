// Chapter 54 — tenant-injecting Client Extension.
// The extension removes the need to repeat tenantId in every call... for the
// operations it covers. The limits are demonstrated, not hidden.
import { createPrisma } from './lib/prisma.js';
import { forTenant, withoutTenantScope } from './lib/tenant-extension.js';

const prisma = createPrisma({ logSql: false });
const acme = forTenant(prisma, 'ten_acme');
const globex = forTenant(prisma, 'ten_globex');

console.log('acme product count:', await acme.product.count());
console.log('globex product count:', await globex.product.count());
console.log('acme products:', await acme.product.findMany({ select: { name: true, tenantId: true } }));

// Reads are scoped even when the caller asks by id only.
console.log('acme findUnique globex id:', await acme.product.findUnique({ where: { id: 'prd_globex_phone' } }));
console.log('globex findUnique same id:', await globex.product.findUnique({ where: { id: 'prd_globex_phone' }, select: { name: true, tenantId: true } }));

// Aggregates are scoped too.
const acmeRevenue = await acme.order.aggregate({ _sum: { totalCents: true }, _count: { _all: true } });
console.log('acme aggregate:', acmeRevenue);

// Writes are scoped: an update by foreign id matches nothing.
const crossUpdate = await acme.product.updateMany({
  where: { id: 'prd_globex_phone' },
  data: { priceCents: 1 },
});
console.log('acme updateMany globex id count:', crossUpdate.count);

// Creates get tenantId injected, and a caller-supplied tenantId is overridden.
const created = await acme.product.create({
  data: {
    tenantId: 'ten_globex', // ignored; the extension overwrites it
    sku: 'CH54-EXT',
    slug: 'ch54-ext',
    name: 'Extension Product',
    priceCents: 777,
  },
  select: { id: true, tenantId: true, name: true },
});
console.log('created through acme extension:', created);

// ⚠️ Raw SQL bypasses the extension completely.
const rawRows = await acme.$queryRaw<Array<{ tenant_id: string }>>`
  SELECT tenant_id FROM products ORDER BY tenant_id
`;
console.log('⚠️ raw SQL through the acme extension sees:', [...new Set(rawRows.map((row) => row.tenant_id))]);

// ⚠️ Nested writes bypass the extension: connect is not rewritten.
// (Shown in chapter 55b; the extension only touches the top-level data object.)

// The escape hatch is explicit and visible in code review.
const admin = withoutTenantScope(prisma);
console.log('admin sees all products:', await admin.product.count());

await prisma.product.delete({ where: { tenantId_id: { tenantId: 'ten_acme', id: created.id } } });
await prisma.$disconnect();
