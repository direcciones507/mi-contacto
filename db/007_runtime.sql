-- Independent Mi Contacto database only; explicit migration, never on web startup.
BEGIN;
ALTER TABLE micontacto.accounts ADD COLUMN role text NOT NULL DEFAULT 'USER' CHECK(role IN ('USER','ADMIN'));
ALTER TABLE micontacto.accounts ADD COLUMN status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','SUSPENDED'));
CREATE TABLE micontacto.sessions (
 token_hash text PRIMARY KEY, account_id uuid NOT NULL REFERENCES micontacto.accounts(id),
 csrf text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiry_idx ON micontacto.sessions(expires_at);
CREATE TABLE micontacto.country_settings(code char(2) PRIMARY KEY CHECK(code IN ('PA','CR','NI','SV','HN','GT','MX','CO')),enabled boolean NOT NULL DEFAULT true);
INSERT INTO micontacto.country_settings(code) VALUES('PA'),('CR'),('NI'),('SV'),('HN'),('GT'),('MX'),('CO');
CREATE TABLE micontacto.oauth_transactions (
 state_hash text PRIMARY KEY, nonce text NOT NULL, verifier text NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE micontacto.categories (
 id uuid PRIMARY KEY, name text NOT NULL UNIQUE CHECK(length(trim(name)) BETWEEN 2 AND 100),
 enabled boolean NOT NULL DEFAULT true
);
ALTER TABLE micontacto.profiles
 ADD COLUMN category_id uuid REFERENCES micontacto.categories(id),
 ADD COLUMN phone text, ADD COLUMN whatsapp text,
 ADD COLUMN directory_consent boolean NOT NULL DEFAULT false,
 ADD COLUMN contact_consent boolean NOT NULL DEFAULT false,
 ADD COLUMN location_consent boolean NOT NULL DEFAULT false,
 ADD COLUMN version integer NOT NULL DEFAULT 1,
 ADD COLUMN review_decision text CHECK(review_decision IN ('APPROVED','REJECTED')),
 ADD COLUMN review_reason text,
 ADD COLUMN photo_verified_id uuid;
CREATE TABLE micontacto.photos (
 id uuid PRIMARY KEY, profile_id uuid NOT NULL REFERENCES micontacto.profiles(id),
 object_key text NOT NULL UNIQUE CHECK(object_key LIKE 'mi-contacto/%'),
 role text NOT NULL CHECK(role IN ('MAIN','GALLERY')),
 state text NOT NULL DEFAULT 'ACTIVE' CHECK(state IN ('ACTIVE','DELETED')),
 mime text NOT NULL CHECK(mime='image/webp'), bytes integer NOT NULL CHECK(bytes>0),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,profile_id)
);
CREATE UNIQUE INDEX photos_main_idx ON micontacto.photos(profile_id) WHERE role='MAIN' AND state='ACTIVE';
ALTER TABLE micontacto.profiles ADD CONSTRAINT photo_verified_profile_fk FOREIGN KEY(photo_verified_id,id) REFERENCES micontacto.photos(id,profile_id);
CREATE TABLE micontacto.feature_terms (
 id uuid PRIMARY KEY, profile_id uuid NOT NULL REFERENCES micontacto.profiles(id),
 days integer NOT NULL CHECK(days IN (1,5,10,15,20,25,30)),
 amount_cents integer NOT NULL,
 state text NOT NULL CHECK(state IN ('PREPARED','ACTIVE','CANCELLED')),
 starts_at timestamptz, expires_at timestamptz,
 CHECK(amount_cents=CASE days WHEN 1 THEN 169 WHEN 5 THEN 799 WHEN 10 THEN 1499 WHEN 15 THEN 2199 WHEN 20 THEN 2799 WHEN 25 THEN 3199 WHEN 30 THEN 3499 END),
 CHECK((state='PREPARED' AND starts_at IS NULL AND expires_at IS NULL) OR (starts_at IS NOT NULL AND expires_at>starts_at))
);
CREATE INDEX feature_expiry_idx ON micontacto.feature_terms(profile_id,expires_at) WHERE state='ACTIVE';
CREATE TABLE micontacto.audit (
 id uuid PRIMARY KEY, actor_id uuid NOT NULL REFERENCES micontacto.accounts(id),
 profile_id uuid REFERENCES micontacto.profiles(id), action text NOT NULL,
 reason text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE micontacto.photo_verifications (
 id uuid PRIMARY KEY, profile_id uuid NOT NULL REFERENCES micontacto.profiles(id),
 photo_id uuid NOT NULL REFERENCES micontacto.photos(id), code text NOT NULL UNIQUE,
 state text NOT NULL CHECK(state IN ('PENDING','APPROVED','REJECTED','REVOKED')),
 reviewed_by uuid REFERENCES micontacto.accounts(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX photo_verification_pending_idx ON micontacto.photo_verifications(profile_id) WHERE state='PENDING';
CREATE TABLE micontacto.reports (
 id uuid PRIMARY KEY, profile_id uuid NOT NULL REFERENCES micontacto.profiles(id),
 reporter_id uuid NOT NULL REFERENCES micontacto.accounts(id), reason text NOT NULL,
 state text NOT NULL DEFAULT 'OPEN' CHECK(state IN ('OPEN','DISMISSED','ACTIONED')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reports_open_idx ON micontacto.reports(profile_id,reporter_id) WHERE state='OPEN';
CREATE TABLE micontacto.catalog_sources (
 id text PRIMARY KEY, source_url text NOT NULL, license text NOT NULL, sha256 text NOT NULL,
 imported_at timestamptz NOT NULL DEFAULT now(), reviewed boolean NOT NULL DEFAULT false
);
CREATE FUNCTION micontacto.preserve_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'PROFILE_IDENTITY_RESERVED'; END IF;
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.account_id IS DISTINCT FROM OLD.account_id
 OR NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.slug IS DISTINCT FROM OLD.slug THEN
  RAISE EXCEPTION 'PROFILE_IDENTITY_IMMUTABLE';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER preserve_profile_identity BEFORE UPDATE OR DELETE ON micontacto.profiles
 FOR EACH ROW EXECUTE FUNCTION micontacto.preserve_identity();
COMMIT;
