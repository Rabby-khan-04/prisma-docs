// Chapter 04 — schema.prisma anatomy.
// Prints the datasource/generator blocks and the live migration history.
import { readFileSync } from 'node:fs';
import { createPrisma } from './lib/prisma.js';

const schema = readFileSync('prisma/schema.prisma', 'utf8');
const generator = schema.match(/generator client \{[\s\S]*?\}/)?.[0];
const datasource = schema.match(/datasource db \{[\s\S]*?\}/)?.[0];
console.log('--- generator ---');
console.log(generator);
console.log('--- datasource ---');
console.log(datasource);

const prisma = createPrisma();
const migrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null }>>`
  SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at
`;
console.log('--- migrations ---');
console.table(migrations);

await prisma.$disconnect();
