// Chapter 62 — deterministic seeding and testing against real PostgreSQL.
// The seed is idempotent; tests use the real constraints, not mocks.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createPrisma } from './lib/prisma.js';
import type { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma({ logSql: false });

async function snapshot() {
  const [tenants, customers, products, orders, users, tags] = await Promise.all([
    prisma.tenant.count(),
    prisma.customer.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.tag.count(),
  ]);
  return { tenants, customers, products, orders, users, tags };
}

const before = await snapshot();
console.log('before re-seed:', before);

for (let run = 1; run <= 2; run += 1) {
  const output = execFileSync('npx', ['tsx', 'prisma/seed.ts'], { encoding: 'utf8' });
  console.log(`seed run ${run}:`, output.trim().split('\n').at(-1));
}

const after = await snapshot();
console.log('after re-seed: ', after);
assert.deepEqual(after, before);
console.log('PASS seed is idempotent (same counts after two runs)');

// Deterministic IDs make assertions readable.
const alice = await prisma.customer.findUnique({
  where: { tenantId_email: { tenantId: 'ten_acme', email: 'alice@acme.test' } },
  select: { id: true, tenantId: true },
});
assert.equal(alice?.id, 'cus_acme_alice');
console.log('PASS deterministic fixture id:', alice);

// Real constraints: a cross-tenant order must fail, and nothing is written.
const ordersBefore = await prisma.order.count();
await assert.rejects(
  () =>
    prisma.$executeRaw`
      INSERT INTO orders (id, tenant_id, customer_id, number, status, subtotal_cents,
                          discount_cents, total_cents, currency, placed_at, created_at, updated_at)
      VALUES (${'ord_ch62_cross'}, ${'ten_acme'}, ${'cus_globex_carol'}, ${'CH62-X'},
              CAST(${'PENDING'} AS "OrderStatus"), 100, 0, 100, 'USD', now(), now(), now())
    `,
);
assert.equal(await prisma.order.count(), ordersBefore);
console.log('PASS cross-tenant insert rejected and rolled back by PostgreSQL');

// Test fixture pattern: one transaction per test, always roll back.
const ROLLBACK = Symbol('rollback');
async function inTestTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
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

const created = await inTestTransaction(async (tx) => {
  const product = await tx.product.create({
    data: {
      tenantId: 'ten_acme',
      sku: 'CH62-TEST',
      slug: 'ch62-test',
      name: 'Rolled Back Product',
      priceCents: 100,
    },
    select: { id: true },
  });
  return product;
});
const stillThere = await prisma.product.count({ where: { tenantId: 'ten_acme', id: created.id } });
console.log('test row after rollback:', stillThere);
assert.equal(stillThere, 0);
console.log('PASS per-test transaction leaves no residue');

console.log('\nTest database strategy:');
console.log('- use a separate database (prisma_learn_test), same migrations via migrate deploy');
console.log('- seed with the same two-tenant fixture before the suite');
console.log('- never mock Prisma constraints; they are the behaviour under test');
console.log('- run tests serially or give each worker its own database/schema');

await prisma.$disconnect();
