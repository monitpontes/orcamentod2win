import { useState, useMemo, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultComponents, ComponentItem } from "@/data/components";
import { BridgeSpan, createDefaultBridge } from "@/data/bridgeConfig";
import { calculateBudgetSummary } from "@/lib/budgetCalculations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ComponentCatalog from "@/components/ComponentCatalog";
import BridgeConfig from "@/components/BridgeConfig";
import BudgetSummary from "@/components/BudgetSummary";
import { Activity, LogOut, Save, FolderOpen, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SavedBudget {
  id: string;
  name: string;
  client_name: string;
  updated_at: string;
}

export default function Index() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [components, setComponents] = useState<ComponentItem[]>(defaultComponents);
  const [bridges, setBridges] = useState<BridgeSpan[]>([createDefaultBridge()]);
  const [clientName, setClientName] = useState("");
  const [budgetName, setBudgetName] = useState("Novo Orçamento");
  const [bdiRate, setBdiRate] = useState(0.3);
  const [taxRate, setTaxRate] = useState(0.2);
  const [markup, setMarkup] = useState(3);
  const [currentBudgetId, setCurrentBudgetId] = useState<string | null>(null);
  const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const summary = useMemo(
    () => calculateBudgetSummary(bridges, components, bdiRate, taxRate, markup),
    [bridges, components, bdiRate, taxRate, markup]
  );

  const loadBudgetList = useCallback(async () => {
    const { data } = await supabase
      .from("budgets")
      .select("id, name, client_name, updated_at")
      .order("updated_at", { ascending: false });
    if (data) setSavedBudgets(data);
  }, []);

  useEffect(() => {
    loadBudgetList();
  }, [loadBudgetList]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      name: budgetName,
      client_name: clientName,
      bridges_data: bridges as any,
      components_data: components as any,
      bdi_rate: bdiRate,
      tax_rate: taxRate,
      markup: markup,
    };

    if (currentBudgetId) {
      const { error } = await supabase
        .from("budgets")
        .update(payload)
        .eq("id", currentBudgetId);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Orçamento salvo!" });
      }
    } else {
      const { data, error } = await supabase
        .from("budgets")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      } else {
        setCurrentBudgetId(data.id);
        toast({ title: "Orçamento criado!" });
      }
    }

    setSaving(false);
    loadBudgetList();
  };

  const handleLoad = async (id: string) => {
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      toast({ title: "Erro ao carregar", variant: "destructive" });
      return;
    }
    setCurrentBudgetId(data.id);
    setBudgetName(data.name);
    setClientName(data.client_name);
    setBridges(data.bridges_data as unknown as BridgeSpan[]);
    setComponents(data.components_data as unknown as ComponentItem[]);
    setBdiRate(Number(data.bdi_rate));
    setTaxRate(Number(data.tax_rate));
    setMarkup(Number(data.markup));
    setLoadDialogOpen(false);
    toast({ title: `"${data.name}" carregado` });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("budgets").delete().eq("id", id);
    if (currentBudgetId === id) {
      setCurrentBudgetId(null);
    }
    loadBudgetList();
    toast({ title: "Orçamento excluído" });
  };

  const handleNew = () => {
    setCurrentBudgetId(null);
    setBudgetName("Novo Orçamento");
    setClientName("");
    setBridges([createDefaultBridge()]);
    setComponents(defaultComponents);
    setBdiRate(0.3);
    setTaxRate(0.2);
    setMarkup(3);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
              <Activity className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight">
                VibMonitor
              </h1>
              <p className="text-xs text-primary-foreground/70">
                Sistema de Orçamentos — Monitoramento de Vibração em Pontes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              className="w-48 h-8 text-sm bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 font-heading"
              placeholder="Nome do orçamento"
            />
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 font-heading"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "..." : "Salvar"}
            </Button>
            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="gap-1.5 font-heading">
                  <FolderOpen className="h-3.5 w-3.5" /> Abrir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Orçamentos Salvos</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {savedBudgets.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum orçamento salvo ainda.
                    </p>
                  )}
                  {savedBudgets.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => handleLoad(b.id)}
                        className="text-left flex-1"
                      >
                        <p className="font-heading font-medium text-sm">{b.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.client_name || "Sem cliente"} •{" "}
                          {new Date(b.updated_at).toLocaleDateString("pt-BR")}
                        </p>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(b.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full gap-1.5 font-heading" onClick={() => { handleNew(); setLoadDialogOpen(false); }}>
                  <Plus className="h-4 w-4" /> Novo Orçamento
                </Button>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary-foreground/70 hover:text-primary-foreground gap-1.5 font-heading"
              onClick={signOut}
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="budget" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="catalog" className="font-heading text-xs">
              Componentes
            </TabsTrigger>
            <TabsTrigger value="bridges" className="font-heading text-xs">
              Pontes
            </TabsTrigger>
            <TabsTrigger value="budget" className="font-heading text-xs">
              Orçamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <ComponentCatalog components={components} onUpdate={setComponents} />
          </TabsContent>

          <TabsContent value="bridges">
            <BridgeConfig bridges={bridges} onUpdate={setBridges} />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetSummary
              summary={summary}
              clientName={clientName}
              onClientNameChange={setClientName}
              onBdiChange={setBdiRate}
              onTaxChange={setTaxRate}
              onMarkupChange={setMarkup}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
