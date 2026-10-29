# Prisma 7 Learning Roadmap (73 chapters) — COMPLETED

All chapters 01–73 have been completed with working examples run against the local `sql-learn` PostgreSQL container (localhost:5433/prisma_learn) using Prisma 7.10.1.

## Part 0: Orientation & Setup (01–11)
- [x] 01. What an ORM is
- [x] 02. What Prisma is and is not
- [x] 03. Project setup (guards, Prisma 7, adapter, generated client)
- [x] 04. Schema, datasource, generator
- [x] 05. Prisma Studio
- [x] 06. Models, fields, optionality
- [x] 07. IDs, defaults, updatedAt
- [x] 08. Unique constraints
- [x] 09. Mapping with @map and @@map
- [x] 10. Enums
- [x] 11. Native types with @db.*

## Part 1: Relations & Modeling (12–20)
- [x] 12. One-to-one relations
- [x] 13. One-to-many relations
- [x] 14. Many-to-many relations (implicit vs explicit)
- [x] 15. Self relations
- [x] 16. Referential actions (onDelete/onUpdate)
- [x] 17. Referential actions danger demo (⚠️ DANGER DEMO)
- [x] 18. Indexes
- [x] 19. Composite keys and unique constraints
- [x] 20. Index column order and EXPLAIN

## Part 2: Migrations (21–29)
- [x] 21. migrate dev vs migrate deploy vs db push
- [x] 22. Shadow database and migration history
- [x] 23. Reading and editing migration SQL
- [x] 24. Drift
- [x] 25. Data migrations and backfills
- [x] 26. Baselining
- [x] 27. Failed migrations
- [x] 28. migrate reset is local-only
- [x] 29. Expand/contract pattern

## Part 3: CRUD & Querying (30–44)
- [x] 30. create, findUnique, findFirst, findMany
- [x] 31. update, upsert, delete
- [x] 32. Bulk operations (createMany, updateMany, deleteMany, createManyAndReturn)
- [x] 33. Filtering operators
- [x] 34. Sorting
- [x] 35. select vs include
- [x] 36. Nested reads
- [x] 37. Nested writes
- [x] 38. Relation filters
- [x] 39. Pagination (offset and cursor)
- [x] 40. Aggregations (count, aggregate, groupBy)
- [x] 41. Transactions (nested writes, batch, interactive)
- [x] 42. Transactions: isolation, timeouts, overselling (⚠️ DANGER DEMO)
- [x] 43. N+1 problem (⚠️ DANGER DEMO)
- [x] 44. Raw queries ($queryRaw, $executeRaw, typed SQL)

## Part 4: Real-World Patterns (45–50)
- [x] 45. Money as integer cents
- [x] 46. Timezones and timestamptz
- [x] 47. JSON/JSONB
- [x] 48. Soft deletes
- [x] 49. Audit trails
- [x] 50. Partial updates and null handling

## Part 5: Multi-Tenancy & RLS (51–57)
- [x] 51. Row Level Security concept
- [x] 52. Enabling RLS and creating policies
- [x] 53. RLS tenant isolation tests
- [x] 54. RLS bypass with rls_app role (⚠️ DANGER DEMO)
- [x] 55a. RLS with rls_app no bypass
- [x] 55b. Using RLS policies correctly
- [x] 56. RLS with session variables (app.tenant_id)
- [x] 57. RLS testing matrix

## Part 6: Search, Extensions, Locking (58–66)
- [x] 58. Search with LIKE/ILIKE
- [x] 59. Full-text search (tsvector/tsquery)
- [x] 60. Postgres extensions
- [x] 61. Postgres functions and triggers
- [x] 62. Locking: pessimistic (FOR UPDATE)
- [x] 63. Locking: optimistic (versioning)
- [x] 64. Performance: EXPLAIN ANALYZE
- [x] 65. Connection pooling and adapter notes (@prisma/adapter-pg)
- [x] 66. Errors: Prisma vs Postgres

## Part 7: Production Readiness (67–73)
- [x] 67. Type safety and inference
- [x] 68. Validation with Zod
- [x] 69. Testing patterns
- [x] 70. Seeding
- [x] 71. Logging and observability
- [x] 72. Prisma config and CLI
- [x] 73. Final checklist and verification

**All 73 chapters completed. All examples run against prisma_learn on localhost:5433.**
