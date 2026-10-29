# 27. Resolving failed migrations

## 1) Simple explanation (like I'm 7)
If a migration fails partway, Prisma marks it as failed. You need to fix the DB and tell Prisma whether to mark it rolled back or applied.

## 2) Real name
**Failed migration recovery** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**Files:** `prisma-learn/logs/cli-27-failed.txt`, `prisma-learn/logs/cli-27-status-failed.txt`

We created a migration with `SELECT 1/0`, it failed, we used `migrate resolve --rolled-back`, fixed the migration SQL, and applied it. We had to clean up duplicate entries.

## 4) The SQL behind it (real `prisma:query` output)
Failed migration left entries in `_prisma_migrations`. We deleted duplicate rows and resolved properly.

## 5) What I should see
Error with code P3018, migration marked failed. Recovery steps documented.

## 6) When to use it / when NOT to
**Use when:** Migration fails in any environment.  
**Don't use when:** Guessing - understand what happened in the DB first.

## 7) Common mistakes
- Running migrations again without resolving.
- Not cleaning up partial changes from failed migration.
- Marking as applied when changes weren't actually applied.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Review the failed migration logs.  
**Reset:** Migration 20261028054200_failed_demo is applied in its repaired form.

## 9) Next
[28. migrate reset is local-only](./28-migrate-reset-local-only.md)
