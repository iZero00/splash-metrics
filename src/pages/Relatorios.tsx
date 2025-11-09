import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RelatorioData {
  mes: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

export default function Relatorios() {
  const { user } = useAuth();
  const [data, setData] = useState<RelatorioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totais, setTotais] = useState({
    receitas: 0,
    despesas: 0,
    lucro: 0
  });

  useEffect(() => {
    fetchRelatorio();
  }, [user]);

  const fetchRelatorio = async () => {
    if (!user) return;

    const { data: relData, error } = await supabase.rpc("relatorio_financeiro", {
      usuario_id: user.id
    });

    if (error) {
      toast.error("Erro ao carregar relatório");
      setLoading(false);
      return;
    }

    if (relData && relData.length > 0) {
      setData(relData);
      
      const totais = relData.reduce(
        (acc, item) => ({
          receitas: acc.receitas + Number(item.receitas),
          despesas: acc.despesas + Number(item.despesas),
          lucro: acc.lucro + Number(item.lucro)
        }),
        { receitas: 0, despesas: 0, lucro: 0 }
      );
      
      setTotais(totais);
    }
    
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-light">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar</span>
          </Link>
          <h1 className="text-xl font-bold">Relatórios</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Resumo Financeiro</h2>
          <p className="text-muted-foreground">Acompanhe o desempenho do seu negócio</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhum dado disponível ainda</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Adicione manutenções e gastos para visualizar seus relatórios
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total de Receitas</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-2xl text-secondary">
                    <TrendingUp className="h-5 w-5" />
                    {formatCurrency(totais.receitas)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total de Despesas</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-2xl text-destructive">
                    <TrendingDown className="h-5 w-5" />
                    {formatCurrency(totais.despesas)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Lucro Total</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                    <DollarSign className="h-5 w-5" />
                    {formatCurrency(totais.lucro)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
                <CardDescription>Comparativo de receitas, despesas e lucro por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Legend />
                      <Bar dataKey="receitas" fill="hsl(var(--secondary))" name="Receitas" />
                      <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" />
                      <Bar dataKey="lucro" fill="hsl(var(--primary))" name="Lucro" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
