// Chapter 0 / setup proof: connect with Prisma 7 + the pg driver adapter,
// write one row, read it back, and print the SQL Prisma actually runs.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

// In Prisma 7 a driver adapter is required. PrismaPg wraps the `pg` driver.
const adapter = new PrismaPg({ connectionString });

// log: ['query'] prints every SQL statement Prisma sends to PostgreSQL.
const prisma = new PrismaClient({ adapter, log: ['query', 'warn', 'error'] });

const created = await prisma.setupCheck.create({
  data: { note: 'hello from prisma 7' },
});

const rows = await prisma.setupCheck.findMany({ orderBy: { id: 'asc' } });

console.log('created:', created);
console.log('rows:', rows);

await prisma.$disconnect();
