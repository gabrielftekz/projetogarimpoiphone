/*
  # Corrigir Recursão Infinita nas Policies RLS

  ## Problema
  As policies de SELECT da tabela `perfis` e de `ordens_servico` usam subqueries
  como `(SELECT role FROM perfis WHERE id = auth.uid())` para verificar se o usuário
  é admin. Isso cria um loop recursivo:
  - A policy de `perfis` precisa ler `perfis` para se avaliar
  - O PostgreSQL detecta o loop e retorna erro
  - Esse erro cascateia para as policies de `ordens_servico` que dependem da mesma subquery

  ## Solução
  1. Criar uma função `get_my_role()` com SECURITY DEFINER
     - Executa com privilégios do owner (bypassando RLS)
     - Quebra a recursão ao ler `perfis` sem passar pela policy
  2. Substituir todas as subqueries diretas em `perfis` pela chamada à função

  ## Tabelas Afetadas
  - `perfis`: policy SELECT reescrita
  - `ordens_servico`: policies SELECT e UPDATE reescritas

  ## Notas de Segurança
  - A função é STABLE e SECURITY DEFINER — segura para uso em policies
  - Nenhum dado é removido, apenas as policies são recriadas
*/

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

-- 2. Recriar policy de SELECT em perfis (sem recursão)
DROP POLICY IF EXISTS "Perfis: usuario ve o proprio ou admin ve todos" ON perfis;

CREATE POLICY "Perfis: usuario ve o proprio ou admin ve todos"
  ON perfis FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    public.get_my_role() = 'admin'
  );

-- 3. Recriar policy de SELECT em ordens_servico (sem recursão)
DROP POLICY IF EXISTS "OS: vendedor ve as proprias ou admin ve todas" ON ordens_servico;

CREATE POLICY "OS: vendedor ve as proprias ou admin ve todas"
  ON ordens_servico FOR SELECT
  TO authenticated
  USING (
    vendedor_id = auth.uid() OR
    vendedor_id IS NULL OR
    public.get_my_role() = 'admin'
  );

-- 4. Recriar policy de UPDATE em ordens_servico (sem recursão)
DROP POLICY IF EXISTS "OS: vendedor atualiza as proprias ou admin atualiza todas" ON ordens_servico;

CREATE POLICY "OS: vendedor atualiza as proprias ou admin atualiza todas"
  ON ordens_servico FOR UPDATE
  TO authenticated
  USING (
    vendedor_id = auth.uid() OR
    vendedor_id IS NULL OR
    public.get_my_role() = 'admin'
  )
  WITH CHECK (
    vendedor_id = auth.uid() OR
    vendedor_id IS NULL OR
    public.get_my_role() = 'admin'
  );
