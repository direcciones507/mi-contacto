-- One account may have one profile PER country; existing country URLs remain stable.
-- Mi Contacto isolated database only. Validate on disposable PostgreSQL first.
BEGIN;
ALTER TABLE micontacto.profiles DROP CONSTRAINT IF EXISTS profiles_account_id_key;
ALTER TABLE micontacto.profiles
 ADD CONSTRAINT profiles_account_country_key UNIQUE(account_id,country_code);
-- Preserve the independent country+slug uniqueness and historical reservations.
COMMIT;
