-- Mi Contacto: catálogo territorial independiente. Ejecutar DESPUÉS de 001_initial.sql
-- Solo en PostgreSQL aislado de Mi Contacto. No carga datos ficticios.
BEGIN;
CREATE TABLE IF NOT EXISTS micontacto.geo_regions (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 country_code char(2) NOT NULL CHECK(country_code IN ('PA','CR','NI','SV','HN','GT','MX','CO')),
 source_id text NOT NULL,
 name text NOT NULL CHECK(length(trim(name))>0),
 admin_level smallint NOT NULL DEFAULT 1 CHECK(admin_level BETWEEN 1 AND 5),
 parent_id bigint REFERENCES micontacto.geo_regions(id),
 enabled boolean NOT NULL DEFAULT true,
 UNIQUE(country_code,source_id),
 UNIQUE(id,country_code)
);
CREATE INDEX IF NOT EXISTS geo_regions_lookup_idx ON micontacto.geo_regions(country_code,parent_id,name);
CREATE TABLE IF NOT EXISTS micontacto.geo_localities (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 country_code char(2) NOT NULL CHECK(country_code IN ('PA','CR','NI','SV','HN','GT','MX','CO')),
 region_id bigint NOT NULL,
 source_id text NOT NULL,
 name text NOT NULL CHECK(length(trim(name))>0),
 enabled boolean NOT NULL DEFAULT true,
 FOREIGN KEY(region_id,country_code) REFERENCES micontacto.geo_regions(id,country_code),
 UNIQUE(country_code,source_id)
);
CREATE INDEX IF NOT EXISTS geo_localities_lookup_idx ON micontacto.geo_localities(region_id,name);
-- La pertenencia país/región/localidad se valida en el servicio en la fase de creación.
-- Los datos del catálogo deben ser cargados mediante importación validada y versionada.
COMMIT;
