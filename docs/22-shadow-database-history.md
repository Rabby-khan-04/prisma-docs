# 22. Shadow database and migration history

## 1) Simple explanation (like I'm 7)
Prisma uses a shadow database to detect drift when creating migrations. Migration history is stored in `_prisma_migrations` table with checksums.

## 2) Real name
**Shadow database, migration checksums** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
See `_prisma_migrations` table structure and migration history from chapter 04.

## 4) The SQL behind it (real `prisma:query` output)
```sql
SELECT migration_name, finished_at, rolled_back_at, started_at 
FROM _prisma_migrations ORDER BY started_at;
```

## 5) What I should see
Each migration has a name, checksum, started/finished/rolled_back timestamps.

## 6) When to use it / when NOT to
**Use when:** Understanding migration state.  
**Don't use when:** Manually editing `_prisma_migrations` unless fixing failed migrations (see chapter 27).

## 7) Common mistakes
- Deleting migration files.
- Editing migration history incorrectly.
- Not having permissions for shadow database.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Query `_prisma_migrations`.  
**Reset:** Not needed.

## 9) Next
[23. Reading and editing migration SQL](./23-reading-editing-migration-sql.md)
