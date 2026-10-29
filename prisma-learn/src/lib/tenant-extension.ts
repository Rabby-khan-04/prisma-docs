// Tenant-injecting Prisma Client extension (chapter 54).
//
// What it does:
//   - adds tenantId to every `where` for reads/writes that accept one
//   - adds tenantId to `data` for create/createMany/upsert.create
//
// What it does NOT do:
//   - protect nested writes (connect/create inside a relation)
//   - protect $queryRaw / $executeRaw / $queryRawUnsafe
//   - protect models that have no tenantId column
//   - replace authorisation: a caller can still choose any tenantId string
import type { PrismaClient } from '../generated/prisma/client.js';

type AnyArgs = Record<string, unknown> & {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Array<Record<string, unknown>>;
  create?: Record<string, unknown>;
};

const WHERE_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
  'groupBy',
]);

const CREATE_OPERATIONS = new Set(['create', 'createMany', 'createManyAndReturn']);

export function forTenant(prisma: PrismaClient, tenantId: string) {
  if (!tenantId) throw new Error('tenantId is required');

  return prisma.$extends({
    name: `tenant:${tenantId}`,
    query: {
      $allModels: {
        async $allOperations({ args, query, operation }) {
          const a = args as AnyArgs;

          if (WHERE_OPERATIONS.has(operation)) {
            a.where = { ...(a.where ?? {}), tenantId };
          }

          if (CREATE_OPERATIONS.has(operation) && a.data) {
            a.data = Array.isArray(a.data)
              ? a.data.map((row) => ({ ...row, tenantId }))
              : { ...a.data, tenantId };
          }

          if (operation === 'upsert') {
            if (a.where) a.where = { ...a.where, tenantId };
            if (a.create) a.create = { ...a.create, tenantId };
          }

          return query(args);
        },
      },
    },
  });
}

// Explicit escape hatch for admin jobs. Name it so code review can find it.
export function withoutTenantScope(prisma: PrismaClient): PrismaClient {
  return prisma;
}
