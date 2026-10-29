# 25. Data migrations and backfills

## 1) Simple explanation (like I'm 7)
Schema migrations change structure (add column). Data migrations move/fill data. Do them separately and make them idempotent.

## 2) Real name
**Data migrations and backfills** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
We did expand/contract: added `display_name` nullable, backfilled it, then made it required. Backfill was in its own migration.

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
Separate migration for data changes. Backfill before making column NOT NULL.

## 6) When to use it / when NOT to
**Use when:** Populating new columns, transforming data, or migrating values.  
**Don't use when:** Doing huge backfills in one transaction on large tables without batching/considering locks.

## 7) Common mistakes
- Making column NOT NULL before backfilling.
- Non-idempotent data migrations.
- Locking tables for too long.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Follow expand/contract pattern.  
**Reset:** Migration already applied.

## 9) Next
[26. Baselining](./26-baselining.md)
