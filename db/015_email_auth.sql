BEGIN;
-- Additive: existing Google identities, profiles and sessions are preserved.
ALTER TABLE micontacto.accounts ALTER COLUMN google_subject DROP NOT NULL;
CREATE TABLE micontacto.email_identities (
 account_id uuid PRIMARY KEY REFERENCES micontacto.accounts(id),
 email text NOT NULL UNIQUE CHECK(email=lower(email) AND char_length(email)<=254),
 password_hash text NOT NULL,
 verified_at timestamptz NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE micontacto.auth_email_tokens (
 token_hash text PRIMARY KEY,
 purpose text NOT NULL CHECK(purpose IN ('REGISTER','LINK','RESET')),
 email text NOT NULL,
 account_id uuid REFERENCES micontacto.accounts(id),
 password_hash text,
 session_hash text,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_email_tokens_expiry ON micontacto.auth_email_tokens(expires_at);
CREATE TABLE micontacto.auth_rate_limits (
 bucket text PRIMARY KEY, attempts integer NOT NULL, expires_at timestamptz NOT NULL
);
ALTER TABLE micontacto.oauth_transactions ADD COLUMN link_account_id uuid REFERENCES micontacto.accounts(id);
ALTER TABLE micontacto.oauth_transactions ADD COLUMN link_session_hash text;
COMMIT;
