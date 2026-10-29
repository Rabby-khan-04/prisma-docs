// Chapter 61 — logging and error-code handling.
// Map database errors to HTTP responses without leaking internals.
import { createPrisma } from './lib/prisma.js';
import { Prisma } from './generated/prisma/client.js';

const prisma = createPrisma({ logSql: false });

type HttpError = { status: number; body: { error: string; code?: string } };

function toHttpError(error: unknown): HttpError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return { status: 409, body: { error: 'A record with this value already exists', code: error.code } };
      case 'P2025':
        return { status: 404, body: { error: 'Record not found', code: error.code } };
      case 'P2003':
        return { status: 400, body: { error: 'Related record does not exist', code: error.code } };
      case 'P2034':
        return { status: 409, body: { error: 'Transaction conflict, please retry', code: error.code } };
      default:
        return { status: 400, body: { error: 'Database request rejected', code: error.code } };
    }
  }
  return { status: 500, body: { error: 'Internal server error' } };
}

// P2002: duplicate email inside one tenant.
try {
  await prisma.user.create({
    data: {
      tenantId: 'ten_acme',
      email: 'owner@acme.test',
      passwordHash: 'fake',
    },
  });
} catch (error) {
  console.log('P2002 ->', toHttpError(error));
}

// P2025: update a coupon that does not exist.
try {
  await prisma.coupon.update({
    where: { tenantId_code: { tenantId: 'ten_acme', code: 'DOES-NOT-EXIST' } },
    data: { active: false },
  });
} catch (error) {
  console.log('P2025 ->', toHttpError(error));
}

// P2003: product points at a category that does not exist.
try {
  await prisma.product.create({
    data: {
      tenantId: 'ten_acme',
      categoryId: 'cat_does_not_exist',
      sku: 'CH61-FK',
      slug: 'ch61-fk',
      name: 'Broken FK Product',
      priceCents: 100,
    },
  });
} catch (error) {
  console.log('P2003 ->', toHttpError(error));
}

// P2034: serializable transactions conflict; retry the whole transaction.
const productId = 'prd_acme_mouse';
const original = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: productId } },
  select: { priceCents: true },
});

async function bumpPrice() {
  return prisma.$transaction(
    async (tx) => {
      const row = await tx.product.findUnique({
        where: { tenantId_id: { tenantId: 'ten_acme', id: productId } },
        select: { priceCents: true },
      });
      await new Promise((resolve) => setTimeout(resolve, 80));
      return tx.product.update({
        where: { tenantId_id: { tenantId: 'ten_acme', id: productId } },
        data: { priceCents: row!.priceCents + 1 },
        select: { priceCents: true },
      });
    },
    { isolationLevel: 'Serializable' },
  );
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== 'P2034' || attempt === attempts) throw error;
      console.log(`P2034 on attempt ${attempt}, retrying`);
    }
  }
  throw new Error('unreachable');
}

const settled = await Promise.allSettled([withRetry(bumpPrice), withRetry(bumpPrice)]);
console.log('serializable results:', settled.map((result) => result.status));
for (const result of settled) {
  if (result.status === 'rejected') console.log('final error ->', toHttpError(result.reason));
}

// Restore the fixture price.
await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: productId } },
  data: { priceCents: original!.priceCents },
});

// Query logging: Prisma 7 emits structured events.
const logging = createPrisma({ silent: true });
logging.$on('query', (event) => {
  if (event.duration > 50) console.log('slow query', event.duration, 'ms', event.query.slice(0, 80));
});
await logging.$queryRaw`SELECT count(*)::int AS ok FROM (SELECT pg_sleep(0.08)) AS sleep`;
await logging.$disconnect();

await prisma.$disconnect();
