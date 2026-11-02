-- Mi Contacto: esquema inicial aislado. NO ejecutar contra Direcciones507.
-- Aplicar únicamente a una base PostgreSQL independiente de Mi Contacto.
BEGIN;
CREATE SCHEMA IF NOT EXISTS micontacto;
CREATE TABLE IF NOT EXISTS micontacto.accounts (
  id uuid PRIMARY KEY,
  google_subject text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS micontacto.profiles (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL UNIQUE REFERENCES micontacto.accounts(id),
  display_name text NOT NULL CHECK (char_length(trim(display_name)) BETWEEN 2 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 60),
  country_code char(2) NOT NULL CHECK(country_code IN ('PA','CR','NI','SV','HN','GT','MX','CO')),
  region text,
  locality text,
  profession text,
  description text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PENDING_REVIEW','ACTIVE','PAUSED','BLOCKED','DELETED')),
  latitude numeric(10,7) CHECK(latitude BETWEEN -90 AND 90),
  longitude numeric(10,7) CHECK(longitude BETWEEN -180 AND 180),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coordinates_together CHECK ((latitude IS NULL) = (longitude IS NULL))
);
-- Retener slugs de perfiles borrados; no borrarlos físicamente ni reutilizarlos.
CREATE INDEX IF NOT EXISTS profiles_directory_idx ON micontacto.profiles(country_code,region,locality) WHERE status='ACTIVE';
CREATE TABLE IF NOT EXISTS micontacto.profile_slug_reservations (
  slug text PRIMARY KEY CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  profile_id uuid NOT NULL UNIQUE REFERENCES micontacto.profiles(id),
  reserved_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
