-- Optional free-text location reference for an existing personal profile.
ALTER TABLE micontacto.profiles ADD COLUMN IF NOT EXISTS location_reference varchar(250);
