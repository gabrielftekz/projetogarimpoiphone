/*
  # Fix ordens_servico status constraint and migrate legacy data

  ## Problem
  The status column has a CHECK constraint that accepts legacy values like
  'Diagnóstico', 'diagnostico', 'aguardando_peca', etc. which the frontend
  never sends. OS-002 has status 'Diagnóstico' which is not handled by the
  frontend's KanbanCard component, causing potential rendering errors.

  ## Changes
  1. Update OS-002 (and any other records with legacy statuses) to valid values
  2. Drop the old CHECK constraint
  3. Add a new strict CHECK constraint with only the 4 values the frontend uses

  ## Valid statuses after migration
  - 'Aguardando Peça'
  - 'Em Andamento'
  - 'Pronto'
  - 'Entregue'
*/

-- Step 1: Migrate all legacy status values to valid ones
UPDATE ordens_servico SET status = 'Aguardando Peça'
WHERE status IN ('Diagnóstico', 'diagnostico', 'aguardando_peca');

UPDATE ordens_servico SET status = 'Em Andamento'
WHERE status = 'em_andamento';

UPDATE ordens_servico SET status = 'Pronto'
WHERE status = 'pronto';

UPDATE ordens_servico SET status = 'Entregue'
WHERE status = 'entregue';

-- Step 2: Update the default value
ALTER TABLE ordens_servico ALTER COLUMN status SET DEFAULT 'Aguardando Peça';

-- Step 3: Drop old constraint
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;

-- Step 4: Add strict constraint with only the 4 valid frontend values
ALTER TABLE ordens_servico ADD CONSTRAINT ordens_servico_status_check
  CHECK (status IN ('Aguardando Peça', 'Em Andamento', 'Pronto', 'Entregue'));
