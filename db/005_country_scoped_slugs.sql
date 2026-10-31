-- Mi Contacto only: allow the same personal slug in different countries.
-- Apply AFTER 001-004, in a disposable isolated database first.
BEGIN;
ALTER TABLE micontacto.profiles DROP CONSTRAINT IF EXISTS profiles_slug_key;
ALTER TABLE micontacto.profiles ADD CONSTRAINT profiles_country_slug_key UNIQUE(country_code,slug);
ALTER TABLE micontacto.profiles ADD CONSTRAINT profiles_id_country_unique UNIQUE(id,country_code);
ALTER TABLE micontacto.profile_slug_reservations ADD COLUMN country_code char(2);
UPDATE micontacto.profile_slug_reservations r SET country_code=p.country_code
FROM micontacto.profiles p WHERE r.profile_id=p.id;
ALTER TABLE micontacto.profile_slug_reservations ALTER COLUMN country_code SET NOT NULL;
ALTER TABLE micontacto.profile_slug_reservations DROP CONSTRAINT IF EXISTS profile_slug_reservations_pkey;
ALTER TABLE micontacto.profile_slug_reservations ADD CONSTRAINT profile_slug_reservations_pkey PRIMARY KEY(country_code,slug);
ALTER TABLE micontacto.profile_slug_reservations
 ADD CONSTRAINT slug_reservation_profile_country_fk FOREIGN KEY(profile_id,country_code)
 REFERENCES micontacto.profiles(id,country_code);
COMMIT;
