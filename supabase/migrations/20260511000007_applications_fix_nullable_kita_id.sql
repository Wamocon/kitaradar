-- =============================================================================
-- Migration 007: Fix applications table for Overpass (external) kitas
-- =============================================================================
-- Problem: kita_id was NOT NULL + FK to internal kitas table, but Overpass
-- kitas are external and never stored in our kitas table → NULL constraint fails.
-- Also: status CHECK was missing 'response_received' and 'rejected' values.
-- =============================================================================

-- 1. Make kita_id nullable (Overpass kitas have no UUID in our DB)
ALTER TABLE applications
  ALTER COLUMN kita_id DROP NOT NULL;

-- 2. Drop the UNIQUE constraint that includes kita_id (can't enforce UNIQUE with NULLs properly)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = current_schema()
      AND table_name = 'applications'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'applications_profile_id_kita_id_key'
  ) THEN
    ALTER TABLE applications DROP CONSTRAINT applications_profile_id_kita_id_key;
  END IF;
END $$;

-- 3. Drop the FK constraint (kita_id may now be NULL → FK only enforced when set)
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT constraint_name INTO fk_name
  FROM information_schema.table_constraints
  WHERE table_schema = current_schema()
    AND table_name = 'applications'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%kita_id%';

  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE applications DROP CONSTRAINT ' || quote_ident(fk_name);
  END IF;
END $$;

-- 4. Drop old status CHECK constraint and recreate with all valid values
DO $$
DECLARE
  chk_name text;
BEGIN
  SELECT constraint_name INTO chk_name
  FROM information_schema.table_constraints
  WHERE table_schema = current_schema()
    AND table_name = 'applications'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%status%';

  IF chk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE applications DROP CONSTRAINT ' || quote_ident(chk_name);
  END IF;
END $$;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('draft', 'sent', 'waiting', 'response_received', 'positive', 'rejected', 'negative'));

-- 5. Ensure kita_name column exists and is nullable (not forced NOT NULL DEFAULT '')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'applications'
      AND column_name = 'kita_name'
  ) THEN
    ALTER TABLE applications ADD COLUMN kita_name text;
  ELSE
    -- Remove the NOT NULL constraint if it exists
    ALTER TABLE applications ALTER COLUMN kita_name DROP NOT NULL;
    -- Remove empty string default
    ALTER TABLE applications ALTER COLUMN kita_name DROP DEFAULT;
  END IF;
END $$;
