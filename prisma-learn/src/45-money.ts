// Chapter 45 — money as integer cents.
// Never use Float for money. This file shows why, and the safe helpers.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

console.log('--- floating point is not money ---');
console.log('0.1 + 0.2 =', 0.1 + 0.2);
console.log('1.1 * 3 =', 1.1 * 3);
console.log('(0.1 + 0.2) === 0.3:', 0.1 + 0.2 === 0.3);
console.log('(1.1 * 3) === 3.3:', 1.1 * 3 === 3.3);

console.log('--- integer cents are exact ---');
const unitPriceCents = 1999;
const quantity = 3;
const subtotalCents = unitPriceCents * quantity;
console.log({ unitPriceCents, quantity, subtotalCents });

// Percent discount with one explicit rounding rule: round half up to the cent.
function percentOff(cents: number, percent: number): number {
  if (!Number.isInteger(cents)) throw new Error('cents must be an integer');
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new Error('percent must be an integer between 0 and 100');
  }
  return Math.round((cents * percent) / 100);
}

const discountCents = percentOff(subtotalCents, 15);
const totalCents = subtotalCents - discountCents;
console.log({ subtotalCents, discountCents, totalCents });

// Formatting happens at the edge, not in the database.
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
console.log('formatted:', usd.format(totalCents / 100));

// Input validation: reject fractional cents before they reach PostgreSQL.
const badInput = 19.995;
console.log('is 19.995 an integer number of cents?', Number.isInteger(badInput));
try {
  percentOff(badInput, 10);
} catch (error) {
  console.log('rejected:', (error as Error).message);
}

// The column really is an integer, not numeric/float.
const [column] = await prisma.$queryRaw<Array<{ data_type: string }>>`
  SELECT data_type FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_cents'
`;
console.log('orders.total_cents type:', column.data_type);

// A real order row: integer math, server-computed total.
const order = await prisma.order.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'ord_acme_1001' } },
  select: { subtotalCents: true, discountCents: true, totalCents: true },
});
console.log('stored order:', order, 'consistent:', order!.subtotalCents - order!.discountCents === order!.totalCents);

await prisma.$disconnect();
