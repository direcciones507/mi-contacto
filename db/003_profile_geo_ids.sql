-- Add geographic references to profiles in independent Mi Contacto database only.
-- Requires 001_initial.sql and 002_geography.sql. No production execution.
BEGIN;
ALTER TABLE micontacto.profiles
 ADD COLUMN IF NOT EXISTS region_id bigint,
 ADD COLUMN IF NOT EXISTS locality_id bigint;
ALTER TABLE micontacto.profiles
 ADD CONSTRAINT profile_region_country_fk FOREIGN KEY(region_id,country_code)
 REFERENCES micontacto.geo_regions(id,country_code);
ALTER TABLE micontacto.profiles
 ADD CONSTRAINT profile_locality_country_fk FOREIGN KEY(locality_id,country_code)
 REFERENCES micontacto.geo_localities(id,country_code);
ALTER TABLE micontacto.profiles
 ADD CONSTRAINT profile_locality_requires_region CHECK(locality_id IS NULL OR region_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS profiles_directory_ids_idx
 ON micontacto.profiles(country_code,region_id,locality_id)
 WHERE status='ACTIVE';
COMMIT;
