-- =============================================================================
-- KitaRadar — Erweiterte Kinder-Tabelle
-- Version: 006
-- Ersetzt date_of_birth (DATE NOT NULL) durch birth_year + birth_month (optional)
-- Fügt special_needs hinzu (freier Text für besondere Bedürfnisse)
-- =============================================================================

SET search_path TO "kitaradar-dev";

-- date_of_birth nullable machen (bestehende Zeilen bleiben erhalten)
ALTER TABLE children
  ALTER COLUMN date_of_birth DROP NOT NULL;

-- Neue Spalten hinzufügen (falls noch nicht vorhanden)
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS birth_year    INTEGER CHECK (birth_year BETWEEN 2010 AND 2030),
  ADD COLUMN IF NOT EXISTS birth_month   INTEGER CHECK (birth_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS special_needs TEXT;

-- Vorhandene date_of_birth-Werte in year/month umwandeln
UPDATE children
SET
  birth_year  = EXTRACT(YEAR  FROM date_of_birth)::INTEGER,
  birth_month = EXTRACT(MONTH FROM date_of_birth)::INTEGER
WHERE date_of_birth IS NOT NULL
  AND birth_year IS NULL;
