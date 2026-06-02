-- Phase 1 Migration: Dog Passport + Multi-photo support
-- Run in Supabase SQL editor AFTER initial schema.sql

-- ── New columns on dogs table ──────────────────────────────────────────
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS passport_id TEXT UNIQUE;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS sterilized BOOLEAN DEFAULT false;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS temperament TEXT;  -- friendly/shy/aggressive/unknown
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dogs_updated_at ON dogs;
CREATE TRIGGER dogs_updated_at BEFORE UPDATE ON dogs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Auto-generate passport_id from dog_id (e.g. SD-001 -> PT-SD001)
CREATE OR REPLACE FUNCTION set_passport_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.passport_id IS NULL AND NEW.dog_id IS NOT NULL THEN
    NEW.passport_id := 'PT-' || REPLACE(NEW.dog_id, '-', '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_dog_passport_id ON dogs;
CREATE TRIGGER before_dog_passport_id BEFORE INSERT ON dogs
  FOR EACH ROW EXECUTE PROCEDURE set_passport_id();

-- Backfill passport_id for existing dogs
UPDATE dogs SET passport_id = 'PT-' || REPLACE(dog_id, '-', '')
WHERE passport_id IS NULL AND dog_id IS NOT NULL;

-- ── Multi-photo support ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dog_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  angle TEXT,  -- front/left/right/back/face
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dog_photos_dog_id_idx ON dog_photos(dog_id);

-- RLS for dog_photos
ALTER TABLE dog_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dog photos readable by all" ON dog_photos FOR SELECT USING (true);
CREATE POLICY "Authenticated users insert dog photos" ON dog_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── Indexes for new columns ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS dogs_passport_id_idx ON dogs(passport_id);
CREATE INDEX IF NOT EXISTS dogs_status_idx ON dogs(status);
CREATE INDEX IF NOT EXISTS dogs_report_type_idx ON dogs(report_type);
