BEGIN;
-- Stop for explicit reconciliation; never choose or delete an existing duplicate.
DO $$ BEGIN IF EXISTS(SELECT 1 FROM micontacto.profiles GROUP BY account_id HAVING count(*)>1) THEN RAISE EXCEPTION 'ACCOUNT_DUPLICATES_REQUIRE_RECONCILIATION'; END IF; END $$;
ALTER TABLE micontacto.profiles ADD CONSTRAINT profiles_account_id_key UNIQUE(account_id);
ALTER TABLE micontacto.profiles ADD COLUMN url_country char(2);
UPDATE micontacto.profiles SET url_country=country_code;
ALTER TABLE micontacto.profiles ALTER COLUMN url_country SET NOT NULL;
ALTER TABLE micontacto.profiles ADD COLUMN maps_url text;
ALTER TABLE micontacto.profiles DROP CONSTRAINT profiles_country_slug_key;
ALTER TABLE micontacto.profiles ADD CONSTRAINT profiles_country_slug_key UNIQUE(url_country,slug);
CREATE FUNCTION micontacto.assign_url_country() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.url_country=NEW.country_code; RETURN NEW; END $$;
CREATE TRIGGER assign_profile_url_country BEFORE INSERT ON micontacto.profiles FOR EACH ROW EXECUTE FUNCTION micontacto.assign_url_country();
ALTER TABLE micontacto.profile_slug_reservations DROP CONSTRAINT slug_reservation_profile_country_fk;
CREATE OR REPLACE FUNCTION micontacto.preserve_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'PROFILE_IDENTITY_RESERVED'; END IF;
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.account_id IS DISTINCT FROM OLD.account_id OR NEW.url_country IS DISTINCT FROM OLD.url_country OR NEW.slug IS DISTINCT FROM OLD.slug THEN RAISE EXCEPTION 'PROFILE_IDENTITY_IMMUTABLE'; END IF;
 RETURN NEW;
END $$;
COMMIT;
