-- ==========================================
-- 1. EXTENSÕES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. TABELAS
-- ==========================================
-- Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.perfis (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome text NOT NULL,
  role text NOT NULL DEFAULT 'vendedor',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Aparelhos
CREATE TABLE IF NOT EXISTS public.aparelhos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  modelo text NOT NULL,
  storage text NOT NULL,
  cor text NOT NULL,
  imei text UNIQUE NOT NULL,
  bateria_pct integer NOT NULL,
  preco_compra numeric(10,2) NOT NULL,
  preco_venda numeric(10,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('Disponível', 'disponivel', 'Reservado', 'reservado', 'Vendido', 'vendido', 'Na Oficina', 'na_oficina')),
  vendedor_id uuid REFERENCES public.perfis(id),
  data_entrada date NOT NULL DEFAULT CURRENT_DATE,
  data_venda date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Ordens_Servico
CREATE TABLE IF NOT EXISTS public.ordens_servico (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_nome text NOT NULL,
  cliente_tel text NOT NULL,
  modelo text NOT NULL,
  problema text NOT NULL,
  tecnico text NOT NULL,
  status text NOT NULL CHECK (status IN ('Diagnóstico', 'diagnostico', 'Aguardando Peça', 'aguardando_peca', 'Em Andamento', 'em_andamento', 'Pronto', 'pronto', 'Entregue', 'entregue')),
  valor numeric(10,2),
  data_entrada date NOT NULL DEFAULT CURRENT_DATE,
  data_previsao date,
  data_entrega date,
  vendedor_id uuid REFERENCES public.perfis(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  aparelho_id uuid REFERENCES public.aparelhos(id),
  vendedor_id uuid REFERENCES public.perfis(id) NOT NULL,
  preco_venda numeric(10,2) NOT NULL,
  preco_compra numeric(10,2) NOT NULL,
  forma_pagamento text NOT NULL,
  parcelas integer NOT NULL DEFAULT 1,
  comissao_pct numeric(5,2) NOT NULL DEFAULT 0,
  lucro_liquido numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS public.mensagens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja text NOT NULL,
  mensagem text NOT NULL,
  grupo text NOT NULL,
  data_hora timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. HABILITAR RLS (Row Level Security)
-- ==========================================
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE aparelhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. GATILHOS (TRIGGERS) PARA O AUTH
-- ==========================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 5. POLÍTICAS RLS (POLICIES)
-- ==========================================
-- Perfis
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Perfis: usuario ve o proprio ou admin ve todos" ON perfis FOR SELECT TO authenticated USING (auth.uid() = id OR (SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'');';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Perfis: usuario atualiza o proprio" ON perfis FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Perfis: insercao propria" ON perfis FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- Aparelhos
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Aparelhos: autenticados veem" ON aparelhos FOR SELECT TO authenticated USING (true);';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Aparelhos: admin insere" ON aparelhos FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'');';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Aparelhos: admin atualiza" ON aparelhos FOR UPDATE TO authenticated USING ((SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'') WITH CHECK ((SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'');';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Aparelhos: admin deleta" ON aparelhos FOR DELETE TO authenticated USING ((SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'');';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- Ordens de Servico
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "OS: vendedor ve as proprias ou admin ve todas" ON ordens_servico FOR SELECT TO authenticated USING (vendedor_id = auth.uid() OR vendedor_id IS NULL OR (SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'');';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "OS: autenticados criam" ON ordens_servico FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "OS: vendedor atualiza a propria ou admin" ON ordens_servico FOR UPDATE TO authenticated USING (vendedor_id = auth.uid() OR vendedor_id IS NULL OR (SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'') WITH CHECK (vendedor_id = auth.uid() OR vendedor_id IS NULL OR (SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'');';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "OS: admin deleta" ON ordens_servico FOR DELETE TO authenticated USING ((SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'');';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- Vendas
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Vendas: vendedor ve as proprias ou admin ve todas" ON vendas FOR SELECT TO authenticated USING (vendedor_id = auth.uid() OR (SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'');';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Vendas: autenticados registram" ON vendas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Vendas: admin atualiza" ON vendas FOR UPDATE TO authenticated USING ((SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'') WITH CHECK ((SELECT role FROM perfis WHERE id = auth.uid()) = ''admin'');';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- Mensagens
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Mensagens: autenticados veem" ON mensagens FOR SELECT TO authenticated USING (true);';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Mensagens: sistema insere" ON mensagens FOR INSERT TO authenticated WITH CHECK (true);';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ==========================================
-- 6. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS aparelhos_status_idx ON aparelhos(status);
CREATE INDEX IF NOT EXISTS aparelhos_imei_idx ON aparelhos(imei);
CREATE INDEX IF NOT EXISTS os_status_idx ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS os_vendedor_idx ON ordens_servico(vendedor_id);
CREATE INDEX IF NOT EXISTS vendas_vendedor_idx ON vendas(vendedor_id);
CREATE INDEX IF NOT EXISTS vendas_created_at_idx ON vendas(created_at);
CREATE INDEX IF NOT EXISTS mensagens_data_hora_idx ON mensagens(data_hora DESC);
