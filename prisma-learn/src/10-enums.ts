// Chapter 10 — enums.
// Prisma enums become PostgreSQL enum types; invalid values are rejected by the DB.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma();

const enumValues = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
  SELECT e.enumlabel
  FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
  WHERE t.typname = 'OrderStatus'
  ORDER BY e.enumsortorder
`;
console.log('OrderStatus values:', enumValues.map((v) => v.enumlabel).join(', '));

const order = await prisma.order.create({
  data: {
    id: 'ord_ch10_enum',
    tenantId: 'ten_acme',
    customerId: 'cus_acme_alice',
    number: 'CH10-0001',
    status: 'PAID',
    subtotalCents: 1000,
    totalCents: 1000,
  },
  select: { id: true, status: true },
});
console.log('created order:', order);

try {
  await prisma.$executeRawUnsafe(`UPDATE orders SET status = 'NOT_A_STATUS' WHERE id = 'ord_ch10_enum'`);
} catch (error) {
  console.log('database rejects unknown enum:', (error as { code?: string }).code);
}

await prisma.order.delete({ where: { id: 'ord_ch10_enum' } });
await prisma.$disconnect();
