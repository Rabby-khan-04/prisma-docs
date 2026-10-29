// Chapter 58 — safe API responses.
// A database row is not an API response. Whitelist every field you return.
import { createPrisma } from './lib/prisma.js';
import { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma({ logSql: false });

const user = await prisma.user.findFirst({
  where: { tenantId: 'ten_acme', email: 'owner@acme.test' },
});
console.log('⚠️ full user row:', user);
console.log('⚠️ JSON sent by accident:', JSON.stringify(user));

function toPublicUser(row: { id: string; email: string; role: string; createdAt: Date }) {
  return { id: row.id, email: row.email, role: row.role, createdAt: row.createdAt.toISOString() };
}
console.log('✅ public user:', toPublicUser(user!));

const customer = await prisma.customer.findFirst({
  where: { tenantId: 'ten_acme', email: 'bob@acme.test' },
});
console.log('⚠️ full customer row has notes/banReason:', {
  notes: customer!.notes,
  banReason: customer!.banReason,
  bannedAt: customer!.bannedAt,
});

function toCustomerSummary(row: {
  id: string;
  name: string;
  email: string;
  tier: string;
  loyaltyPoints: number;
}) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    tier: row.tier,
    loyaltyPoints: row.loyaltyPoints,
  };
}
console.log('✅ customer summary:', toCustomerSummary(customer!));

const product = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_laptop' } },
  select: { id: true, name: true, priceCents: true, rating: true, viewCount: true, createdAt: true },
});

function toProductDto(row: {
  id: string;
  name: string;
  priceCents: number;
  rating: Prisma.Decimal | null;
  viewCount: bigint;
  createdAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    price: { cents: row.priceCents, currency: 'USD', formatted: `$${(row.priceCents / 100).toFixed(2)}` },
    rating: row.rating ? row.rating.toFixed(2) : null,
    viewCount: row.viewCount.toString(),
    createdAt: row.createdAt.toISOString(),
  };
}
console.log('✅ product DTO:', toProductDto(product!));
console.log('✅ DTO JSON:', JSON.stringify(toProductDto(product!)));

try {
  JSON.stringify(product);
} catch (error) {
  console.log('raw row cannot be JSON-serialized:', (error as Error).message);
}

await prisma.$disconnect();
