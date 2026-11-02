BEGIN;
SET LOCAL lock_timeout='5s';
LOCK TABLE micontacto.profiles,micontacto.removal_requests IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM micontacto.removal_requests) OR EXISTS(SELECT 1 FROM micontacto.profiles WHERE privacy_hidden) THEN
 RAISE EXCEPTION 'ROLLBACK_REQUIRES_DATA_PRESERVATION'; END IF;
END $$;
DROP TABLE micontacto.removal_requests;
ALTER TABLE micontacto.profiles DROP COLUMN privacy_hidden;
COMMIT;
