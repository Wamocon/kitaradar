-- =============================================================================
-- KitaRadar — Roles & Extended Profile Migration
-- Version: 003
-- Schema:  kitaradar-dev
-- Adds: role column, phone, partner_name, notification_prefs, avatar_url
-- =============================================================================

-- 1. Add role column to profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'kitaradar-dev' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE "kitaradar-dev".profiles
      ADD COLUMN role TEXT NOT NULL DEFAULT 'parent'
        CHECK (role IN ('admin', 'mother', 'father', 'parent'));
  END IF;
END $$;

-- 2. Add phone column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'kitaradar-dev' AND table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE "kitaradar-dev".profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

-- 3. Add partner_name column (for couples tracking Kita search together)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'kitaradar-dev' AND table_name = 'profiles' AND column_name = 'partner_name'
  ) THEN
    ALTER TABLE "kitaradar-dev".profiles ADD COLUMN partner_name TEXT;
  END IF;
END $$;

-- 4. Add avatar_url column if not already present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'kitaradar-dev' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE "kitaradar-dev".profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 5. Add notification_email column (boolean preference)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'kitaradar-dev' AND table_name = 'profiles' AND column_name = 'notification_email'
  ) THEN
    ALTER TABLE "kitaradar-dev".profiles ADD COLUMN notification_email BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- 6. Add default_search_city for saved location
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'kitaradar-dev' AND table_name = 'profiles' AND column_name = 'default_search_city'
  ) THEN
    ALTER TABLE "kitaradar-dev".profiles ADD COLUMN default_search_city TEXT;
  END IF;
END $$;

-- 7. Add default_search_radius (km) for saved preference
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'kitaradar-dev' AND table_name = 'profiles' AND column_name = 'default_search_radius'
  ) THEN
    ALTER TABLE "kitaradar-dev".profiles
      ADD COLUMN default_search_radius INTEGER NOT NULL DEFAULT 5
        CHECK (default_search_radius BETWEEN 1 AND 100);
  END IF;
END $$;
