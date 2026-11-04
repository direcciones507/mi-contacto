BEGIN;
CREATE TABLE micontacto.legal_consents(
 account_id uuid NOT NULL REFERENCES micontacto.accounts(id),
 policy_version text NOT NULL,
 policy_digest text NOT NULL CHECK(length(policy_digest)=64),
 accepted_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(account_id,policy_version,policy_digest)
);
COMMIT;
