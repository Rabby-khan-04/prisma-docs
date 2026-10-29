# 28. migrate reset is local-only

## 1) Simple explanation (like I'm 7)
`prisma migrate reset` drops the database/schema and re-runs all migrations from scratch. It destroys ALL data. Only use in local dev.

## 2) Real name
**migrate reset** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
Our guards prevent destructive operations. We use `SEED_RESET=1 npx prisma db seed` to reset fixture data instead.

## 4) The SQL behind it (real `prisma:query` output)
Seed does `TRUNCATE ... RESTART IDENTITY CASCADE` on specific tables.

## 5) What I should see
Never run reset in production. Use controlled resets with guards.

## 6) When to use it / when NOT to
**Use when:** Fresh start in local development.  
**Don't use when:** Any shared/staging/production environment.

## 7) Common mistakes
- Running reset in wrong environment.
- Not having backups.
- Bypassing guards.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Use `SEED_RESET=1 npm run db:seed` instead.  
**Reset:** Not needed.

## 9) Next
[29. Expand/contract pattern](./29-expand-contract.md)
