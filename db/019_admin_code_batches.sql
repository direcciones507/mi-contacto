BEGIN;
-- ADMIN generation is independent from the unchanged purchase limit (100).
ALTER TABLE micontacto.code_batches DROP CONSTRAINT code_batches_quantity_check;
ALTER TABLE micontacto.code_batches ADD CONSTRAINT code_batches_quantity_check CHECK(quantity BETWEEN 1 AND 1000);
-- One-time authorized inventory resets retain their backup and result metadata.
CREATE TABLE micontacto.code_inventory_resets (
 id text PRIMARY KEY, completed_at timestamptz NOT NULL DEFAULT now(), report jsonb NOT NULL
);
COMMIT;
