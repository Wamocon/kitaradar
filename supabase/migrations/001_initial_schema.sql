-- =============================================================================
-- KitaRadar — Initial Schema Migration
-- Version: 001
-- Schemas: kitaradar-dev | kitaradar-test | kitaradar-prod
--
-- Run once per schema. Replace <schema> with the target schema name.
-- Example for dev:
--   SET search_path TO "kitaradar-dev";
--
-- All schemas share the same table structure. The app selects the schema
-- via the NEXT_PUBLIC_SUPABASE_SCHEMA environment variable.
-- =============================================================================

-- Required: replace <schema> before running
-- SET search_path TO "<schema>";

-- ---------------------------------------------------------------------------
-- Extensions (run once per Supabase project, not per schema)
-- ---------------------------------------------------------------------------
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search on kita names

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    full_name       TEXT,
    avatar_url      TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
    search_count_month INT NOT NULL DEFAULT 0,
    search_count_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()),
    stripe_customer_id TEXT UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Children
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS children (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    date_of_birth   DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Kitas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kitas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    address         TEXT NOT NULL,
    city            TEXT NOT NULL,
    postal_code     TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    phone           TEXT,
    email           TEXT,
    website         TEXT,
    kita_type       TEXT NOT NULL DEFAULT 'public' CHECK (kita_type IN ('public', 'church', 'private', 'free')),
    age_groups      TEXT[] NOT NULL DEFAULT '{}',
    concept         TEXT,
    opening_hours   TEXT,
    capacity        INT,
    osm_id          TEXT UNIQUE,
    data_source     TEXT NOT NULL DEFAULT 'osm',
    last_verified_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for radius search
CREATE INDEX IF NOT EXISTS kitas_lat_lng_idx ON kitas (lat, lng);
CREATE INDEX IF NOT EXISTS kitas_postal_code_idx ON kitas (postal_code);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    kita_id         UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
    child_id        UUID REFERENCES children(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'waiting', 'positive', 'negative')),
    cover_letter    TEXT,
    sent_at         TIMESTAMPTZ,
    response_at     TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (profile_id, kita_id)
);

CREATE INDEX IF NOT EXISTS applications_profile_id_idx ON applications (profile_id);

-- ---------------------------------------------------------------------------
-- Feed Posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    kita_id         UUID REFERENCES kitas(id) ON DELETE SET NULL,
    content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 2000),
    tag             TEXT NOT NULL DEFAULT 'experience' CHECK (tag IN ('tip', 'experience', 'availability', 'warning')),
    upvotes         INT NOT NULL DEFAULT 0,
    is_moderated    BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feed_posts_created_at_idx ON feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS feed_posts_kita_id_idx ON feed_posts (kita_id);

-- ---------------------------------------------------------------------------
-- Feed Reports (moderation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    reporter_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, reporter_profile_id)
);

-- ---------------------------------------------------------------------------
-- Subscriptions (Stripe)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_subscription_id  TEXT NOT NULL UNIQUE,
    stripe_price_id         TEXT NOT NULL,
    status                  TEXT NOT NULL,
    current_period_end      TIMESTAMPTZ NOT NULL,
    cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE children         ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;

-- Kitas are public read, admin write
ALTER TABLE kitas            ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kitas_public_read" ON kitas FOR SELECT USING (TRUE);

-- Profiles: users can only read/update their own
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- Children: own only
CREATE POLICY "children_own" ON children FOR ALL USING (auth.uid() = profile_id);

-- Applications: own only
CREATE POLICY "applications_own" ON applications FOR ALL USING (auth.uid() = profile_id);

-- Feed posts: public read (non-hidden), own write
CREATE POLICY "feed_posts_public_read" ON feed_posts FOR SELECT
    USING (is_hidden = FALSE);
CREATE POLICY "feed_posts_own_write" ON feed_posts FOR INSERT
    WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "feed_posts_own_update" ON feed_posts FOR UPDATE
    USING (auth.uid() = profile_id);
CREATE POLICY "feed_posts_own_delete" ON feed_posts FOR DELETE
    USING (auth.uid() = profile_id);

-- Feed reports: own insert
CREATE POLICY "feed_reports_own" ON feed_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_profile_id);

-- Subscriptions: own only
CREATE POLICY "subscriptions_own" ON subscriptions FOR SELECT
    USING (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- Trigger: auto-create profile on auth.users insert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: updated_at auto-update
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER kitas_updated_at
    BEFORE UPDATE ON kitas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER applications_updated_at
    BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER feed_posts_updated_at
    BEFORE UPDATE ON feed_posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
