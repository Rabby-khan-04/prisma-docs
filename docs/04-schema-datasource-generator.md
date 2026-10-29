# 04. Schema, datasource, generator

## 1) Simple explanation (like I'm 7)
`schema.prisma` is the blueprint: it tells Prisma what tables/columns/relations exist, how to generate a type-safe client, and (in v7) the datasource has no URL because config lives in `prisma.config.ts`.

## 2) Real name
**Prisma Schema (datasource, generator, models)** — **Prisma 7.10.1**.

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/04-schema-datasource-generator.ts`

```ts
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
```

## 4) The SQL behind it (real `prisma:query` output)
```
--- generator ---
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
--- datasource ---
datasource db {
  provider = "postgresql"
}
prisma:query 
  SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at
 -- params=[]
--- migrations ---
┌─────────┬───────────────────────────────────┬──────────────────────────┐
│ (index) │ migration_name                    │ finished_at              │
├─────────┼───────────────────────────────────┼──────────────────────────┤
│ 0       │ '20261028053002_init_setup_check' │ 2026-10-28T05:30:02.562Z │
│ 1       │ '20261028053632_foundations'      │ 2026-10-28T05:36:32.557Z │
│ 2       │ '20261028053725_commerce'         │ 2026-10-28T05:37:25.712Z │
└─────────┴───────────────────────────────────┴──────────────────────────┘
```

## 5) What I should see
Generator is `prisma-client` with a required `output` pointing to `src/generated/prisma`. Datasource has no `url` in v7. Migrations are tracked in `_prisma_migrations`.

## 6) When to use it / when NOT to
**Use when:** Defining your data model, choosing generators/adapters, and understanding where types come from.  
**Don't use when:** Assuming Prisma 6 structure (v7 changes the generator and datasource config).

## 7) Common mistakes
- Using `prisma-client-js` and expecting default output to `node_modules` in v7 style.
- Putting `url` in `datasource db` in Prisma 7 (it belongs in `prisma.config.ts`).
- Forgetting to run `prisma generate` after schema changes (or using the npm script).

## 8) Try it yourself (hint + reset instructions)
**Hint:** Run `npx prisma format` and `npx prisma validate`. Look in `src/generated/prisma/` after `npm run db:generate`.  
**Reset:** Not needed.

## 9) Next
[05. Prisma Studio](./05-prisma-studio.md)
