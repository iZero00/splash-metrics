import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Calendar, DollarSign, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface Manutencao {
  id: string;
  cliente_id: string;
  descricao: string | null;
  data: string;
  valor: number;
  tipo: string;
  clientes: { nome: string } | null;
}

interface Cliente {
  id: string;
  nome: string;
}

export default function Manutencoes() {
  const { user } = useAuth();
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: "",
    descricao: "",
    data: format(new Date(), "yyyy-MM-dd"),
    valor: "",
    tipo: "limpeza"
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    const [manutData, clientData] = await Promise.all([
      supabase
        .from("manutencoes")
        .select("*, clientes(nome)")
        .eq("criado_por", user.id)
        .order("data", { ascending: false }),
      supabase
        .from("clientes")
        .select("id, nome")
        .eq("criado_por", user.id)
        .order("nome")
    ]);

    if (manutData.error) {
      toast.error("Erro ao carregar manutenções");
    } else {
      setManutencoes(manutData.data || []);
    }

    if (!clientData.error) {
      setClientes(clientData.data || []);
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.cliente_id || !formData.data || !formData.valor) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { error } = await supabase
      .from("manutencoes")
      .insert([{
        ...formData,
        valor: parseFloat(formData.valor),
        criado_por: user.id
      }]);

    if (error) {
      toast.error("Erro ao adicionar manutenção");
    } else {
      toast.success("Manutenção adicionada com sucesso!");
      setOpen(false);
      setFormData({
        cliente_id: "",
        descricao: "",
        data: format(new Date(), "yyyy-MM-dd"),
        valor: "",
        tipo: "limpeza"
      });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta manutenção?")) return;

    const { error } = await supabase
      .from("manutencoes")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir manutenção");
    } else {
      toast.success("Manutenção excluída com sucesso!");
      fetchData();
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      limpeza: "Limpeza",
      tratamento: "Tratamento",
      outros: "Outros"
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="min-h-screen bg-gradient-light">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar</span>
          </Link>
          <h1 className="text-xl font-bold">Manutenções</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Serviços Realizados</h2>
            <p className="text-muted-foreground">Total: {manutencoes.length} serviço(s)</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Manutenção</DialogTitle>
                <DialogDescription>Registre um novo serviço realizado</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <Select value={formData.cliente_id} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Serviço *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="limpeza">Limpeza</SelectItem>
                      <SelectItem value="tratamento">Tratamento</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Salvar Manutenção</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : manutencoes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-muted-foreground">Nenhuma manutenção registrada ainda</p>
              {clientes.length > 0 ? (
                <Button onClick={() => setOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeira Manutenção
                </Button>
              ) : (
                <Link to="/clientes">
                  <Button>Cadastre um cliente primeiro</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {manutencoes.map((manut) => (
              <Card key={manut.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{manut.clientes?.nome || "Cliente não encontrado"}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(manut.data), "dd/MM/yyyy")}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {getTipoLabel(manut.tipo)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-secondary">
                          <DollarSign className="h-4 w-4" />
                          {manut.valor.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(manut.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {manut.descricao && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{manut.descricao}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
