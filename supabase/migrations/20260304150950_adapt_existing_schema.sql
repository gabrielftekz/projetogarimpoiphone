/*
  # CelPainel — Adaptacao do Schema Existente
  
  As tabelas ja existem com schema ligeiramente diferente.
  Esta migration:
  - Adiciona colunas faltantes
  - Corrige constraints de status para aceitar valores em portugues
  - Cria trigger de auto-perfil no cadastro
  - Adiciona RLS completo em todas as tabelas
*/

-- =============================================
-- Ajustar perfis para referenciar auth.users
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'perfis' AND column_name = 'ativo'
  ) THEN
    ALTER TABLE perfis ADD COLUMN ativo boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- =============================================
-- Ajustar aparelhos — status com valores corretos
-- =============================================
ALTER TABLE aparelhos DROP CONSTRAINT IF EXISTS aparelhos_status_check;
ALTER TABLE aparelhos ADD CONSTRAINT aparelhos_status_check
  CHECK (status IN ('Disponível', 'disponivel', 'Reservado', 'reservado', 'Vendido', 'vendido', 'Na Oficina', 'na_oficina'));

-- =============================================
-- Adicionar vendedor_id em ordens_servico
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ordens_servico' AND column_name = 'vendedor_id'
  ) THEN
    ALTER TABLE ordens_servico ADD COLUMN vendedor_id uuid;
  END IF;
END $$;

-- =============================================
-- Ajustar ordens_servico — status com valores corretos
-- =============================================
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;
ALTER TABLE ordens_servico ADD CONSTRAINT ordens_servico_status_check
  CHECK (status IN ('Diagnóstico', 'diagnostico', 'Aguardando Peça', 'aguardando_peca', 'Em Andamento', 'em_andamento', 'Pronto', 'pronto', 'Entregue', 'entregue'));

-- =============================================
-- Adicionar comissao_pct em vendas
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendas' AND column_name = 'comissao_pct'
  ) THEN
    ALTER TABLE vendas ADD COLUMN comissao_pct numeric(5,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- Adicionar mensagens.created_at se nao existir
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mensagens' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE mensagens ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- =============================================
-- RLS em todas as tabelas
-- =============================================
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE aparelhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TRIGGER: criar perfil no cadastro
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- POLICIES — PERFIS
-- =============================================
DROP POLICY IF EXISTS "Usuarios podem ver o proprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar o proprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuarios podem inserir o proprio perfil" ON perfis;

CREATE POLICY "Perfis: usuario ve o proprio ou admin ve todos"
  ON perfis FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Perfis: usuario atualiza o proprio"
  ON perfis FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Perfis: insercao propria"
  ON perfis FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================
-- POLICIES — APARELHOS
-- =============================================
DROP POLICY IF EXISTS "Usuarios autenticados podem ver aparelhos" ON aparelhos;
DROP POLICY IF EXISTS "Admin pode inserir aparelhos" ON aparelhos;
DROP POLICY IF EXISTS "Admin pode atualizar aparelhos" ON aparelhos;

CREATE POLICY "Aparelhos: autenticados veem"
  ON aparelhos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Aparelhos: admin insere"
  ON aparelhos FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Aparelhos: admin atualiza"
  ON aparelhos FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Aparelhos: admin deleta"
  ON aparelhos FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  );

-- =============================================
-- POLICIES — ORDENS DE SERVICO
-- =============================================
DROP POLICY IF EXISTS "Usuarios autenticados podem ver OS" ON ordens_servico;
DROP POLICY IF EXISTS "Usuarios autenticados podem inserir OS" ON ordens_servico;
DROP POLICY IF EXISTS "Usuarios autenticados podem atualizar OS" ON ordens_servico;

CREATE POLICY "OS: vendedor ve as proprias ou admin ve todas"
  ON ordens_servico FOR SELECT
  TO authenticated
  USING (
    vendedor_id = auth.uid() OR
    vendedor_id IS NULL OR
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "OS: autenticados criam"
  ON ordens_servico FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

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
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "OS: admin deleta"
  ON ordens_servico FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  );

-- =============================================
-- POLICIES — VENDAS
-- =============================================
DROP POLICY IF EXISTS "Vendedores veem proprias vendas" ON vendas;
DROP POLICY IF EXISTS "Usuarios autenticados podem inserir vendas" ON vendas;

CREATE POLICY "Vendas: vendedor ve as proprias ou admin ve todas"
  ON vendas FOR SELECT
  TO authenticated
  USING (
    vendedor_id = auth.uid() OR
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Vendas: autenticados registram"
  ON vendas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Vendas: admin atualiza"
  ON vendas FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM perfis WHERE id = auth.uid()) = 'admin'
  );

-- =============================================
-- POLICIES — MENSAGENS
-- =============================================
DROP POLICY IF EXISTS "Usuarios autenticados podem ver mensagens" ON mensagens;
DROP POLICY IF EXISTS "Usuarios autenticados podem inserir mensagens" ON mensagens;

CREATE POLICY "Mensagens: autenticados veem"
  ON mensagens FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mensagens: sistema insere"
  ON mensagens FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- INDEXES adicionais
-- =============================================
CREATE INDEX IF NOT EXISTS aparelhos_status_idx ON aparelhos(status);
CREATE INDEX IF NOT EXISTS aparelhos_imei_idx ON aparelhos(imei);
CREATE INDEX IF NOT EXISTS os_status_idx ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS os_vendedor_idx ON ordens_servico(vendedor_id);
CREATE INDEX IF NOT EXISTS vendas_vendedor_idx ON vendas(vendedor_id);
CREATE INDEX IF NOT EXISTS vendas_created_at_idx ON vendas(created_at);
CREATE INDEX IF NOT EXISTS mensagens_data_hora_idx ON mensagens(data_hora DESC);
