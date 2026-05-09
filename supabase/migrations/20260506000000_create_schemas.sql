-- =============================================================================
-- Create All Three Schemas
-- Run this once as the Supabase project admin BEFORE running 001_initial_schema.sql
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS "kitaradar-dev";
CREATE SCHEMA IF NOT EXISTS "kitaradar-test";
CREATE SCHEMA IF NOT EXISTS "kitaradar-prod";

-- 1. Schema-level USAGE — allows roles to see objects in the schema
GRANT USAGE ON SCHEMA "kitaradar-dev"  TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA "kitaradar-test" TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA "kitaradar-prod" TO anon, authenticated, service_role;

-- 2. Table-level privileges — required so PostgREST can expose the tables via the API.
--    Run after 001_initial_schema.sql has created the tables in each schema.
--    RLS policies still control what each role may actually read/write.

-- kitaradar-dev
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN SCHEMA "kitaradar-dev" TO authenticated;
GRANT SELECT
    ON ALL TABLES IN SCHEMA "kitaradar-dev" TO anon;
GRANT ALL
    ON ALL TABLES IN SCHEMA "kitaradar-dev" TO service_role;

-- Ensure future tables automatically receive the same grants (DEFAULT PRIVILEGES)
ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-dev"
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-dev"
    GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-dev"
    GRANT ALL ON TABLES TO service_role;

-- kitaradar-test
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN SCHEMA "kitaradar-test" TO authenticated;
GRANT SELECT
    ON ALL TABLES IN SCHEMA "kitaradar-test" TO anon;
GRANT ALL
    ON ALL TABLES IN SCHEMA "kitaradar-test" TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-test"
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-test"
    GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-test"
    GRANT ALL ON TABLES TO service_role;

-- kitaradar-prod
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN SCHEMA "kitaradar-prod" TO authenticated;
GRANT SELECT
    ON ALL TABLES IN SCHEMA "kitaradar-prod" TO anon;
GRANT ALL
    ON ALL TABLES IN SCHEMA "kitaradar-prod" TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-prod"
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-prod"
    GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-prod"
    GRANT ALL ON TABLES TO service_role;

-- 3. Sequences (for auto-increment / gen_random_uuid fallbacks)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA "kitaradar-dev"  TO authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA "kitaradar-test" TO authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA "kitaradar-prod" TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-dev"
    GRANT USAGE ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-test"
    GRANT USAGE ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "kitaradar-prod"
    GRANT USAGE ON SEQUENCES TO authenticated, service_role;

-- 4. Expose schemas in PostgREST (Supabase API)
--    Go to: Supabase Dashboard → Project Settings → API → "Exposed schemas"
--    Add: kitaradar-dev, kitaradar-test, kitaradar-prod
--    (This cannot be done via SQL — it is a Supabase config setting.)

-- 5. Execution order
--    Step 1: Run this file (000_create_schemas.sql) as admin
--    Step 2: SET search_path TO "kitaradar-dev";  then run 001_initial_schema.sql
--    Step 3: SET search_path TO "kitaradar-test"; then run 001_initial_schema.sql
--    Step 4: SET search_path TO "kitaradar-prod"; then run 001_initial_schema.sql
--    Step 5: Re-run the GRANT ON ALL TABLES blocks above (tables exist now)
