// Chapter 65 — generated TypeScript types.
// Types come from the schema. Derive DTOs from the query, not from memory.
import { createPrisma } from './lib/prisma.js';
import { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma({ logSql: false });

// 1. A reusable select with `satisfies` (Prisma 7.10.1's generated client
// does not expose the older Prisma.validator helper).
const productCardSelect = {
  id: true,
  name: true,
  priceCents: true,
  rating: true,
} satisfies Prisma.ProductSelect;
type ProductCard = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

const card: ProductCard = await prisma.product.findFirstOrThrow({
  where: { tenantId: 'ten_acme', slug: 'trail-laptop' },
  select: productCardSelect,
});
console.log('ProductCard:', card);

// 2. Include payload type.
type CustomerWithOrders = Prisma.CustomerGetPayload<{
  include: { orders: { select: { number: true; totalCents: true } } };
}>;
const customer: CustomerWithOrders = await prisma.customer.findFirstOrThrow({
  where: { tenantId: 'ten_acme', email: 'alice@acme.test' },
  include: { orders: { select: { number: true, totalCents: true } } },
});
console.log('CustomerWithOrders:', customer.name, customer.orders);

// 3. Derive a public DTO from the payload and map explicitly.
type PublicProduct = Pick<ProductCard, 'id' | 'name'> & { price: string };
function toPublicProduct(row: ProductCard): PublicProduct {
  return { id: row.id, name: row.name, price: (row.priceCents / 100).toFixed(2) };
}
const dto = toPublicProduct(card) satisfies PublicProduct;
console.log('PublicProduct:', dto);

// 4. Compile-time assertion helper: no runtime cost.
function expectType<T>(_value: T): void {}
expectType<string>(dto.price);
expectType<number>(card.priceCents);

// 5. Input types for functions that accept filters.
type ProductFilter = Prisma.ProductWhereInput;
const filter: ProductFilter = { tenantId: 'ten_acme', priceCents: { gte: 1000 } };
console.log('filter type works:', await prisma.product.count({ where: filter }));

// 6. A typed helper that returns a narrow payload.
async function listCards(tenantId: string, take: number): Promise<ProductCard[]> {
  return prisma.product.findMany({
    where: { tenantId, deletedAt: null },
    select: productCardSelect,
    orderBy: { name: 'asc' },
    take,
  });
}
console.log('listCards:', await listCards('ten_globex', 2));

// Keep types in sync: after a migration, run `npm run db:generate`.
console.log('generated client version: 7.10.1');

await prisma.$disconnect();
