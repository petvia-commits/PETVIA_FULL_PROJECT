CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- USERS (com role admin/user)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  whatsapp TEXT,
  uf CHAR(2),
  city_id INTEGER,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Se a tabela já existia sem coluna role, adiciona:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='users' AND column_name='role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS br_ufs (
  uf CHAR(2) PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS br_cities (
  id INTEGER PRIMARY KEY,
  uf CHAR(2) NOT NULL REFERENCES br_ufs(uf) ON UPDATE CASCADE ON DELETE RESTRICT,
  name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_br_cities_uf_name ON br_cities (uf, name);

-- REPORTS
CREATE TABLE IF NOT EXISTS pet_reports (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  animal_type TEXT NOT NULL,
  uf CHAR(2),
  city_id INTEGER REFERENCES br_cities(id) ON DELETE RESTRICT,
  cidade TEXT,
  whatsapp TEXT,
  observacao TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  gps_accuracy DOUBLE PRECISION,
  photo_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  photo_hashes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_reports_type_animal_created
  ON pet_reports (report_type, animal_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pet_reports_city
  ON pet_reports (city_id);

CREATE INDEX IF NOT EXISTS idx_pet_reports_user
  ON pet_reports (user_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_report_type') THEN
    ALTER TABLE pet_reports ADD CONSTRAINT chk_report_type CHECK (report_type IN ('found','lost'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_animal_type') THEN
    ALTER TABLE pet_reports ADD CONSTRAINT chk_animal_type CHECK (animal_type IN ('cachorro','gato'));
  END IF;
END $$;

COMMIT;
