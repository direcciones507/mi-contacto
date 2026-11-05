BEGIN;
ALTER TABLE micontacto.legal_consents ADD COLUMN declarations jsonb NOT NULL DEFAULT '{}';
ALTER TABLE micontacto.reports ALTER COLUMN reporter_id DROP NOT NULL;
ALTER TABLE micontacto.reports ADD COLUMN category text NOT NULL DEFAULT 'OTHER', ADD COLUMN evidence text NOT NULL DEFAULT '', ADD COLUMN reporter_key text, ADD COLUMN reviewed_at timestamptz, ADD COLUMN reviewed_by uuid REFERENCES micontacto.accounts(id);
CREATE INDEX reports_abuse_idx ON micontacto.reports(reporter_key,created_at);
ALTER TABLE micontacto.profiles ADD COLUMN moderation_restricted boolean NOT NULL DEFAULT false, ADD COLUMN sensitive_hold boolean NOT NULL DEFAULT false;
CREATE TABLE micontacto.moderation_events (
 id uuid PRIMARY KEY, profile_id uuid REFERENCES micontacto.profiles(id) ON DELETE SET NULL,
 report_id uuid REFERENCES micontacto.reports(id) ON DELETE SET NULL,
 actor_id uuid NOT NULL REFERENCES micontacto.accounts(id), action text NOT NULL,
 reason text NOT NULL CHECK(length(reason) BETWEEN 3 AND 500), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE micontacto.appeals (
 id uuid PRIMARY KEY, profile_id uuid NOT NULL REFERENCES micontacto.profiles(id) ON DELETE CASCADE,
 account_id uuid NOT NULL REFERENCES micontacto.accounts(id), reason text NOT NULL CHECK(length(reason) BETWEEN 3 AND 1000),
 state text NOT NULL DEFAULT 'OPEN' CHECK(state IN ('OPEN','ACCEPTED','REJECTED')), created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz, reviewed_by uuid REFERENCES micontacto.accounts(id), decision text
);
CREATE UNIQUE INDEX appeals_open_idx ON micontacto.appeals(profile_id) WHERE state='OPEN';
COMMIT;
