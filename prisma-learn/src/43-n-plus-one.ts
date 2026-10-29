// Chapter 43 — N+1 detection and fix.
// The client is created with `silent: true`, so query events are emitted but
// not printed. We count SELECT statements ourselves.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ silent: true });

let selects = 0;
prisma.$on('query', (event) => {
  if (event.query.trim().toUpperCase().startsWith('SELECT')) selects += 1;
});

// ❌ N+1: 1 query for the list + 1 query per row.
selects = 0;
const customers = await prisma.customer.findMany({
  where: { tenantId: 'ten_acme' },
  select: { id: true, name: true },
});
const nPlusOne = [];
for (const customer of customers) {
  const orders = await prisma.order.findMany({
    where: { tenantId: 'ten_acme', customerId: customer.id },
    select: { number: true, totalCents: true },
  });
  nPlusOne.push({ customer: customer.name, orders });
}
console.log('N+1: rows =', customers.length, ', SELECT queries =', selects);
console.dir(nPlusOne, { depth: 5 });

// ✅ One nested read: Prisma issues 2 queries total (customers + orders IN (...)),
// no matter how many customers there are.
selects = 0;
const fixed = await prisma.customer.findMany({
  where: { tenantId: 'ten_acme' },
  select: {
    name: true,
    orders: { select: { number: true, totalCents: true } },
  },
});
console.log('nested select: rows =', fixed.length, ', SELECT queries =', selects);
console.dir(fixed, { depth: 5 });

await prisma.$disconnect();
