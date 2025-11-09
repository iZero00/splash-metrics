-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  endereco TEXT,
  email TEXT,
  observacoes TEXT,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Create manutencoes table
CREATE TABLE public.manutencoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  descricao TEXT,
  data DATE NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  tipo TEXT CHECK(tipo IN ('limpeza', 'tratamento', 'outros')) NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Create gastos table
CREATE TABLE public.gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  categoria TEXT,
  data DATE NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for clientes
CREATE POLICY "Users can view their own clients"
  ON public.clientes FOR SELECT
  USING (auth.uid() = criado_por);

CREATE POLICY "Users can create their own clients"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Users can update their own clients"
  ON public.clientes FOR UPDATE
  USING (auth.uid() = criado_por);

CREATE POLICY "Users can delete their own clients"
  ON public.clientes FOR DELETE
  USING (auth.uid() = criado_por);

-- RLS Policies for manutencoes
CREATE POLICY "Users can view their own maintenance records"
  ON public.manutencoes FOR SELECT
  USING (auth.uid() = criado_por);

CREATE POLICY "Users can create their own maintenance records"
  ON public.manutencoes FOR INSERT
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Users can update their own maintenance records"
  ON public.manutencoes FOR UPDATE
  USING (auth.uid() = criado_por);

CREATE POLICY "Users can delete their own maintenance records"
  ON public.manutencoes FOR DELETE
  USING (auth.uid() = criado_por);

-- RLS Policies for gastos
CREATE POLICY "Users can view their own expenses"
  ON public.gastos FOR SELECT
  USING (auth.uid() = criado_por);

CREATE POLICY "Users can create their own expenses"
  ON public.gastos FOR INSERT
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Users can update their own expenses"
  ON public.gastos FOR UPDATE
  USING (auth.uid() = criado_por);

CREATE POLICY "Users can delete their own expenses"
  ON public.gastos FOR DELETE
  USING (auth.uid() = criado_por);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nome', 'Usuário'));
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create RPC function for financial reports
CREATE OR REPLACE FUNCTION relatorio_financeiro(usuario_id UUID)
RETURNS TABLE(mes TEXT, receitas NUMERIC, despesas NUMERIC, lucro NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH meses AS (
    SELECT DISTINCT to_char(data, 'YYYY-MM') as mes
    FROM (
      SELECT data FROM manutencoes WHERE criado_por = usuario_id
      UNION
      SELECT data FROM gastos WHERE criado_por = usuario_id
    ) AS todas_datas
  ),
  receitas_mes AS (
    SELECT to_char(data, 'YYYY-MM') as mes, COALESCE(SUM(valor), 0) as total
    FROM manutencoes
    WHERE criado_por = usuario_id
    GROUP BY to_char(data, 'YYYY-MM')
  ),
  despesas_mes AS (
    SELECT to_char(data, 'YYYY-MM') as mes, COALESCE(SUM(ABS(valor)), 0) as total
    FROM gastos
    WHERE criado_por = usuario_id
    GROUP BY to_char(data, 'YYYY-MM')
  )
  SELECT 
    m.mes,
    COALESCE(r.total, 0) as receitas,
    COALESCE(d.total, 0) as despesas,
    COALESCE(r.total, 0) - COALESCE(d.total, 0) as lucro
  FROM meses m
  LEFT JOIN receitas_mes r ON m.mes = r.mes
  LEFT JOIN despesas_mes d ON m.mes = d.mes
  ORDER BY m.mes;
END;
$$;