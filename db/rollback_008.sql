-- Refuse destructive downgrade once timer records exist; preserve/export them instead.
BEGIN;
SET LOCAL lock_timeout='5s';
LOCK TABLE micontacto.feature_terms,micontacto.feature_events,micontacto.feature_clock IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM micontacto.feature_terms) OR EXISTS(SELECT 1 FROM micontacto.feature_events) THEN
 RAISE EXCEPTION 'ROLLBACK_REQUIRES_DATA_PRESERVATION'; END IF;
END $$;
DROP TABLE micontacto.feature_events;
DROP FUNCTION micontacto.feature_remaining(micontacto.feature_terms,timestamptz);
DROP FUNCTION micontacto.feature_now();
DROP TABLE micontacto.feature_clock;
DROP INDEX micontacto.feature_one_running_idx;
ALTER TABLE micontacto.feature_terms DROP CONSTRAINT feature_timer_state,DROP CONSTRAINT feature_timer_balance,DROP CONSTRAINT feature_timer_anchor,DROP CONSTRAINT feature_timer_dates,DROP CONSTRAINT feature_timer_zero;
ALTER TABLE micontacto.feature_terms DROP COLUMN remaining_ms,DROP COLUMN anchor_at,DROP COLUMN observed_at,DROP COLUMN confirmation_key;
ALTER TABLE micontacto.feature_terms ADD CONSTRAINT feature_terms_state_check CHECK(state IN ('PREPARED','ACTIVE','CANCELLED'));
ALTER TABLE micontacto.feature_terms ADD CONSTRAINT feature_terms_dates_check CHECK((state='PREPARED' AND starts_at IS NULL AND expires_at IS NULL) OR (starts_at IS NOT NULL AND expires_at>starts_at));
COMMIT;
