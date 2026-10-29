# 29. Expand/contract pattern

## 1) Simple explanation (like I'm 7)
To change columns safely on live tables: expand (add nullable column), dual write, backfill, contract (make required/remove old). Deploy in steps.

## 2) Real name
**Expand and contract migrations** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
We did this with `displayName`: added nullable (expand), backfilled from `name`, made required (contract). Migrations: expand, backfill (data), contract.

## 4) The SQL behind it (real `prisma:query` output)
See migration history: expand_customer_display_name, backfill_customer_fields, contract_customer_display_name.

## 5) What I should see
Three-step process for safe schema changes.

## 6) When to use it / when NOT to
**Use when:** Changing columns on large tables in production.  
**Don't use when:** Small dev-only changes where downtime is acceptable.

## 7) Common mistakes
- Making NOT NULL without backfilling.
- Dropping columns while code still uses them.
- Doing it all in one migration.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Review the three migrations.  
**Reset:** Already applied.

## 9) Next
[30. create, findUnique, findFirst, findMany](./30-create-findunique-findfirst-findmany.md)
