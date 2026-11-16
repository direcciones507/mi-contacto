-- Mi Contacto: permitir múltiples publicaciones independientes por cuenta.
-- Ejecutar SOLO tras respaldo y pruebas en base aislada; no modifica perfiles existentes.
-- La unicidad de la URL (url_country, slug) y sus reservas permanecen intactas.
BEGIN;
ALTER TABLE micontacto.profiles DROP CONSTRAINT IF EXISTS profiles_account_id_key;
ALTER TABLE micontacto.profiles DROP CONSTRAINT IF EXISTS profiles_account_country_key;
CREATE INDEX IF NOT EXISTS profiles_account_publications_idx
  ON micontacto.profiles(account_id, created_at DESC);
COMMIT;
