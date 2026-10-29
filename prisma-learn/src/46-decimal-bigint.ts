// Chapter 46 — Decimal and BigInt.
// Decimal keeps exact fractional values; BigInt keeps integers beyond 2^53.
import { createPrisma } from './lib/prisma.js';
import { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma({ logSql: false });

const product = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_laptop' } },
  select: { name: true, rating: true, viewCount: true, priceCents: true },
});
console.log('rating type:', product!.rating?.constructor.name, 'value:', product!.rating?.toString());
console.log('viewCount typeof:', typeof product!.viewCount, 'value:', product!.viewCount.toString());

console.log('--- JSON serialization problems ---');
try {
  JSON.stringify(product);
} catch (error) {
  console.log('JSON.stringify BigInt throws:', (error as Error).message);
}
console.log('with replacer:', JSON.stringify(product, (_key, value) =>
  typeof value === 'bigint' ? value.toString() : value,
));

console.log('--- exact decimal arithmetic ---');
const rating = product!.rating ?? new Prisma.Decimal(0);
console.log('toFixed(2):', rating.toFixed(2));
console.log('times 2:', rating.times(2).toString());
console.log('plus 0.05:', rating.plus('0.05').toString());
console.log('greater than 4.5:', rating.gt('4.5'));

// Cents -> exact decimal amount (for display only; storage stays in cents).
const price = new Prisma.Decimal(product!.priceCents).div(100);
console.log('price as decimal:', price.toFixed(2));

console.log('--- BigInt beyond Number.MAX_SAFE_INTEGER ---');
const big = 9_007_199_254_740_993n;
console.log('bigint:', big.toString());
console.log('as Number loses precision:', Number(big));
console.log('MAX_SAFE_INTEGER:', BigInt(Number.MAX_SAFE_INTEGER).toString());

// Atomic increment happens in SQL, not in JavaScript.
await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_laptop' } },
  data: { viewCount: { increment: 1 } },
});
const after = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_laptop' } },
  select: { viewCount: true },
});
console.log('viewCount after atomic increment:', after!.viewCount.toString());

// Restore the fixture value.
await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_laptop' } },
  data: { viewCount: 152n },
});

// Numeric aggregates come back as Decimal too.
const [sum] = await prisma.$queryRaw<Array<{ total: Prisma.Decimal | null }>>`
  SELECT SUM(amount_cents)::numeric AS total FROM payments WHERE tenant_id = ${'ten_acme'}
`;
console.log('raw SUM(payments.amount_cents) type:', sum.total?.constructor.name, 'value:', sum.total?.toString());

await prisma.$disconnect();
