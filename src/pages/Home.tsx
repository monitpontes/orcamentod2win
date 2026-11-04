import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, FilePlus2, FileText, FolderOpen, LogOut, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logoD2win from "@/assets/logo-d2win.jpeg";

interface RecentBudget {
  id: string;
  name: string;
  client_name: string;
  updated_at: string;
}

export default function Home() {
  const { user, signOut } = useAuth();
  const [budgets, setBudgets] = useState<RecentBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from("budgets")
        .select("id, name, client_name, updated_at")
        .order("updated_at", { ascending: false });
      if (!active) return;
      setBudgets(data || []);
      setLoadError(Boolean(error));
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logoD2win} alt="d2win" className="h-10 w-10 rounded-lg object-contain" />
            <div>
              <p className="font-heading text-xl font-bold">d2win</p>
              <p className="text-xs text-primary-foreground/70">Sistema de orçamentos e propostas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-primary-foreground/70 sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" className="gap-1.5 text-primary-foreground/80 hover:text-primary-foreground" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-8 px-4 py-8">
        <section className="rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent">Área de trabalho</p>
          <h1 className="max-w-2xl font-heading text-3xl font-bold text-foreground md:text-4xl">Seus orçamentos começam aqui</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Crie uma proposta para uma nova ponte ou continue um orçamento salvo. O processo segue de pontes para valores, propostas e compras.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2"><Link to="/orcamentos"><FilePlus2 className="h-4 w-4" /> Novo orçamento</Link></Button>
            <Button asChild size="lg" variant="outline" className="gap-2"><Link to="/orcamentos?listar=1"><FolderOpen className="h-4 w-4" /> Abrir orçamento salvo</Link></Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Etapas de trabalho">
          {[
            { icon: Building2, title: "1. Configure as pontes", description: "Informe tipologia, vãos, sensores e estações opcionais." },
            { icon: FileText, title: "2. Revise a proposta", description: "Confira os valores e gere os documentos técnico e comercial." },
            { icon: ShoppingCart, title: "3. Organize as compras", description: "Acompanhe itens, quantidades e exporte o Excel do orçamento." },
          ].map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5 text-accent" />{title}</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
            </Card>
          ))}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-bold">Orçamentos recentes</h2>
              <p className="text-sm text-muted-foreground">Retome seu trabalho de onde parou.</p>
            </div>
            {budgets.length > 5 && <Button asChild variant="outline" size="sm"><Link to="/orcamentos?listar=1">Ver todos</Link></Button>}
          </div>
          <Card>
            <CardContent className="p-0">
              {loading && <p className="p-6 text-sm text-muted-foreground">Carregando orçamentos...</p>}
              {!loading && loadError && <p className="p-6 text-sm text-destructive">Não foi possível carregar os orçamentos. Tente abrir a lista novamente.</p>}
              {!loading && !loadError && budgets.length === 0 && <p className="p-6 text-sm text-muted-foreground">Nenhum orçamento salvo ainda. Comece pelo botão “Novo orçamento”.</p>}
              {!loading && !loadError && budgets.slice(0, 5).map((budget) => (
                <Link key={budget.id} to={`/orcamentos?budget=${encodeURIComponent(budget.id)}`} className="flex items-center justify-between gap-4 border-b px-5 py-4 last:border-0 hover:bg-muted/40">
                  <div className="min-w-0">
                    <p className="truncate font-heading font-semibold">{budget.name}</p>
                    <p className="text-xs text-muted-foreground">{budget.client_name || "Cliente não informado"} · Atualizado em {new Date(budget.updated_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent">Abrir <ArrowRight className="h-4 w-4" /></span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
