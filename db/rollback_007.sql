-- Mi Contacto only. Pre-activation rollback, refuses existing runtime records.
-- Manual operation for disposable/reviewed environments; never called by web startup.
BEGIN;
SET LOCAL lock_timeout='5s';
LOCK TABLE micontacto.accounts,micontacto.profiles,micontacto.sessions,micontacto.oauth_transactions,micontacto.photos,micontacto.categories,micontacto.feature_terms,micontacto.audit,micontacto.photo_verifications,micontacto.reports,micontacto.catalog_sources,micontacto.country_settings IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM micontacto.sessions) OR EXISTS(SELECT 1 FROM micontacto.oauth_transactions)
 OR EXISTS(SELECT 1 FROM micontacto.photos) OR EXISTS(SELECT 1 FROM micontacto.categories)
 OR EXISTS(SELECT 1 FROM micontacto.feature_terms) OR EXISTS(SELECT 1 FROM micontacto.audit)
 OR EXISTS(SELECT 1 FROM micontacto.photo_verifications) OR EXISTS(SELECT 1 FROM micontacto.reports)
 OR EXISTS(SELECT 1 FROM micontacto.catalog_sources) OR EXISTS(SELECT 1 FROM micontacto.country_settings WHERE NOT enabled)
 OR EXISTS(SELECT 1 FROM micontacto.accounts WHERE role<>'USER' OR status<>'ACTIVE')
 OR EXISTS(SELECT 1 FROM micontacto.profiles WHERE category_id IS NOT NULL OR phone IS NOT NULL OR whatsapp IS NOT NULL OR directory_consent OR contact_consent OR location_consent OR version<>1 OR review_decision IS NOT NULL OR review_reason IS NOT NULL OR photo_verified_id IS NOT NULL)
 THEN RAISE EXCEPTION 'ROLLBACK_REQUIRES_DATA_PRESERVATION'; END IF;
END $$;
DROP TRIGGER preserve_profile_identity ON micontacto.profiles;
DROP FUNCTION micontacto.preserve_identity();
DROP TABLE micontacto.photo_verifications,micontacto.reports,micontacto.audit,micontacto.feature_terms,micontacto.sessions,micontacto.oauth_transactions,micontacto.catalog_sources,micontacto.country_settings;
ALTER TABLE micontacto.profiles DROP CONSTRAINT photo_verified_profile_fk;
DROP TABLE micontacto.photos;
ALTER TABLE micontacto.profiles DROP COLUMN category_id,DROP COLUMN phone,DROP COLUMN whatsapp,DROP COLUMN directory_consent,DROP COLUMN contact_consent,DROP COLUMN location_consent,DROP COLUMN version,DROP COLUMN review_decision,DROP COLUMN review_reason,DROP COLUMN photo_verified_id;
DROP TABLE micontacto.categories;
ALTER TABLE micontacto.accounts DROP COLUMN role,DROP COLUMN status;
COMMIT;
