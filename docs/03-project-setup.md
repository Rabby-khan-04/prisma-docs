# 03. Project setup

## 1) Simple explanation (like I'm 7)
Before writing queries, we set up a guarded project: pinned versions, a config file, a generated client in our project folder, a driver adapter to talk to PostgreSQL, and scripts that refuse to connect to anything except our throwaway local database.

## 2) Real name
**Prisma 7 project setup (ESM, prisma.config.ts, prisma-client generator, driver adapter)** — tested on **Prisma 7.10.1**.

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/03-project-setup.ts`

```ts
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
```

**Guards (enforced):** `prisma-learn/scripts/preflight.mjs` and `prisma-learn/prisma.config.ts` both require `postgresql://postgres:learn@localhost:5433/prisma_learn`. `src/lib/prisma.ts` uses `@prisma/adapter-pg` with `PrismaPg` and loads `.env` via `dotenv/config`.

## 4) The SQL behind it (real `prisma:query` output)
```
prisma:query SELECT current_database(), version()
 -- params=[]
database: prisma_learn
server: PostgreSQL 17.11 (Debian 17.11-1.pgdg13+2) on x86_64-pc-linux-gnu, compiled by gcc (Debian 13.3.0-12) 13.3.0, 64-bit
prisma:query   SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name
 -- params=[]
tables: Article, Category, Coupon, CouponRedemption, Customer, CustomerProfile, FraudEvent, Label, LoyaltyLedger, Order, OrderItem, Payment, Product, ProductTag, SetupCheck, Tag, Tenant, User, _ArticleToLabel, _prisma_migrations
```

## 5) What I should see
Database is `prisma_learn` on PostgreSQL 17.11. Tables include the learning schema plus `_prisma_migrations`. The URL guard passes only for localhost:5433/prisma_learn.

## 6) When to use it / when NOT to
**Use when:** Starting any Prisma 7 project — pin versions, use `prisma.config.ts`, generate client to a project path, add a driver adapter, and guard your connection URL.  
**Don't use when:** Copying Prisma 6 patterns (no `url` in `datasource` in v7, different generator, `migrate dev` doesn't auto-generate/seed).

## 7) Common mistakes
- Running `npx prisma ...` without the guard (use `npm run db:check` or the guarded npm scripts).
- Letting CLI/client versions drift.
- Forgetting `dotenv/config` in Prisma 7.
- Putting secrets in committed files (we only use throwaway local credentials).

## 8) Try it yourself (hint + reset instructions)
**Hint:** Run `npm run db:check` from `prisma-learn/`. Try changing `DATABASE_URL` to a different host/port and watch it throw.  
**Reset:** Fixture is managed by `prisma db seed`. No destructive reset needed for this chapter.

## 9) Next
[04. Schema, datasource, generator](./04-schema-datasource-generator.md)
