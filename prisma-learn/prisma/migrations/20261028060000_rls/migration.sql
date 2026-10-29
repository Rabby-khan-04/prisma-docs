-- Chapter 57: PostgreSQL Row-Level Security as a second layer.
-- Prisma 7 does not declare RLS in schema.prisma; this is hand-written SQL.
-- The app role is NOLOGIN here: we switch to it with SET LOCAL ROLE for the demo.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_app') THEN
    CREATE ROLE rls_app NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO rls_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rls_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rls_app;

ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders"    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_customers ON "customers";
CREATE POLICY tenant_isolation_customers ON "customers"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_products ON "products";
CREATE POLICY tenant_isolation_products ON "products"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_orders ON "orders";
CREATE POLICY tenant_isolation_orders ON "orders"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
