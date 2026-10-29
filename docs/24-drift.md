# 24. Drift

## 1) Simple explanation (like I'm 7)
Drift happens when the database schema doesn't match what Prisma expects from migrations. Like someone manually changed the DB without creating a migration.

## 2) Real name
**Schema drift detection** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**Files:** `prisma-learn/logs/cli-24-status-drift.txt`, `prisma-learn/logs/cli-24-diff.txt`

We created a table manually, ran `migrate status` and `migrate diff` to see drift.

## 4) The SQL behind it (real `prisma:query` output)
```
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma/schema.prisma.
Datasource "db": PostgreSQL database "prisma_learn", schema "public" at "localhost:5433"

7 migrations found in prisma/migrations

Database schema is up to date!
```
Diff showed `DROP TABLE "drift_demo";` when comparing DB to schema.

## 5) What I should see
`migrate status` reports state. `migrate diff` shows differences between schema and database.

## 6) When to use it / when NOT to
**Use when:** Detecting manual changes or sync issues.  
**Don't use when:** Ignoring drift in teams - it causes problems.

## 7) Common mistakes
- Making schema changes directly in DB.
- Not committing migrations.
- Resolving drift incorrectly.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Create a table manually with `psql`, run `npx prisma migrate status`. Drop it and see diff.  
**Reset:** We dropped the drift_demo table.

## 9) Next
[25. Data migrations and backfills](./25-data-migrations-backfills.md)
