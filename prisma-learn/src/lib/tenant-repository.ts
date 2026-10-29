// Tenant-scoped repository used in chapters 53 and 56.
// Every public method requires a TenantContext and injects tenantId into the query.
// Input types deliberately do not contain tenantId: callers cannot choose a tenant.
import type { PrismaClient } from '../generated/prisma/client.js';

export type TenantContext = { tenantId: string };

export class TenantResourceNotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found in this tenant`);
    this.name = 'TenantResourceNotFoundError';
  }
}

export function createTenantRepository(prisma: PrismaClient) {
  return {
    async listProducts(ctx: TenantContext, options: { search?: string; take?: number } = {}) {
      const { tenantId } = ctx;
      return prisma.product.findMany({
        where: {
          tenantId,
          deletedAt: null,
          ...(options.search ? { name: { contains: options.search, mode: 'insensitive' as const } } : {}),
        },
        orderBy: { name: 'asc' },
        take: options.take ?? 20,
        select: { id: true, name: true, slug: true, priceCents: true, stock: true },
      });
    },

    async getProduct(ctx: TenantContext, productId: string) {
      const { tenantId } = ctx;
      const product = await prisma.product.findFirst({
        where: { tenantId, id: productId, deletedAt: null },
        select: { id: true, name: true, slug: true, priceCents: true, stock: true },
      });
      if (!product) throw new TenantResourceNotFoundError('product');
      return product;
    },

    async createProduct(
      ctx: TenantContext,
      input: { sku: string; slug: string; name: string; priceCents: number; stock?: number },
    ) {
      const { tenantId } = ctx;
      return prisma.product.create({
        data: { ...input, tenantId },
        select: { id: true, tenantId: true, name: true, priceCents: true },
      });
    },

    async updateProductPrice(ctx: TenantContext, productId: string, priceCents: number) {
      const { tenantId } = ctx;
      if (!Number.isInteger(priceCents) || priceCents < 0) throw new Error('invalid price');
      const result = await prisma.product.updateMany({
        where: { tenantId, id: productId, deletedAt: null },
        data: { priceCents },
      });
      if (result.count === 0) throw new TenantResourceNotFoundError('product');
      return this.getProduct(ctx, productId);
    },

    async softDeleteProduct(ctx: TenantContext, productId: string) {
      const { tenantId } = ctx;
      const result = await prisma.product.updateMany({
        where: { tenantId, id: productId, deletedAt: null },
        data: { deletedAt: new Date(), active: false },
      });
      if (result.count === 0) throw new TenantResourceNotFoundError('product');
      return { deleted: true as const };
    },

    async listOrders(ctx: TenantContext, customerId?: string) {
      const { tenantId } = ctx;
      return prisma.order.findMany({
        where: { tenantId, ...(customerId ? { customerId } : {}) },
        orderBy: { placedAt: 'desc' },
        select: { id: true, number: true, status: true, totalCents: true, customerId: true },
      });
    },

    async revenueByCustomer(ctx: TenantContext) {
      const { tenantId } = ctx;
      return prisma.order.groupBy({
        by: ['customerId'],
        where: { tenantId, status: { in: ['PAID', 'FULFILLED'] } },
        _sum: { totalCents: true },
        _count: { _all: true },
        orderBy: { _sum: { totalCents: 'desc' } },
      });
    },
  };
}

export type TenantRepository = ReturnType<typeof createTenantRepository>;
