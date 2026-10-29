-- Data migration: backfill new columns in batches in real life.
-- On this small learning DB a single UPDATE is fine.
UPDATE "customers"
SET "display_name" = "name"
WHERE "display_name" IS NULL;

-- Tier is derived from loyalty points (idempotent, safe to re-run).
UPDATE "customers"
SET "tier" = CASE
  WHEN "loyalty_points" >= 250 THEN 'GOLD'
  WHEN "loyalty_points" >= 100 THEN 'SILVER'
  ELSE 'BRONZE'
END;
