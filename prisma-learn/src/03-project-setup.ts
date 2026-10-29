// Chapter 03 — project setup proof.
// Confirms the pinned client, the guarded URL, the live database, and the tables.
import { createPrisma, assertLocalDatabaseUrl } from './lib/prisma.js';

assertLocalDatabaseUrl();
const prisma = createPrisma();

const [db] = await prisma.$queryRaw<Array<{ current_database: string; version: string }>>`
  SELECT current_database(), version()
`;
console.log('database:', db.current_database);
console.log('server:', db.version);

const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name
`;
console.log('tables:', tables.map((t) => t.table_name).join(', '));

await prisma.$disconnect();
