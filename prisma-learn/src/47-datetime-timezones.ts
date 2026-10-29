// Chapter 47 — DateTime, timestamptz and time zones.
// PostgreSQL stores an instant; the time zone is a presentation choice.
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });

const [settings] = await prisma.$queryRaw<Array<{ TimeZone: string }>>`SHOW TimeZone`;
console.log('session TimeZone:', settings.TimeZone);

const types = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'orders' AND column_name IN ('placed_at', 'created_at')
  ORDER BY column_name
`;
console.log('order timestamp columns:', types);

// Create an order at a specific UTC instant, then read it back.
// 07:30 UTC on 2026-03-08 is 03:30 EDT: the US spring-forward jump already happened.
const instant = new Date('2026-03-08T07:30:00.000Z');
const created = await prisma.order.create({
  data: {
    id: 'ord_ch47_tz',
    tenantId: 'ten_acme',
    customerId: 'cus_acme_alice',
    number: 'CH47-TZ',
    status: 'PENDING',
    subtotalCents: 100,
    totalCents: 100,
    placedAt: instant,
  },
  select: { placedAt: true },
});
console.log('round-trip equal:', created.placedAt.toISOString() === instant.toISOString(), created.placedAt.toISOString());

// Same instant in two zones. The stored value is identical.
const zones = await prisma.$queryRaw<Array<{ ny: string; tokyo: string; epoch: string }>>`
  SELECT
    to_char(placed_at AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH24:MI') AS ny,
    to_char(placed_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI') AS tokyo,
    extract(epoch FROM placed_at)::text AS epoch
  FROM orders WHERE id = ${'ord_ch47_tz'}
`;
console.log('zoned views:', zones[0]);

// Day range for a report: "2026-03-08 in New York" is not a UTC day.
const [boundary] = await prisma.$queryRaw<Array<{ start_utc: string; end_utc: string }>>`
  SELECT
    ('2026-03-08 00:00:00 America/New_York'::timestamptz)::text AS start_utc,
    ('2026-03-09 00:00:00 America/New_York'::timestamptz)::text AS end_utc
`;
console.log('NY day in UTC:', boundary);

const inDay = await prisma.order.count({
  where: {
    tenantId: 'ten_acme',
    placedAt: { gte: new Date(boundary.start_utc), lt: new Date(boundary.end_utc) },
  },
});
console.log('orders in that NY day (tenant acme):', inDay);

// Date-only column: birthday is a calendar date, not an instant.
const profile = await prisma.customerProfile.findUnique({
  where: { tenantId_customerId: { tenantId: 'ten_acme', customerId: 'cus_acme_alice' } },
  select: { id: true, birthday: true },
});
console.log('birthday before:', profile?.birthday?.toISOString() ?? null);

await prisma.customerProfile.update({
  where: { tenantId_customerId: { tenantId: 'ten_acme', customerId: 'cus_acme_alice' } },
  data: { birthday: new Date('1990-05-15T00:00:00.000Z') },
});
const [dateOnly] = await prisma.$queryRaw<Array<{ birthday: string }>>`
  SELECT birthday::text AS birthday FROM customer_profiles
  WHERE tenant_id = ${'ten_acme'} AND customer_id = ${'cus_acme_alice'}
`;
console.log('date-only stored as:', dateOnly.birthday);

// Restore fixture (seed does not set birthday).
await prisma.customerProfile.update({
  where: { tenantId_customerId: { tenantId: 'ten_acme', customerId: 'cus_acme_alice' } },
  data: { birthday: null },
});
await prisma.order.delete({ where: { id: 'ord_ch47_tz' } });

await prisma.$disconnect();
