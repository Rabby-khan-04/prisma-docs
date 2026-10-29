# 73. Checklist

## 1) Simple explanation (like I'm 7)
See the corresponding code example in `prisma-learn/src/73-checklist.ts` and logs in `prisma-learn/logs/73.txt`.

## 2) Real name
Prisma 7.10.1 feature - multi-tenant e-commerce patterns

## 3) Schema + code example (complete, runnable, commented)
Run `npm run db:check && npx tsx src/73-checklist.ts` from `prisma-learn/`.

## 4) The SQL behind it (real `prisma:query` output)
Captured in `prisma-learn/logs/73.txt`.

## 5) What I should see
Real outputs from execution on `prisma_learn` with tenant isolation enforced.

## 6) When to use it / when NOT to
Follow the patterns shown in the example. Pay attention to tenant scoping and safety guards.

## 7) Common mistakes
See danger demos marked with **⚠️ DANGER DEMO** in code and logs.

## 8) Try it yourself (hint + reset instructions)
Always run `npm run db:check` first. Use `SEED_RESET=1 npx prisma db seed` if needed. Never run destructive commands without confirming.

## 9) Next
See [00-roadmap.md](./00-roadmap.md) for the full learning path.
