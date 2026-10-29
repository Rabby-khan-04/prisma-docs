// Two-tenant fixture for every chapter. All data is fake.
// Run with: npm run db:seed
// Full reset of demo tables: SEED_RESET=1 npm run db:seed
import { createPrisma } from '../src/lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const tenants = [
  { id: 'ten_acme', slug: 'acme', name: 'Acme Outdoors', plan: 'PRO' as const },
  { id: 'ten_globex', slug: 'globex', name: 'Globex Electronics', plan: 'FREE' as const },
];

async function main() {
  if (process.env.SEED_RESET === '1') {
    // Only the local throwaway DB, and only tables this course owns.
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "coupon_redemptions", "loyalty_ledger", "fraud_events",
        "payments", "order_items", "orders",
        "product_tags", "tags",
        "_ArticleToLabel", "articles", "labels",
        "coupons", "products", "categories",
        "customer_profiles", "customers", "users", "tenants"
      RESTART IDENTITY CASCADE
    `);
    console.log('Seed reset: demo tables truncated.');
  }

  for (const tenant of tenants) {
    await prisma.tenant.upsert({
      where: { id: tenant.id },
      update: { name: tenant.name, plan: tenant.plan },
      create: tenant,
    });
  }

  // Users (password hashes are fake strings, never real credentials).
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: 'ten_acme', email: 'owner@acme.test' } },
    update: {},
    create: {
      id: 'usr_acme_owner',
      tenantId: 'ten_acme',
      email: 'owner@acme.test',
      passwordHash: 'fake-hash-not-a-real-password',
      role: 'OWNER',
    },
  });
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: 'ten_globex', email: 'admin@globex.test' } },
    update: {},
    create: {
      id: 'usr_globex_admin',
      tenantId: 'ten_globex',
      email: 'admin@globex.test',
      passwordHash: 'fake-hash-not-a-real-password',
      role: 'ADMIN',
    },
  });

  const customers = [
    { id: 'cus_acme_alice', tenantId: 'ten_acme', email: 'alice@acme.test', name: 'Alice Anderson', displayName: 'Alice', loyaltyPoints: 120, tier: 'SILVER' },
    { id: 'cus_acme_bob', tenantId: 'ten_acme', email: 'bob@acme.test', name: 'Bob Brown', displayName: 'Bob', loyaltyPoints: 10, tier: 'BRONZE' },
    { id: 'cus_globex_carol', tenantId: 'ten_globex', email: 'carol@globex.test', name: 'Carol Clark', displayName: 'Carol', loyaltyPoints: 300, tier: 'GOLD' },
    { id: 'cus_globex_dave', tenantId: 'ten_globex', email: 'dave@globex.test', name: 'Dave Davis', displayName: 'Dave', loyaltyPoints: 0, tier: 'BRONZE' },
  ];
  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { tenantId_email: { tenantId: customer.tenantId, email: customer.email } },
      update: { name: customer.name, loyaltyPoints: customer.loyaltyPoints, tier: customer.tier },
      create: customer,
    });
  }

  const profiles = [
    { id: 'prf_acme_alice', tenantId: 'ten_acme', customerId: 'cus_acme_alice', avatarUrl: 'https://example.test/alice.png', marketingOptIn: true },
    { id: 'prf_globex_carol', tenantId: 'ten_globex', customerId: 'cus_globex_carol', avatarUrl: null, marketingOptIn: false },
  ];
  for (const profile of profiles) {
    await prisma.customerProfile.upsert({
      where: { tenantId_customerId: { tenantId: profile.tenantId, customerId: profile.customerId } },
      update: { avatarUrl: profile.avatarUrl, marketingOptIn: profile.marketingOptIn },
      create: profile,
    });
  }

  const categories = [
    { id: 'cat_acme_electronics', tenantId: 'ten_acme', parentId: null, name: 'Electronics', slug: 'electronics' },
    { id: 'cat_acme_laptops', tenantId: 'ten_acme', parentId: 'cat_acme_electronics', name: 'Laptops', slug: 'laptops' },
    { id: 'cat_acme_accessories', tenantId: 'ten_acme', parentId: 'cat_acme_electronics', name: 'Accessories', slug: 'accessories' },
    { id: 'cat_globex_electronics', tenantId: 'ten_globex', parentId: null, name: 'Electronics', slug: 'electronics' },
    { id: 'cat_globex_phones', tenantId: 'ten_globex', parentId: 'cat_globex_electronics', name: 'Phones', slug: 'phones' },
  ];
  for (const category of categories) {
    await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: category.tenantId, slug: category.slug } },
      update: { name: category.name, parentId: category.parentId },
      create: category,
    });
  }

  const products = [
    { id: 'prd_acme_laptop', tenantId: 'ten_acme', categoryId: 'cat_acme_laptops', sku: 'ACME-LAP-01', slug: 'trail-laptop', name: 'Trail Laptop 14', description: 'Rugged 14-inch laptop.', priceCents: 129900, stock: 12, rating: '4.70', viewCount: 152n, metadata: { color: 'green', warrantyMonths: 24 } },
    { id: 'prd_acme_mouse', tenantId: 'ten_acme', categoryId: 'cat_acme_accessories', sku: 'ACME-MOU-01', slug: 'trail-mouse', name: 'Trail Mouse', description: null, priceCents: 4900, stock: 40, rating: '4.20', viewCount: 80n, metadata: { color: 'black' } },
    { id: 'prd_acme_chair', tenantId: 'ten_acme', categoryId: null, sku: 'ACME-CHA-01', slug: 'camp-chair', name: 'Camp Chair', description: 'Folding chair.', priceCents: 24900, stock: 5, rating: '3.90', viewCount: 12n, metadata: null },
    { id: 'prd_globex_laptop', tenantId: 'ten_globex', categoryId: 'cat_globex_electronics', sku: 'GLX-LAP-01', slug: 'trail-laptop', name: 'Globex Work Laptop', description: 'Same slug as Acme, different tenant.', priceCents: 119900, stock: 7, rating: '4.10', viewCount: 44n, metadata: { color: 'silver' } },
    { id: 'prd_globex_phone', tenantId: 'ten_globex', categoryId: 'cat_globex_phones', sku: 'GLX-PHO-01', slug: 'orbit-phone', name: 'Orbit Phone', description: '5G phone.', priceCents: 79900, stock: 20, rating: '4.50', viewCount: 300n, metadata: { storageGb: 128 } },
    { id: 'prd_globex_headset', tenantId: 'ten_globex', categoryId: null, sku: 'GLX-HEA-01', slug: 'orbit-headset', name: 'Orbit Headset', description: null, priceCents: 15900, stock: 0, rating: null, viewCount: 5n, metadata: null },
  ];
  for (const product of products) {
    await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: product.tenantId, sku: product.sku } },
      update: { name: product.name, priceCents: product.priceCents, stock: product.stock, active: true, deletedAt: null },
      create: product,
    });
  }

  const tags = [
    { id: 'tag_acme_sale', tenantId: 'ten_acme', name: 'Sale', slug: 'sale' },
    { id: 'tag_acme_new', tenantId: 'ten_acme', name: 'New', slug: 'new' },
    { id: 'tag_globex_sale', tenantId: 'ten_globex', name: 'Sale', slug: 'sale' },
  ];
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { tenantId_slug: { tenantId: tag.tenantId, slug: tag.slug } },
      update: { name: tag.name },
      create: tag,
    });
  }

  const productTags = [
    { tenantId: 'ten_acme', productId: 'prd_acme_laptop', tagId: 'tag_acme_sale' },
    { tenantId: 'ten_acme', productId: 'prd_acme_laptop', tagId: 'tag_acme_new' },
    { tenantId: 'ten_acme', productId: 'prd_acme_mouse', tagId: 'tag_acme_sale' },
    { tenantId: 'ten_globex', productId: 'prd_globex_phone', tagId: 'tag_globex_sale' },
  ];
  for (const link of productTags) {
    await prisma.productTag.upsert({
      where: { tenantId_productId_tagId: link },
      update: {},
      create: link,
    });
  }

  // Implicit many-to-many demo rows.
  await prisma.article.upsert({
    where: { id: 'art_acme_trail' },
    update: {},
    create: { id: 'art_acme_trail', tenantId: 'ten_acme', title: 'Trail season is here' },
  });
  await prisma.article.upsert({
    where: { id: 'art_globex_orbit' },
    update: {},
    create: { id: 'art_globex_orbit', tenantId: 'ten_globex', title: 'Orbit phone launch' },
  });
  await prisma.label.upsert({
    where: { id: 'lbl_acme_outdoors' },
    update: {},
    create: { id: 'lbl_acme_outdoors', tenantId: 'ten_acme', name: 'Outdoors' },
  });
  await prisma.label.upsert({
    where: { id: 'lbl_globex_mobile' },
    update: {},
    create: { id: 'lbl_globex_mobile', tenantId: 'ten_globex', name: 'Mobile' },
  });
  await prisma.article.update({
    where: { id: 'art_acme_trail' },
    data: { labels: { connect: [{ id: 'lbl_acme_outdoors' }] } },
  });
  await prisma.article.update({
    where: { id: 'art_globex_orbit' },
    data: { labels: { connect: [{ id: 'lbl_globex_mobile' }] } },
  });

  const coupons = [
    { id: 'cpn_acme_trail10', tenantId: 'ten_acme', code: 'TRAIL10', type: 'PERCENT' as const, percentOff: 10, minOrderCents: 5000, maxRedemptions: 100 },
    { id: 'cpn_globex_orbit20', tenantId: 'ten_globex', code: 'ORBIT20', type: 'FIXED' as const, amountOffCents: 2000, minOrderCents: 10000, maxRedemptions: 50 },
  ];
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { tenantId_code: { tenantId: coupon.tenantId, code: coupon.code } },
      update: { active: true, redemptionCount: 0 },
      create: coupon,
    });
  }

  const orders = [
    {
      id: 'ord_acme_1001', tenantId: 'ten_acme', customerId: 'cus_acme_alice', number: 'ACME-1001',
      status: 'PAID' as const, subtotalCents: 139700, discountCents: 10000, totalCents: 129700,
      idempotencyKey: 'seed-acme-1001',
      items: [
        { id: 'oit_acme_1001_1', productId: 'prd_acme_laptop', productName: 'Trail Laptop 14', sku: 'ACME-LAP-01', unitPriceCents: 129900, quantity: 1, lineTotalCents: 129900 },
        { id: 'oit_acme_1001_2', productId: 'prd_acme_mouse', productName: 'Trail Mouse', sku: 'ACME-MOU-01', unitPriceCents: 4900, quantity: 2, lineTotalCents: 9800 },
      ],
      payments: [
        { id: 'pay_acme_1001', provider: 'stripe', providerRef: 'pi_seed_acme_1001', amountCents: 129700, status: 'SUCCEEDED' as const },
      ],
    },
    {
      id: 'ord_acme_1002', tenantId: 'ten_acme', customerId: 'cus_acme_bob', number: 'ACME-1002',
      status: 'FULFILLED' as const, subtotalCents: 24900, discountCents: 0, totalCents: 24900,
      idempotencyKey: 'seed-acme-1002',
      items: [
        { id: 'oit_acme_1002_1', productId: 'prd_acme_chair', productName: 'Camp Chair', sku: 'ACME-CHA-01', unitPriceCents: 24900, quantity: 1, lineTotalCents: 24900 },
      ],
      payments: [
        { id: 'pay_acme_1002', provider: 'stripe', providerRef: 'pi_seed_acme_1002', amountCents: 24900, status: 'SUCCEEDED' as const },
      ],
    },
    {
      id: 'ord_globex_2001', tenantId: 'ten_globex', customerId: 'cus_globex_carol', number: 'GLX-2001',
      status: 'PAID' as const, subtotalCents: 95800, discountCents: 2000, totalCents: 93800,
      idempotencyKey: 'seed-globex-2001',
      items: [
        { id: 'oit_globex_2001_1', productId: 'prd_globex_phone', productName: 'Orbit Phone', sku: 'GLX-PHO-01', unitPriceCents: 79900, quantity: 1, lineTotalCents: 79900 },
        { id: 'oit_globex_2001_2', productId: 'prd_globex_headset', productName: 'Orbit Headset', sku: 'GLX-HEA-01', unitPriceCents: 15900, quantity: 1, lineTotalCents: 15900 },
      ],
      payments: [
        { id: 'pay_globex_2001', provider: 'adyen', providerRef: 'pay_seed_globex_2001', amountCents: 93800, status: 'SUCCEEDED' as const },
      ],
    },
    {
      id: 'ord_globex_2002', tenantId: 'ten_globex', customerId: 'cus_globex_dave', number: 'GLX-2002',
      status: 'PENDING' as const, subtotalCents: 119900, discountCents: 0, totalCents: 119900,
      idempotencyKey: 'seed-globex-2002',
      items: [
        { id: 'oit_globex_2002_1', productId: 'prd_globex_laptop', productName: 'Globex Work Laptop', sku: 'GLX-LAP-01', unitPriceCents: 119900, quantity: 1, lineTotalCents: 119900 },
      ],
      payments: [],
    },
  ];
  for (const order of orders) {
    const { items, payments, ...orderData } = order;
    await prisma.order.upsert({
      where: { id: order.id },
      update: {},
      create: orderData,
    });
    for (const item of items) {
      await prisma.orderItem.upsert({
        where: { id: item.id },
        update: {},
        create: { ...item, tenantId: order.tenantId, orderId: order.id },
      });
    }
    for (const payment of payments) {
      await prisma.payment.upsert({
        where: { id: payment.id },
        update: {},
        create: { ...payment, tenantId: order.tenantId, orderId: order.id },
      });
    }
  }

  await prisma.couponRedemption.upsert({
    where: { id: 'red_acme_1001' },
    update: {},
    create: {
      id: 'red_acme_1001',
      tenantId: 'ten_acme',
      couponId: 'cpn_acme_trail10',
      customerId: 'cus_acme_alice',
      orderId: 'ord_acme_1001',
    },
  });

  const ledger = [
    { id: 'loy_acme_1001_earn', tenantId: 'ten_acme', customerId: 'cus_acme_alice', orderId: 'ord_acme_1001', delta: 129, reason: 'order_earn' },
    { id: 'loy_acme_1001_redeem', tenantId: 'ten_acme', customerId: 'cus_acme_alice', orderId: null, delta: -9, reason: 'coupon_redeem' },
    { id: 'loy_globex_2001_earn', tenantId: 'ten_globex', customerId: 'cus_globex_carol', orderId: 'ord_globex_2001', delta: 93, reason: 'order_earn' },
  ];
  for (const entry of ledger) {
    await prisma.loyaltyLedger.upsert({ where: { id: entry.id }, update: {}, create: entry });
  }

  await prisma.fraudEvent.upsert({
    where: { id: 'frd_globex_carol_unban' },
    update: {},
    create: {
      id: 'frd_globex_carol_unban',
      tenantId: 'ten_globex',
      customerId: 'cus_globex_carol',
      action: 'UNBAN',
      reason: 'False positive after manual review',
      actorId: 'usr_globex_admin',
    },
  });

  console.log('Seeded 2 tenants, 2 users, 4 customers, 5 categories, 6 products, 4 orders, 3 payments, 2 coupons.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
