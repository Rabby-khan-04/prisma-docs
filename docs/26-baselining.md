# 26. Baselining an existing database

## 1) Simple explanation (like I'm 7)
If you have an existing database with no migration history, you can baseline it - mark migrations as applied without running them.

## 2) Real name
**Prisma migrate baseline** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
Use `prisma migrate resolve --applied` and `prisma migrate diff` to baseline.

## 4) The SQL behind it (real `prisma:query` output)
Documented process, not executed here since DB was built fresh.

## 5) What I should see
Never point `migrate dev` at unmanaged production DB. Use baselining.

## 6) When to use it / when NOT to
**Use when:** Adopting Prisma on existing database.  
**Don't use when:** Starting fresh - use migrations normally.

## 7) Common mistakes
- Running `migrate dev` on existing production DB.
- Not capturing current schema state.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Read Prisma docs on baselining.  
**Reset:** Not applicable.

## 9) Next
[27. Failed migrations](./27-failed-migrations.md)
