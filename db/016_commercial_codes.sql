BEGIN;
-- Preserve historical purchases; new orders are priced strictly by feature-policy.js.
ALTER TABLE micontacto.feature_terms DROP CONSTRAINT feature_terms_check;
ALTER TABLE micontacto.feature_terms ADD CONSTRAINT feature_terms_approved_price CHECK(
 amount_cents=CASE days WHEN 1 THEN 190 WHEN 5 THEN 890 WHEN 10 THEN 1690 WHEN 15 THEN 2450 WHEN 20 THEN 3150 WHEN 25 THEN 3590 WHEN 30 THEN 3900 END
 OR amount_cents=CASE days WHEN 1 THEN 169 WHEN 5 THEN 799 WHEN 10 THEN 1499 WHEN 15 THEN 2199 WHEN 20 THEN 2799 WHEN 25 THEN 3199 WHEN 30 THEN 3499 END);

CREATE TABLE micontacto.code_orders (
 id uuid PRIMARY KEY,account_id uuid NOT NULL REFERENCES micontacto.accounts(id),quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 100),
 unit_cents integer NOT NULL CHECK(unit_cents=190),amount_cents integer NOT NULL CHECK(amount_cents=quantity*unit_cents),currency text NOT NULL DEFAULT 'USD' CHECK(currency='USD'),
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PAID','FAILED','CANCELLED')),environment text NOT NULL CHECK(environment='test'),
 operation_key text NOT NULL UNIQUE,provider_order_id text NOT NULL UNIQUE,provider_reference text,receipt_email text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),confirmed_at timestamptz,receipt_state text NOT NULL DEFAULT 'PENDING' CHECK(receipt_state IN ('PENDING','SENT','REVIEW')),
 receipt_attempts integer NOT NULL DEFAULT 0,receipt_next_at timestamptz NOT NULL DEFAULT now(),receipt_first_at timestamptz,receipt_message_id text
);
CREATE TABLE micontacto.code_batches (
 id uuid PRIMARY KEY,actor_id uuid NOT NULL REFERENCES micontacto.accounts(id),quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 100),
 origin text NOT NULL CHECK(origin IN ('ADMIN','ONLINE')),operation_key text NOT NULL UNIQUE,order_id uuid UNIQUE REFERENCES micontacto.code_orders(id),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE micontacto.commercial_codes (
 id uuid PRIMARY KEY,batch_id uuid NOT NULL REFERENCES micontacto.code_batches(id),token_hash text NOT NULL UNIQUE,token_cipher text NOT NULL,
 days integer NOT NULL DEFAULT 1 CHECK(days=1),unit_cents integer NOT NULL DEFAULT 190 CHECK(unit_cents=190),
 state text NOT NULL DEFAULT 'AVAILABLE' CHECK(state IN ('AVAILABLE','RESERVED','SOLD','USED','VOID')),
 owner_id uuid REFERENCES micontacto.accounts(id),customer_reference text NOT NULL DEFAULT '',payment_reference text NOT NULL DEFAULT '',
 sold_at timestamptz,used_at timestamptz,used_profile_id uuid REFERENCES micontacto.profiles(id) ON DELETE SET NULL,term_id uuid UNIQUE REFERENCES micontacto.feature_terms(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),CHECK((state='USED')=(used_at IS NOT NULL))
);
CREATE TABLE micontacto.code_events (
 id uuid PRIMARY KEY,code_id uuid REFERENCES micontacto.commercial_codes(id),batch_id uuid NOT NULL REFERENCES micontacto.code_batches(id),actor_id uuid REFERENCES micontacto.accounts(id),
 action text NOT NULL,reason text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX code_order_owner_idx ON micontacto.code_orders(account_id,created_at DESC,id);
CREATE INDEX code_batch_idx ON micontacto.commercial_codes(batch_id);
CREATE INDEX code_owner_idx ON micontacto.commercial_codes(owner_id);
CREATE INDEX code_event_idx ON micontacto.code_events(batch_id,created_at);
COMMIT;
