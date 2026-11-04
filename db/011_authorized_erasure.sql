BEGIN;
CREATE TABLE micontacto.deleted_urls(url_hash text PRIMARY KEY CHECK(length(url_hash)=64));
CREATE TABLE micontacto.storage_deletions(object_key text PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE micontacto.removal_requests DROP CONSTRAINT removal_requests_state_check;
ALTER TABLE micontacto.removal_requests DROP CONSTRAINT removal_requests_check;
ALTER TABLE micontacto.removal_requests ADD CHECK(state IN ('OPEN','ACKNOWLEDGED','DELETE_APPROVED'));
ALTER TABLE micontacto.removal_requests ADD CHECK((state='OPEN' AND reviewed_at IS NULL AND reviewed_by IS NULL) OR (state IN ('ACKNOWLEDGED','DELETE_APPROVED') AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL));
ALTER TABLE micontacto.removal_requests DROP CONSTRAINT removal_requests_profile_id_fkey;
ALTER TABLE micontacto.removal_requests ADD FOREIGN KEY(profile_id) REFERENCES micontacto.profiles(id) ON DELETE CASCADE;
CREATE OR REPLACE FUNCTION micontacto.preserve_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  IF NOT EXISTS(SELECT 1 FROM micontacto.removal_requests WHERE profile_id=OLD.id AND state='DELETE_APPROVED') THEN RAISE EXCEPTION 'PROFILE_IDENTITY_RESERVED'; END IF;
  RETURN OLD;
 END IF;
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.account_id IS DISTINCT FROM OLD.account_id OR NEW.url_country IS DISTINCT FROM OLD.url_country OR NEW.slug IS DISTINCT FROM OLD.slug THEN RAISE EXCEPTION 'PROFILE_IDENTITY_IMMUTABLE'; END IF;
 RETURN NEW;
END $$;
COMMIT;
