-- Fix search_path for relatorio_financeiro function
CREATE OR REPLACE FUNCTION relatorio_financeiro(usuario_id UUID)
RETURNS TABLE(mes TEXT, receitas NUMERIC, despesas NUMERIC, lucro NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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