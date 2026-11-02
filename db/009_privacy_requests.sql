BEGIN;
ALTER TABLE micontacto.profiles ADD COLUMN privacy_hidden boolean NOT NULL DEFAULT false;
CREATE TABLE micontacto.removal_requests(
 id uuid PRIMARY KEY,
 profile_id uuid NOT NULL UNIQUE REFERENCES micontacto.profiles(id),
 state text NOT NULL DEFAULT 'OPEN' CHECK(state IN ('OPEN','ACKNOWLEDGED')),
 requested_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 reviewed_by uuid REFERENCES micontacto.accounts(id),
 CHECK((state='OPEN' AND reviewed_at IS NULL AND reviewed_by IS NULL) OR (state='ACKNOWLEDGED' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL))
);
-- No purge job, delete endpoint, retention deadline or automatic publication.
COMMIT;
