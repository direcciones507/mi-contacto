-- Isolated Mi Contacto ledger. No production charges are supported by this release.
BEGIN;
CREATE TABLE micontacto.payment_orders(
 id uuid PRIMARY KEY,
 profile_id uuid NOT NULL REFERENCES micontacto.profiles(id) ON DELETE CASCADE,
 account_id uuid NOT NULL REFERENCES micontacto.accounts(id),
 term_id uuid NOT NULL UNIQUE REFERENCES micontacto.feature_terms(id),
 provider text NOT NULL CHECK(provider='YAPPY'),
 environment text NOT NULL CHECK(environment='test'),
 provider_order_id text NOT NULL UNIQUE,
 provider_reference text UNIQUE,
 operation_key text NOT NULL UNIQUE,
 amount_cents integer NOT NULL CHECK(amount_cents>0),
 currency text NOT NULL DEFAULT 'USD' CHECK(currency='USD'),
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PAID','FAILED','CANCELLED')),
 receipt_email text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 confirmed_at timestamptz,
 CHECK((status='PAID')=(confirmed_at IS NOT NULL))
);
CREATE UNIQUE INDEX payment_one_unsettled ON micontacto.payment_orders(profile_id) WHERE status<>'PAID';
CREATE TABLE micontacto.payment_receipts(
 order_id uuid PRIMARY KEY REFERENCES micontacto.payment_orders(id) ON DELETE CASCADE,
 state text NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','SENT','REVIEW')),
 attempts integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 first_attempt_at timestamptz,
 provider_message_id text,
 sent_at timestamptz
);
COMMIT;
