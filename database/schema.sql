-- PETVIA schema (PostgreSQL)
-- Execute no Postgres Client (psql) dentro do banco petvia

CREATE TABLE IF NOT EXISTS pet_reports (
  id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL,            -- 'found' ou 'lost'
  animal_type TEXT NOT NULL,            -- 'cachorro' ou 'gato'
  cidade TEXT,
  whatsapp TEXT,
  observacao TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  gps_accuracy DOUBLE PRECISION,
  photo_files JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{filename,url,originalname,mimetype,size}]
  photo_hashes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- hashes perceptuais 64-bit hex (16 chars)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_reports_type_animal_created
  ON pet_reports (report_type, animal_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pet_reports_cidade
  ON pet_reports (cidade);

-- (Opcional) se você quiser restringir valores:
-- ALTER TABLE pet_reports ADD CONSTRAINT chk_report_type CHECK (report_type IN ('found','lost'));
-- ALTER TABLE pet_reports ADD CONSTRAINT chk_animal_type CHECK (animal_type IN ('cachorro','gato'));
