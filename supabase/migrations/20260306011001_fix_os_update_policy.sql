/*
  # Fix OS Update RLS Policy

  The previous UPDATE policy's WITH CHECK clause required vendedor_id = auth.uid(),
  but OS records created with vendedor_id = NULL could not be updated by any authenticated
  user except admins. This migration relaxes the WITH CHECK to match the USING clause,
  allowing updates on records where vendedor_id is NULL.
*/

DROP POLICY IF EXISTS "OS: vendedor atualiza a propria ou admin" ON ordens_servico;

CREATE POLICY "OS: vendedor atualiza a propria ou admin"
  ON ordens_servico FOR UPDATE
  TO authenticated
  USING (
    vendedor_id = auth.uid() OR
    vendedor_id IS NULL OR
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    vendedor_id = auth.uid() OR
    vendedor_id IS NULL OR
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  );
