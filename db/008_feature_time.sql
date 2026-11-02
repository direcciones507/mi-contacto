-- Local migration; no provider, scheduler, payment or notification is enabled.
BEGIN;
ALTER TABLE micontacto.feature_terms DROP CONSTRAINT feature_terms_state_check;
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='micontacto.feature_terms'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%starts_at%' LOOP
  EXECUTE format('ALTER TABLE micontacto.feature_terms DROP CONSTRAINT %I',c.conname);
 END LOOP;
END $$;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM micontacto.profiles WHERE status='PAUSED') THEN RAISE EXCEPTION 'MIGRATION_REQUIRES_LEGACY_PAUSE_REVIEW'; END IF;
 IF EXISTS(SELECT 1 FROM micontacto.feature_terms WHERE state='ACTIVE' AND starts_at>clock_timestamp()) THEN RAISE EXCEPTION 'MIGRATION_REQUIRES_FUTURE_ACTIVATION_REVIEW'; END IF;
END $$;
ALTER TABLE micontacto.feature_terms
 ADD COLUMN remaining_ms bigint,
 ADD COLUMN anchor_at timestamptz,
 ADD COLUMN observed_at timestamptz,
 ADD COLUMN confirmation_key text UNIQUE;
-- Preserve old windows: never reset already consumed time, never grant more than bought.
UPDATE micontacto.feature_terms SET
 remaining_ms=CASE WHEN state='PREPARED' THEN days::bigint*86400000 ELSE least(days::bigint*86400000,greatest(0,floor(extract(epoch FROM (expires_at-date_trunc('milliseconds',clock_timestamp())))*1000)::bigint)) END,
 anchor_at=CASE WHEN state='ACTIVE' THEN date_trunc('milliseconds',clock_timestamp()) END,
 observed_at=date_trunc('milliseconds',clock_timestamp());
UPDATE micontacto.feature_terms SET state='EXPIRED',anchor_at=NULL WHERE state='ACTIVE' AND remaining_ms=0;
ALTER TABLE micontacto.feature_terms ALTER COLUMN remaining_ms SET NOT NULL;
ALTER TABLE micontacto.feature_terms ADD CONSTRAINT feature_timer_state CHECK(state IN ('PREPARED','ACTIVE','PAUSED','EXPIRED','CANCELLED'));
ALTER TABLE micontacto.feature_terms ADD CONSTRAINT feature_timer_balance CHECK(remaining_ms BETWEEN 0 AND days::bigint*86400000);
ALTER TABLE micontacto.feature_terms ADD CONSTRAINT feature_timer_anchor CHECK((state='ACTIVE')=(anchor_at IS NOT NULL));
ALTER TABLE micontacto.feature_terms ADD CONSTRAINT feature_timer_dates CHECK(state NOT IN ('ACTIVE','PAUSED','EXPIRED') OR starts_at IS NOT NULL);
ALTER TABLE micontacto.feature_terms ADD CONSTRAINT feature_timer_zero CHECK(state<>'EXPIRED' OR remaining_ms=0);
-- Fail visibly on legacy overlapping active purchases; owner decision required, no silent cancellation.
CREATE UNIQUE INDEX feature_one_running_idx ON micontacto.feature_terms(profile_id) WHERE state IN ('ACTIVE','PAUSED');
CREATE TABLE micontacto.feature_clock(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),high_water timestamptz NOT NULL);
INSERT INTO micontacto.feature_clock VALUES(true,date_trunc('milliseconds',clock_timestamp()));
-- Persist a high-water mark so backwards wall-clock adjustments cannot restore consumed time.
CREATE FUNCTION micontacto.feature_now() RETURNS timestamptz LANGUAGE sql VOLATILE AS $$
 UPDATE micontacto.feature_clock SET high_water=greatest(high_water,date_trunc('milliseconds',clock_timestamp())) WHERE singleton RETURNING high_water
$$;
CREATE FUNCTION micontacto.feature_remaining(f micontacto.feature_terms, at_time timestamptz) RETURNS bigint LANGUAGE sql IMMUTABLE AS $$
 SELECT greatest(0,f.remaining_ms-CASE WHEN f.state='ACTIVE' THEN greatest(0,floor(extract(epoch FROM (greatest(at_time,f.observed_at)-f.anchor_at))*1000)::bigint) ELSE 0 END)
$$;
CREATE TABLE micontacto.feature_events(
 id uuid PRIMARY KEY, term_id uuid NOT NULL REFERENCES micontacto.feature_terms(id),
 actor_id uuid NOT NULL REFERENCES micontacto.accounts(id), action text NOT NULL,
 remaining_ms bigint NOT NULL CHECK(remaining_ms>=0), happened_at timestamptz NOT NULL, reason text NOT NULL DEFAULT ''
);
COMMIT;
