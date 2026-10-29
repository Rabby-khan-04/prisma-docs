# 23. Reading and editing migration SQL

## 1) Simple explanation (like I'm 7)
Prisma generates migration SQL, but sometimes you need to edit it (add indexes, do data migrations, fix edge cases). Read it carefully before applying.

## 2) Real name
**Customizing migrations** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
We created migrations like `20261028054045_backfill_customer_fields/migration.sql` manually with data migration SQL.

## 4) The SQL behind it (real `prisma:query` output)
```sql
UPDATE "customers"
SET "display_name" = "name"
WHERE "display_name" IS NULL;

UPDATE "customers"
SET "tier" = CASE
  WHEN "loyalty_points" >= 250 THEN 'GOLD'
  WHEN "loyalty_points" >= 100 THEN 'SILVER'
  ELSE 'BRONZE'
END;
```

## 5) What I should see
Migrations in `prisma/migrations/` are plain SQL files you can read and edit.

## 6) When to use it / when NOT to
**Use when:** Adding non-DSL changes (partial indexes, data migrations, custom constraints).  
**Don't use when:** Editing applied migrations in production without proper process.

## 7) Common mistakes
- Editing migrations after they've been applied to other environments.
- Breaking idempotency.
- Not wrapping in transactions where appropriate.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Look at migration SQL files in `prisma/migrations/`.  
**Reset:** Migrations are applied.

## 9) Next
[24. Drift](./24-drift.md)
