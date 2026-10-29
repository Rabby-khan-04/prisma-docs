// Chapter 66 — Prisma in route handlers and server actions.
// The functions below are plain Request/Response code; the same shape works in
// Next.js `app/api/.../route.ts` and `'use server'` actions.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

type Session = { tenantId: string; userId: string };

// In a real app this comes from verified auth, never from a client header.
async function getSession(request: Request): Promise<Session | null> {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');
  if (!tenantId || !userId) return null;
  const user = await prisma.user.findFirst({
    where: { tenantId, id: userId },
    select: { tenantId: true, id: true },
  });
  return user ? { tenantId: user.tenantId, userId: user.id } : null;
}

type ProductDto = { id: string; name: string; priceCents: number; stock: number };

// GET /api/products?q=trail&take=5
export async function GET(request: Request): Promise<Response> {
  const session = await getSession(request);
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const take = Math.min(Number(url.searchParams.get('take') ?? 20), 50);
  if (!Number.isInteger(take) || take < 1) return Response.json({ error: 'invalid take' }, { status: 400 });

  const rows = await prisma.product.findMany({
    where: {
      tenantId: session.tenantId,
      deletedAt: null,
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    select: { id: true, name: true, priceCents: true, stock: true },
    orderBy: { name: 'asc' },
    take,
  });
  const body: ProductDto[] = rows;
  return Response.json({ data: body });
}

// Server action: update a price inside the caller's tenant.
export async function updatePriceAction(formData: FormData, session: Session): Promise<Response> {
  const productId = String(formData.get('productId') ?? '');
  const priceCents = Number(formData.get('priceCents'));
  if (!productId || !Number.isInteger(priceCents) || priceCents < 0) {
    return Response.json({ error: 'invalid input' }, { status: 400 });
  }

  // updateMany keeps tenantId in the WHERE clause; count 0 means 404, not "updated".
  const result = await prisma.product.updateMany({
    where: { tenantId: session.tenantId, id: productId, deletedAt: null },
    data: { priceCents },
  });
  if (result.count === 0) return Response.json({ error: 'not found' }, { status: 404 });

  // Next.js equivalent: revalidatePath('/products');
  return Response.json({ ok: true, productId, priceCents });
}

const acmeSession = { tenantId: 'ten_acme', userId: 'usr_acme_owner' };

const ok = await GET(
  new Request('http://localhost/api/products?q=trail&take=2', {
    headers: { 'x-tenant-id': acmeSession.tenantId, 'x-user-id': acmeSession.userId },
  }),
);
console.log('GET 200:', ok.status, await ok.json());

const unauthorized = await GET(new Request('http://localhost/api/products'));
console.log('GET without session:', unauthorized.status, await unauthorized.json());

const crossTenant = await updatePriceAction(
  formData({ productId: 'prd_globex_phone', priceCents: 100 }),
  acmeSession,
);
console.log('action on another tenant:', crossTenant.status, await crossTenant.json());

const empty = await updatePriceAction(formData({ productId: '', priceCents: -1 }), acmeSession);
console.log('action with invalid input:', empty.status, await empty.json());

// Keep Prisma server-only: never import this module into a Client Component.
console.log('Prisma stays on the server; only DTOs cross the boundary');

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

await prisma.$disconnect();
