// Chapter 73 — final verification.
// This is the script the checklist refers to: it proves the environment,
// migrations, schema, seed data and RLS layer are all in place.
import { readFileSync } from 'node:fs';
import { createPrisma } from './lib/prisma.js';

const prisma = createPrisma({ logSql: false });
let passed = 0;
function ok(label: string, condition: boolean, detail?: unknown) {
  if (!condition) throw new Error(`FAILED: ${label}`);
  passed += 1;
  console.log('PASS', label, detail === undefined ? '' : detail);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};
ok('prisma CLI pinned', pkg.devDependencies.prisma === '7.10.1', pkg.devDependencies.prisma);
ok('@prisma/client matches', pkg.dependencies['@prisma/client'] === '7.10.1');
ok('adapter pinned', pkg.dependencies['@prisma/adapter-pg'] === '7.10.1');

const [db] = await prisma.$queryRaw<Array<{ database: string; version: string }>>`
  SELECT current_database() AS database, version() AS version
`;
ok('database is prisma_learn', db.database === 'prisma_learn');
ok('PostgreSQL 17', db.version.startsWith('PostgreSQL 17'), db.version.split(',')[0]);

const migrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null }>>`
  SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at
`;
ok('all migrations applied', migrations.every((row) => row.finished_at !== null), migrations.length);

const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name
`;
const names = tables.map((row) => row.table_name);
for (const required of ['tenants', 'users', 'customers', 'orders', 'order_items', 'payments', 'coupons', 'loyalty_ledger', 'fraud_events']) {
  ok(`table ${required}`, names.includes(required));
}

for (const tenantId of ['ten_acme', 'ten_globex']) {
  const counts = {
    customers: await prisma.customer.count({ where: { tenantId } }),
    products: await prisma.product.count({ where: { tenantId } }),
    orders: await prisma.order.count({ where: { tenantId } }),
  };
  ok(`tenant ${tenantId} has fixture data`, counts.customers === 2 && counts.products === 3 && counts.orders === 2, counts);
}

const rls = await prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public' AND tablename IN ('customers', 'products', 'orders')
  ORDER BY tablename
`;
ok('RLS enabled on 3 tables', rls.length === 3 && rls.every((row) => row.rowsecurity), rls);
const policies = await prisma.$queryRaw<Array<{ count: bigint }>>`
  SELECT count(*)::bigint AS count FROM pg_policies WHERE schemaname = 'public'
`;
ok('RLS policies installed', Number(policies[0].count) >= 3, policies[0].count.toString());

const [role] = await prisma.$queryRaw<Array<{ rolname: string; rolbypassrls: boolean }>>`
  SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = 'rls_app'
`;
ok('rls_app role exists without BYPASSRLS', role?.rolname === 'rls_app' && role.rolbypassrls === false);

console.log(`\n${passed} checks passed. The course environment is complete.`);
await prisma.$disconnect();
