-- Phase 2 Migration: Database Hardening
-- Run in Supabase SQL editor AFTER migration_phase1.sql

-- ── dog_id sequence (race-safe replacement for count-based trigger) ────
CREATE SEQUENCE IF NOT EXISTS dog_id_seq START 1;

-- Set sequence to current max to avoid collisions with existing data
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(dog_id, '[^0-9]', '', 'g'), '')::INTEGER), 0)
    INTO max_num FROM dogs WHERE dog_id IS NOT NULL;
  PERFORM setval('dog_id_seq', GREATEST(max_num, 1));
END $$;

-- Replace count-based dog_id generation with sequence-based
CREATE OR REPLACE FUNCTION set_dog_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dog_id IS NULL THEN
    NEW.dog_id := 'SD-' || lpad(nextval('dog_id_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── CHECK constraints ─────────────────────────────────────────────────
ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_status_check;
ALTER TABLE dogs ADD CONSTRAINT dogs_status_check
  CHECK (status IN ('sighted', 'being_rescued', 'in_shelter', 'reunited'));

ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_report_type_check;
ALTER TABLE dogs ADD CONSTRAINT dogs_report_type_check
  CHECK (report_type IN ('stray', 'lost_pet'));

ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_size_check;
ALTER TABLE dogs ADD CONSTRAINT dogs_size_check
  CHECK (size IN ('small', 'medium', 'large'));

ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_sex_check;
ALTER TABLE dogs ADD CONSTRAINT dogs_sex_check
  CHECK (sex IN ('male', 'female', 'unknown'));

ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_confidence_range;
ALTER TABLE dogs ADD CONSTRAINT dogs_confidence_range
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100));

ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_breed_confidence_range;
ALTER TABLE dogs ADD CONSTRAINT dogs_breed_confidence_range
  CHECK (breed_confidence IS NULL OR (breed_confidence >= 0 AND breed_confidence <= 100));

ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_lat_range;
ALTER TABLE dogs ADD CONSTRAINT dogs_lat_range
  CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90));

ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_lng_range;
ALTER TABLE dogs ADD CONSTRAINT dogs_lng_range
  CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180));

-- ── Additional indexes for query patterns ─────────────────────────────
CREATE INDEX IF NOT EXISTS dogs_size_idx ON dogs(size);
CREATE INDEX IF NOT EXISTS dogs_injured_idx ON dogs(injured) WHERE injured = true;
CREATE INDEX IF NOT EXISTS dogs_lat_lng_idx ON dogs(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS dogs_reporter_id_idx ON dogs(reporter_id);
CREATE INDEX IF NOT EXISTS dogs_feature_vector_exists_idx ON dogs(dog_id) WHERE feature_vector IS NOT NULL;

-- ── NOT NULL where semantically required ──────────────────────────────
-- breed and color should always be set (at least "unknown")
UPDATE dogs SET breed = 'Unknown' WHERE breed IS NULL;
UPDATE dogs SET color = 'unknown' WHERE color IS NULL;
UPDATE dogs SET size = 'medium' WHERE size IS NULL;

ALTER TABLE dogs ALTER COLUMN breed SET DEFAULT 'Unknown';
ALTER TABLE dogs ALTER COLUMN color SET DEFAULT 'unknown';
ALTER TABLE dogs ALTER COLUMN size SET DEFAULT 'medium';

-- ── Profiles hardening ────────────────────────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_unique;
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

CREATE INDEX IF NOT EXISTS profiles_city_idx ON profiles(city);
