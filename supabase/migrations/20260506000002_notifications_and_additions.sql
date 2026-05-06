-- Migration 002: Notifications table + search_count column

-- Add search_count to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'profiles'
      AND column_name = 'search_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN search_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'general',
  title       text NOT NULL,
  body        text,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS notifications_profile_id_idx ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(profile_id, is_read);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (profile_id = auth.uid());

-- Grant permissions to service role and postgres
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO postgres;

-- Kita applications table: ensure kita_name column exists (may differ from initial migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'applications'
      AND column_name = 'kita_name'
  ) THEN
    ALTER TABLE applications ADD COLUMN kita_name text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'applications'
      AND column_name = 'kita_email'
  ) THEN
    ALTER TABLE applications ADD COLUMN kita_email text;
  END IF;
END $$;

-- Ensure tier column on profiles has proper default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'profiles'
      AND column_name = 'tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tier text NOT NULL DEFAULT 'free';
  END IF;
END $$;

-- Stripe customer id on subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'subscriptions'
      AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'subscriptions'
      AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;
