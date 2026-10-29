# 33. Filtering operators

## 1) Simple explanation (like I'm 7)
Use operators like `in`, `gte`, `lt`, `contains`, `startsWith`, `OR`, `AND`, `not` to build complex filters.

## 2) Real name
**Where clause operators** — Prisma 7.10.1

## 3) Schema + code example (complete, runnable, commented)
**File:** `prisma-learn/src/33-filtering-operators.ts` - shows in, range, contains with mode insensitive, OR, null filters.

## 4) The SQL behind it (real `prisma:query` output)
IN clauses, comparisons, ILIKE, OR conditions, IS NULL.

## 5) What I should see
Various filter operators translate to appropriate SQL.

## 6) When to use it / when NOT to
**Use when:** Building dynamic queries.  
**Don't use when:** Using `contains` on large unindexed text columns (can be slow).

## 7) Common mistakes
- Case sensitivity with contains/startsWith.
- Null handling.
- Not indexing filtered columns.

## 8) Try it yourself (hint + reset instructions)
**Hint:** Combine operators.  
**Reset:** No changes.

## 9) Next
[34. Sorting](./34-sorting.md)
