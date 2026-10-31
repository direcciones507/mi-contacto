-- Mi Contacto: integridad territorial a nivel PostgreSQL.
-- Ejecutar únicamente en base descartable de Mi Contacto, después de 001-003.
-- NO ejecutar en Railway ni en Direcciones507 sin autorización.
BEGIN;
ALTER TABLE micontacto.geo_regions
 ADD CONSTRAINT geo_region_parent_country_fk
 FOREIGN KEY (parent_id,country_code)
 REFERENCES micontacto.geo_regions(id,country_code);
ALTER TABLE micontacto.geo_localities
 ADD CONSTRAINT geo_locality_region_identity_unique UNIQUE(id,region_id,country_code);
ALTER TABLE micontacto.profiles
 ADD CONSTRAINT profile_locality_in_selected_region_fk
 FOREIGN KEY(locality_id,region_id,country_code)
 REFERENCES micontacto.geo_localities(id,region_id,country_code);
COMMIT;
