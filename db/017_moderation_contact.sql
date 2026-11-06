BEGIN;
ALTER TABLE micontacto.accounts DROP CONSTRAINT accounts_status_check;
ALTER TABLE micontacto.accounts ADD CONSTRAINT accounts_status_check CHECK(status IN ('ACTIVE','SUSPENDED','BLOCKED'));
ALTER TABLE micontacto.reports
 ADD COLUMN investigation_state text NOT NULL DEFAULT 'CONTACT_PENDING' CHECK(investigation_state IN ('CONTACT_PENDING','WAITING','VERIFIED','UNVERIFIED','RESOLVED')),
 ADD COLUMN contacted_at timestamptz,
 ADD COLUMN response_due_at timestamptz,
 ADD COLUMN investigation_notes text NOT NULL DEFAULT '' CHECK(length(investigation_notes)<=500),
 ADD COLUMN investigation_version integer NOT NULL DEFAULT 0;
UPDATE micontacto.reports SET investigation_state='RESOLVED' WHERE state<>'OPEN';
ALTER TABLE micontacto.oauth_transactions ADD COLUMN admin_login boolean NOT NULL DEFAULT false;
COMMIT;
