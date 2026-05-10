-- =============================================================================
-- KitaRadar — Kita Enrichment Cache
-- Version: 004
-- Caches enriched Kita data from Google Places, Wikidata, community reviews
-- =============================================================================

SET search_path TO "kitaradar-dev";

-- Enrichment cache table
CREATE TABLE IF NOT EXISTS kita_enrichments (
  osm_id            TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  google_place_id   TEXT,
  google_rating     NUMERIC(2,1),
  google_ratings_count INTEGER DEFAULT 0,
  google_photo_refs TEXT[],          -- Array of Google photo references
  google_reviews    JSONB,           -- Array of {author, rating, text, time}
  wikidata_id       TEXT,
  wikidata_desc     TEXT,
  website           TEXT,
  phone             TEXT,
  opening_hours     TEXT,
  enriched_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community reviews (from Kita parents in the app)
CREATE TABLE IF NOT EXISTS kita_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_id        TEXT NOT NULL,
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kita_reviews_osm_id ON kita_reviews(osm_id);
CREATE INDEX IF NOT EXISTS idx_kita_reviews_profile ON kita_reviews(profile_id);

-- RLS
ALTER TABLE kita_enrichments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kita_reviews ENABLE ROW LEVEL SECURITY;

-- Enrichments: readable by all authenticated users, writable by server (service_role)
DO $$ BEGIN
  CREATE POLICY "enrichments_read" ON kita_enrichments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reviews: readable by all, write own only
DO $$ BEGIN
  CREATE POLICY "reviews_read" ON kita_reviews FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "reviews_insert_own" ON kita_reviews FOR INSERT WITH CHECK (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "reviews_update_own" ON kita_reviews FOR UPDATE USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "reviews_delete_own" ON kita_reviews FOR DELETE USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
