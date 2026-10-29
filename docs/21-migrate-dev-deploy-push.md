# 21. migrate dev vs migrate deploy vs db push

## 1) Simple explanation (like I'm 7)
- `migrate dev`: creates and applies migrations in development (interactive)
- `migrate deploy`: applies existing migrations in production/CI (non-interactive)
- `db push`: syncs schema directly without creating migration files (prototyping only)

## 2) Real name
**Prisma Migration Commands** — Prisma 7.10.1 (migrate dev no longer auto-generates or seeds)

## 3) Schema + code example (complete, runnable, commented)
We used all three patterns. See `package.json` scripts: `db:migrate`, `db:deploy`, `db:push`.

## 4) The SQL behind it (real `prisma:query` output)
Migrations tracked in `_prisma_migrations`. See chapter 04 for migration history.

## 5) What I should see
Use `migrate dev` in dev to create migrations. Use `migrate deploy` in prod/CI. Avoid `db push` in teams with migration history.

## 6) When to use it / when NOT to
**Use when:** `migrate dev` for development, `migrate deploy` for deployments.  
**Don't use when:** Using `db push` in production or when you need migration history.

## 7) Common mistakes
- Using `db push` in production.
- Running `migrate dev` in CI.
- Forgetting that v7 doesn't auto-generate/seed on migrate.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Check `package.json` scripts. Try `npm run db:status`.  
**Reset:** Not needed.

## 9) Next
[22. Shadow database and migration history](./22-shadow-database-history.md)
