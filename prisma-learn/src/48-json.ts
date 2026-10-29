// Chapter 48 — Json / JsonB.
// JSON is schemaless inside one column; the database will not validate its shape.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const [column] = await prisma.$queryRaw<Array<{ data_type: string }>>`
  SELECT data_type FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'metadata'
`;
console.log('products.metadata type:', column.data_type);

const laptop = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_laptop' } },
  select: { name: true, metadata: true },
});
console.log('laptop metadata:', laptop!.metadata);

// JSON path filter (Prisma translates this to ->> / #>> operators).
const green = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', metadata: { path: ['color'], equals: 'green' } },
  select: { name: true, metadata: true },
});
console.log('metadata.color = green:', green);

const warranty = await prisma.product.findMany({
  where: { tenantId: 'ten_acme', metadata: { path: ['warrantyMonths'], gte: 12 } },
  select: { name: true },
});
console.log('warrantyMonths >= 12:', warranty);

// JSON updates replace the whole document. There is no partial update here.
const mouse = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_mouse' } },
  select: { metadata: true },
});
const current = (mouse!.metadata ?? {}) as Record<string, unknown>;
await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_mouse' } },
  data: { metadata: { ...current, color: 'graphite', wireless: true } },
});
const updated = await prisma.product.findUnique({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_mouse' } },
  select: { metadata: true },
});
console.log('updated metadata:', updated!.metadata);

// Raw JSON operators for things the Prisma filter cannot express.
const raw = await prisma.$queryRaw<Array<{ name: string; color: string | null }>>`
  SELECT name, metadata->>'color' AS color
  FROM products
  WHERE tenant_id = ${'ten_acme'} AND metadata ? 'wireless'
  ORDER BY name
`;
console.log('raw JSON key existence:', raw);

// A tiny shape validator at the boundary. JSON columns do not do this for you.
type ProductMetadata = { color?: string; warrantyMonths?: number; wireless?: boolean };
function validateMetadata(input: unknown): ProductMetadata {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('metadata must be an object');
  }
  const value = input as Record<string, unknown>;
  if (value.color !== undefined && typeof value.color !== 'string') throw new Error('color must be a string');
  if (value.warrantyMonths !== undefined && !Number.isInteger(value.warrantyMonths)) {
    throw new Error('warrantyMonths must be an integer');
  }
  if (value.wireless !== undefined && typeof value.wireless !== 'boolean') {
    throw new Error('wireless must be a boolean');
  }
  return value as ProductMetadata;
}
console.log('valid metadata:', validateMetadata({ color: 'red', warrantyMonths: 12 }));
try {
  validateMetadata({ warrantyMonths: 'twelve' });
} catch (error) {
  console.log('invalid metadata rejected by app:', (error as Error).message);
}

// Restore the fixture.
await prisma.product.update({
  where: { tenantId_id: { tenantId: 'ten_acme', id: 'prd_acme_mouse' } },
  data: { metadata: { color: 'black' } },
});

await prisma.$disconnect();
