import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wrench, BarChart3, LogOut, Waves } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-light">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-pool">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">Piscinas E Afins</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Painel de Controle</h2>
          <p className="text-muted-foreground">Bem-vindo de volta ao seu painel</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/clientes" className="group">
            <Card className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>Clientes</CardTitle>
                <CardDescription>Gerencie seus clientes e contatos</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/manutencoes" className="group">
            <Card className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary group-hover:text-white">
                  <Wrench className="h-6 w-6" />
                </div>
                <CardTitle>Manutenções</CardTitle>
                <CardDescription>Registre e acompanhe serviços</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/relatorios" className="group">
            <Card className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle>Relatórios</CardTitle>
                <CardDescription>Visualize seus resultados</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
