BEGIN;
-- Track only newly attempted uploads; no scan or migration of historical files.
CREATE TABLE micontacto.photo_upload_intents (
 object_key text PRIMARY KEY,
 profile_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT (now()+interval '1 hour')
);
CREATE INDEX photo_upload_intents_expiry ON micontacto.photo_upload_intents(expires_at);
ALTER TABLE micontacto.storage_deletions ADD COLUMN attempts integer NOT NULL DEFAULT 0;
ALTER TABLE micontacto.storage_deletions ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX storage_deletions_due ON micontacto.storage_deletions(next_attempt_at,created_at);
-- Stable gallery positions; preserve every active reference and assign its current order.
ALTER TABLE micontacto.photos ADD COLUMN gallery_position smallint CHECK(gallery_position BETWEEN 1 AND 4);
WITH ranked AS (SELECT id,row_number() OVER(PARTITION BY profile_id ORDER BY created_at,id) AS position FROM micontacto.photos WHERE role='GALLERY' AND state='ACTIVE') UPDATE micontacto.photos p SET gallery_position=r.position FROM ranked r WHERE p.id=r.id;
CREATE UNIQUE INDEX photos_gallery_position_idx ON micontacto.photos(profile_id,gallery_position) WHERE role='GALLERY' AND state='ACTIVE';
COMMIT;
