import { useState, useMemo, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultComponents, ComponentItem } from "@/data/components";
import { BridgeSpan, ExtraItem, createDefaultBridge } from "@/data/bridgeConfig";
import { calculateBudgetSummary } from "@/lib/budgetCalculations";
import { Compositions, defaultCompositions, normalizeCompositions } from "@/data/compositions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ComponentCatalog from "@/components/ComponentCatalog";
import CompositionEditor from "@/components/CompositionEditor";
import BridgeConfig from "@/components/BridgeConfig";
import BudgetSummary from "@/components/BudgetSummary";
import DetailedSummary from "@/components/DetailedSummary";
import ProcurementList from "@/components/ProcurementList";
import { LogOut, Save, FolderOpen, Plus, Trash2, Search, PackagePlus, ShoppingCart } from "lucide-react";
import logoD2win from "@/assets/logo-d2win.jpeg";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [globalExtraItems, setGlobalExtraItems] = useState<ExtraItem[]>([]);
  const [compositions, setCompositions] = useState<Compositions>(() =>
    structuredClone(defaultCompositions)
  );
  const [clientName, setClientName] = useState("");
  const [budgetName, setBudgetName] = useState("Novo Orçamento");
  const [bdiRate, setBdiRate] = useState(0.3);
  const [taxRate, setTaxRate] = useState(0.2);
  const [markup, setMarkup] = useState(3);
  const [currentBudgetId, setCurrentBudgetId] = useState<string | null>(null);
  const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGlobalComponent, setSelectedGlobalComponent] = useState("");

  const filteredBudgets = useMemo(() => {
    if (!searchQuery.trim()) return savedBudgets;
    const q = searchQuery.toLowerCase();
    return savedBudgets.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.client_name && b.client_name.toLowerCase().includes(q))
    );
  }, [savedBudgets, searchQuery]);

  const summary = useMemo(
    () =>
      calculateBudgetSummary(
        bridges,
        components,
        bdiRate,
        taxRate,
        markup,
        globalExtraItems,
        compositions
      ),
    [bridges, components, bdiRate, taxRate, markup, globalExtraItems, compositions]
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
      compositions_data: compositions as any,
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
    setCompositions(normalizeCompositions(data.compositions_data));
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
    setGlobalExtraItems([]);
    setBdiRate(0.3);
    setTaxRate(0.2);
    setMarkup(3);
    setCompositions(structuredClone(defaultCompositions));
  };

  const usedGlobalIds = new Set(globalExtraItems.map((e) => e.componentId));
  const availableGlobalComponents = components.filter((c) => !usedGlobalIds.has(c.id));

  const addGlobalExtra = (componentId: string) => {
    const existing = globalExtraItems.find((e) => e.componentId === componentId);
    if (existing) {
      setGlobalExtraItems(globalExtraItems.map((e) =>
        e.componentId === componentId ? { ...e, qty: e.qty + 1 } : e
      ));
    } else {
      setGlobalExtraItems([...globalExtraItems, { componentId, qty: 1 }]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoD2win} alt="d2win" className="w-10 h-10 rounded-lg object-contain" />
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight">
                d2win
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome ou cliente..."
                    className="pl-9 font-heading"
                  />
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredBudgets.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {searchQuery ? "Nenhum orçamento encontrado." : "Nenhum orçamento salvo ainda."}
                    </p>
                  )}
                  {filteredBudgets.map((b) => (
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
          <TabsList className="grid w-full max-w-4xl grid-cols-6">
            <TabsTrigger value="catalog" className="font-heading text-xs">
              Componentes
            </TabsTrigger>
            <TabsTrigger value="bridges" className="font-heading text-xs">
              Pontes
            </TabsTrigger>
            <TabsTrigger value="extras" className="font-heading text-xs">
              Extras Globais
            </TabsTrigger>
            <TabsTrigger value="summary" className="font-heading text-xs">
              Resumo
            </TabsTrigger>
            <TabsTrigger value="budget" className="font-heading text-xs">
              Orçamento
            </TabsTrigger>
            <TabsTrigger value="procurement" className="font-heading text-xs gap-1">
              <ShoppingCart className="h-3 w-3" /> Compras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <div className="space-y-8">
              <ComponentCatalog components={components} onUpdate={setComponents} />
              <div className="border-t pt-6">
                <CompositionEditor
                  components={components}
                  compositions={compositions}
                  onChange={setCompositions}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bridges">
            <BridgeConfig bridges={bridges} onUpdate={setBridges} components={components} />
          </TabsContent>

          <TabsContent value="extras">
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <PackagePlus className="h-6 w-6 text-accent" />
                <h2 className="text-2xl font-heading font-bold text-foreground">
                  Custos Adicionais Globais
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Itens adicionados aqui são somados ao orçamento geral, independente de qual ponte.
              </p>

              {globalExtraItems.length > 0 && (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 text-xs text-muted-foreground">
                        <th className="px-4 py-2 text-left font-medium">ID</th>
                        <th className="px-4 py-2 text-left font-medium">Item</th>
                        <th className="px-4 py-2 text-right font-medium">Preço Unit.</th>
                        <th className="px-4 py-2 text-right font-medium">Qtd.</th>
                        <th className="px-4 py-2 text-right font-medium">Total</th>
                        <th className="px-4 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalExtraItems.map((item) => {
                        const comp = components.find((c) => c.id === item.componentId);
                        const price = comp?.unitPrice ?? 0;
                        return (
                          <tr key={item.componentId} className="border-t hover:bg-muted/20">
                            <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.componentId}</td>
                            <td className="px-4 py-2">{comp?.name || item.componentId}</td>
                            <td className="px-4 py-2 text-right font-heading text-xs">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <Input
                                type="number"
                                className="w-20 h-8 text-xs ml-auto"
                                value={item.qty}
                                min={0}
                                onChange={(e) =>
                                  setGlobalExtraItems(globalExtraItems.map((g) =>
                                    g.componentId === item.componentId ? { ...g, qty: +e.target.value } : g
                                  ))
                                }
                              />
                            </td>
                            <td className="px-4 py-2 text-right font-heading text-xs font-semibold">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price * item.qty)}
                            </td>
                            <td className="px-4 py-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setGlobalExtraItems(globalExtraItems.filter((g) => g.componentId !== item.componentId))}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center gap-2 max-w-lg">
                <Select value={selectedGlobalComponent} onValueChange={setSelectedGlobalComponent}>
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="Selecionar componente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGlobalComponents.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-sm">
                        {c.id} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={!selectedGlobalComponent}
                  onClick={() => {
                    if (selectedGlobalComponent) {
                      addGlobalExtra(selectedGlobalComponent);
                      setSelectedGlobalComponent("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="summary">
            <DetailedSummary bridges={bridges} components={components} summary={summary} globalExtraItems={globalExtraItems} />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetSummary
              summary={summary}
              clientName={clientName}
              onClientNameChange={setClientName}
              onBdiChange={setBdiRate}
              onTaxChange={setTaxRate}
              onMarkupChange={setMarkup}
              bridges={bridges}
              components={components}
              globalExtraItems={globalExtraItems}
            />
          </TabsContent>

          <TabsContent value="procurement">
            <ProcurementList
              budgetId={currentBudgetId}
              bridges={bridges}
              components={components}
              globalExtraItems={globalExtraItems}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
