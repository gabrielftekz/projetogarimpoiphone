-- 1. Criar função que lê o role do usuário atual sem passar por RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.perfis WHERE id = auth.uid();
$$;

-- 2. Recriar TODAS as policies que usavam a subquery problemática
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Perfis: usuario ve o proprio ou admin ve todos" ON perfis;';
  EXECUTE 'CREATE POLICY "Perfis: usuario ve o proprio ou admin ve todos" ON perfis FOR SELECT TO authenticated USING (auth.uid() = id OR public.get_my_role() = ''admin'');';
EXCEPTION WHEN others THEN NULL; END $$;

-- Aparelhos
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Aparelhos: admin insere" ON aparelhos;';
  EXECUTE 'CREATE POLICY "Aparelhos: admin insere" ON aparelhos FOR INSERT TO authenticated WITH CHECK (public.get_my_role() = ''admin'');';

  EXECUTE 'DROP POLICY IF EXISTS "Aparelhos: admin atualiza" ON aparelhos;';
  EXECUTE 'CREATE POLICY "Aparelhos: admin atualiza" ON aparelhos FOR UPDATE TO authenticated USING (public.get_my_role() = ''admin'') WITH CHECK (public.get_my_role() = ''admin'');';

  EXECUTE 'DROP POLICY IF EXISTS "Aparelhos: admin deleta" ON aparelhos;';
  EXECUTE 'CREATE POLICY "Aparelhos: admin deleta" ON aparelhos FOR DELETE TO authenticated USING (public.get_my_role() = ''admin'');';
EXCEPTION WHEN others THEN NULL; END $$;

-- Ordens de Servico
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "OS: vendedor ve as proprias ou admin ve todas" ON ordens_servico;';
  EXECUTE 'CREATE POLICY "OS: vendedor ve as proprias ou admin ve todas" ON ordens_servico FOR SELECT TO authenticated USING (vendedor_id = auth.uid() OR vendedor_id IS NULL OR public.get_my_role() = ''admin'');';
  
  EXECUTE 'DROP POLICY IF EXISTS "OS: vendedor atualiza a propria ou admin" ON ordens_servico;';
  EXECUTE 'CREATE POLICY "OS: vendedor atualiza a propria ou admin" ON ordens_servico FOR UPDATE TO authenticated USING (vendedor_id = auth.uid() OR vendedor_id IS NULL OR public.get_my_role() = ''admin'') WITH CHECK (vendedor_id = auth.uid() OR vendedor_id IS NULL OR public.get_my_role() = ''admin'');';

  EXECUTE 'DROP POLICY IF EXISTS "OS: admin deleta" ON ordens_servico;';
  EXECUTE 'CREATE POLICY "OS: admin deleta" ON ordens_servico FOR DELETE TO authenticated USING (public.get_my_role() = ''admin'');';
EXCEPTION WHEN others THEN NULL; END $$;

-- Vendas
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Vendas: vendedor ve as proprias ou admin ve todas" ON vendas;';
  EXECUTE 'CREATE POLICY "Vendas: vendedor ve as proprias ou admin ve todas" ON vendas FOR SELECT TO authenticated USING (vendedor_id = auth.uid() OR public.get_my_role() = ''admin'');';

  EXECUTE 'DROP POLICY IF EXISTS "Vendas: admin atualiza" ON vendas;';
  EXECUTE 'CREATE POLICY "Vendas: admin atualiza" ON vendas FOR UPDATE TO authenticated USING (public.get_my_role() = ''admin'') WITH CHECK (public.get_my_role() = ''admin'');';
EXCEPTION WHEN others THEN NULL; END $$;
