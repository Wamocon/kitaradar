-- =============================================================================
-- KitaRadar — Erweiterte Elternprofil-Felder für KI-Unterstützung
-- Version: 005
-- Neue Felder für KI-gestützte Suche und Bewerbungsgenerierung
-- =============================================================================

SET search_path TO "kitaradar-dev";

-- Erweiterte Profilfelder für Eltern
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS job_title              TEXT,
  ADD COLUMN IF NOT EXISTS employer               TEXT,
  ADD COLUMN IF NOT EXISTS work_district          TEXT,     -- Stadtteil/Ort der Arbeitsstelle (für Kita-Lage-Optimierung)
  ADD COLUMN IF NOT EXISTS work_hours_type        TEXT,     -- full_time, part_time, flex, shift
  ADD COLUMN IF NOT EXISTS work_start_time        TEXT,     -- z.B. "08:00"
  ADD COLUMN IF NOT EXISTS work_end_time          TEXT,     -- z.B. "17:00"
  ADD COLUMN IF NOT EXISTS family_situation       TEXT,     -- two_parent, single_parent, shared_custody
  ADD COLUMN IF NOT EXISTS home_language          TEXT,     -- Hauptsprache zuhause
  ADD COLUMN IF NOT EXISTS additional_languages   TEXT,     -- weitere Sprachen (kommagetrennt)
  ADD COLUMN IF NOT EXISTS max_monthly_fee        INTEGER,  -- Max. monatlicher Kita-Beitrag in EUR
  ADD COLUMN IF NOT EXISTS kita_needed_from       DATE,     -- Gewünschter Betreuungsbeginn
  ADD COLUMN IF NOT EXISTS ai_consent             BOOLEAN   NOT NULL DEFAULT FALSE,  -- DSGVO-Einwilligung KI-Verarbeitung
  ADD COLUMN IF NOT EXISTS ai_consent_at          TIMESTAMPTZ,                       -- Zeitstempel der Einwilligung
  ADD COLUMN IF NOT EXISTS preferred_pedagogy     TEXT,
  ADD COLUMN IF NOT EXISTS preferred_kita_type    TEXT,
  ADD COLUMN IF NOT EXISTS preferred_languages    TEXT,
  ADD COLUMN IF NOT EXISTS preferred_hours        TEXT;

-- Index für häufige Abfragen
CREATE INDEX IF NOT EXISTS idx_profiles_family_situation ON profiles(family_situation);
CREATE INDEX IF NOT EXISTS idx_profiles_ai_consent ON profiles(ai_consent);
