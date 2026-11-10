import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultComponents, ComponentItem } from "@/data/components";
import { BridgeSpan, ExtraItem, createDefaultBridge } from "@/data/bridgeConfig";
import { calculateBudgetSummary } from "@/lib/budgetCalculations";
import { inferRoadName } from "@/lib/proposalFilename";
import { Compositions, defaultCompositions, restoreCompositionsSnapshot } from "@/data/compositions";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ComponentCatalog from "@/components/ComponentCatalog";
import CompositionEditor from "@/components/CompositionEditor";
import BridgeConfig from "@/components/BridgeConfig";
import BudgetSummary from "@/components/BudgetSummary";
import DetailedSummary from "@/components/DetailedSummary";
import ProcurementList from "@/components/ProcurementList";
import { LogOut, Save, FolderOpen, Plus, Trash2, Search, PackagePlus, ShoppingCart, CircleCheck, CircleAlert, House } from "lucide-react";
import logoD2win from "@/assets/logo-d2win.jpeg";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedBudget {
  id: string;
  name: string;
  client_name: string;
  updated_at: string;
}

interface BudgetDraft {
  budgetName: string;
  clientName: string;
  proposalNumber: string;
  roadName: string;
  bridges: BridgeSpan[];
  components: ComponentItem[];
  bdiRate: number;
  taxRate: number;
  markup: number;
  compositions: Compositions;
  globalExtraItems: ExtraItem[];
  accompanimentMonths: number;
}

const draftSnapshot = (draft: BudgetDraft) => JSON.stringify(draft);
type PendingSwitch = { type: "load"; id: string } | { type: "new" } | { type: "signOut" } | { type: "home" };

export default function Index() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedBudgetRef = useRef<string | null>(null);

  const [components, setComponents] = useState<ComponentItem[]>(defaultComponents);
  const [bridges, setBridges] = useState<BridgeSpan[]>([createDefaultBridge()]);
  const [globalExtraItems, setGlobalExtraItems] = useState<ExtraItem[]>([]);
  const [compositions, setCompositions] = useState<Compositions>(() =>
    structuredClone(defaultCompositions)
  );
  const [clientName, setClientName] = useState("");
  const [proposalNumber, setProposalNumber] = useState("001");
  const [roadName, setRoadName] = useState("");
  const [budgetName, setBudgetName] = useState("Novo Orçamento");
  const [bdiRate, setBdiRate] = useState(0.3);
  const [taxRate, setTaxRate] = useState(0.2);
  const [markup, setMarkup] = useState(3);
  const [accompanimentMonths, setAccompanimentMonths] = useState(0);
  const [currentBudgetId, setCurrentBudgetId] = useState<string | null>(null);
  const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGlobalComponent, setSelectedGlobalComponent] = useState("");
  const [activeTab, setActiveTab] = useState("bridges");
  const [cleanSnapshot, setCleanSnapshot] = useState<string | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(null);
  const [pendingDeleteBudgetId, setPendingDeleteBudgetId] = useState<string | null>(null);
  const [saveAuthorizationOpen, setSaveAuthorizationOpen] = useState(false);

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
        compositions,
        accompanimentMonths
      ),
    [bridges, components, bdiRate, taxRate, markup, globalExtraItems, compositions, accompanimentMonths]
  );

  const currentSnapshot = useMemo(() => draftSnapshot({
    budgetName, clientName, proposalNumber, roadName, bridges, components, bdiRate, taxRate, markup, compositions, globalExtraItems, accompanimentMonths,
  }), [budgetName, clientName, proposalNumber, roadName, bridges, components, bdiRate, taxRate, markup, compositions, globalExtraItems, accompanimentMonths]);
  const hasUnsavedChanges = cleanSnapshot !== null && cleanSnapshot !== currentSnapshot;

  useEffect(() => {
    if (cleanSnapshot === null) setCleanSnapshot(currentSnapshot);
  }, [cleanSnapshot, currentSnapshot]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedChanges]);

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

  const persistBudget = async () => {
    if (!user) return;
    if (!budgetName.trim()) {
      toast({ title: "Informe um nome para o orçamento", variant: "destructive" });
      return;
    }
    setSaving(true);
    const submittedSnapshot = currentSnapshot;

    const payload = {
      user_id: user.id,
      name: budgetName,
      client_name: clientName,
      bridges_data: bridges as unknown as Json,
      components_data: components as unknown as Json,
      bdi_rate: bdiRate,
      tax_rate: taxRate,
      markup: markup,
      compositions_data: { ...compositions, globalExtraItems, proposalNumber, roadName, accompanimentMonths } as unknown as Json,
    };

    if (currentBudgetId) {
      const { error } = await supabase
        .from("budgets")
        .update(payload)
        .eq("id", currentBudgetId);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      } else {
        setCleanSnapshot(submittedSnapshot);
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
        setCleanSnapshot(submittedSnapshot);
        requestedBudgetRef.current = data.id;
        navigate(`/orcamentos?budget=${encodeURIComponent(data.id)}`, { replace: true });
        toast({ title: "Orçamento criado!" });
      }
    }

    setSaving(false);
    loadBudgetList();
  };

  const handleSave = () => {
    if (currentBudgetId) {
      if (hasUnsavedChanges) setSaveAuthorizationOpen(true);
      else toast({ title: "Orçamento já está consolidado", description: "Não há alterações para salvar." });
      return;
    }
    void persistBudget();
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
    const savedBridges = Array.isArray(data.bridges_data) ? data.bridges_data : [];
    const needsWeatherStationReview = savedBridges.some((bridge) =>
      bridge && typeof bridge === "object" && !("weatherStationCount" in bridge)
    );
    // A saved budget is a consolidated snapshot. Loading must not apply today's
    // EPR, catalog, or BOM migrations to its stored quantities and prices.
    const normalizedBridges = (savedBridges as unknown as Partial<BridgeSpan>[]).map((bridge) => ({
      ...createDefaultBridge(),
      ...bridge,
      // Earlier records used temperature quantities as the station count.
      weatherStationCount: bridge.weatherStationCount ?? bridge.temperatureCount ?? 0,
      extraItems: Array.isArray(bridge.extraItems) ? bridge.extraItems : [],
    }));
    const loadedComponents = Array.isArray(data.components_data)
      ? data.components_data as unknown as ComponentItem[]
      : defaultComponents;
    const loadedCompositions = restoreCompositionsSnapshot(data.compositions_data);
    const savedCompositions = data.compositions_data as unknown as { globalExtraItems?: ExtraItem[]; proposalNumber?: string; roadName?: string; accompanimentMonths?: number } | null;
    const loadedExtras = Array.isArray(savedCompositions?.globalExtraItems) ? savedCompositions.globalExtraItems : [];
    const loadedProposalNumber = savedCompositions?.proposalNumber || "001";
    const loadedRoadName = savedCompositions?.roadName ?? inferRoadName(data.name, normalizedBridges);
    const loadedAccompanimentMonths = Math.max(0, Math.floor(Number(savedCompositions?.accompanimentMonths) || 0));
    setCurrentBudgetId(data.id);
    requestedBudgetRef.current = data.id;
    navigate(`/orcamentos?budget=${encodeURIComponent(data.id)}`, { replace: true });
    setBudgetName(data.name);
    setClientName(data.client_name);
    setProposalNumber(loadedProposalNumber);
    setRoadName(loadedRoadName);
    setAccompanimentMonths(loadedAccompanimentMonths);
    setBridges(normalizedBridges);
    setComponents(loadedComponents);
    setBdiRate(Number(data.bdi_rate));
    setTaxRate(Number(data.tax_rate));
    setMarkup(Number(data.markup));
    setCompositions(loadedCompositions);
    setGlobalExtraItems(loadedExtras);
    setCleanSnapshot(draftSnapshot({
      budgetName: data.name, clientName: data.client_name, proposalNumber: loadedProposalNumber, roadName: loadedRoadName, bridges: normalizedBridges,
      components: loadedComponents, bdiRate: Number(data.bdi_rate), taxRate: Number(data.tax_rate),
      markup: Number(data.markup), compositions: loadedCompositions, globalExtraItems: loadedExtras, accompanimentMonths: loadedAccompanimentMonths,
    }));
    setActiveTab("budget");
    setLoadDialogOpen(false);
    toast({
      title: `"${data.name}" carregado`,
      description: needsWeatherStationReview
        ? "Orçamento consolidado carregado. Quantidades, componentes e composição salvos foram preservados; revise as estações antes de autorizar alterações."
        : "Orçamento consolidado carregado. Alterações só serão gravadas após sua confirmação.",
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      toast({ title: "Não foi possível excluir o orçamento", description: error.message, variant: "destructive" });
      return;
    }
    if (currentBudgetId === id) {
      handleNew();
    }
    loadBudgetList();
    toast({ title: "Orçamento excluído" });
  };

  const handleNew = () => {
    const newBridges = [createDefaultBridge()];
    const newCompositions = structuredClone(defaultCompositions);
    setCurrentBudgetId(null);
    requestedBudgetRef.current = null;
    navigate("/orcamentos", { replace: true });
    setBudgetName("Novo Orçamento");
    setClientName("");
    setProposalNumber("001");
    setRoadName("");
    setBridges(newBridges);
    setComponents(defaultComponents);
    setGlobalExtraItems([]);
    setBdiRate(0.3);
    setTaxRate(0.2);
    setMarkup(3);
    setAccompanimentMonths(0);
    setCompositions(newCompositions);
    setCleanSnapshot(draftSnapshot({
      budgetName: "Novo Orçamento", clientName: "", proposalNumber: "001", roadName: "", bridges: newBridges, components: defaultComponents,
      bdiRate: 0.3, taxRate: 0.2, markup: 3, compositions: newCompositions, globalExtraItems: [], accompanimentMonths: 0,
    }));
    setActiveTab("bridges");
  };

  const requestSwitch = (next: PendingSwitch) => {
    if (hasUnsavedChanges) {
      setLoadDialogOpen(false);
      setPendingSwitch(next);
      return;
    }
    if (next.type === "load") void handleLoad(next.id);
    else if (next.type === "new") handleNew();
    else if (next.type === "home") navigate("/");
    else void signOut();
  };

  const discardChangesAndSwitch = () => {
    if (!pendingSwitch) return;
    const next = pendingSwitch;
    setPendingSwitch(null);
    if (next.type === "load") void handleLoad(next.id);
    else if (next.type === "new") handleNew();
    else if (next.type === "home") navigate("/");
    else void signOut();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const budgetId = params.get("budget");
    if (budgetId && requestedBudgetRef.current !== budgetId) {
      requestedBudgetRef.current = budgetId;
      void handleLoad(budgetId);
    } else if (params.has("listar")) {
      setLoadDialogOpen(true);
    }
  }, [location.search]);

  const usedGlobalIds = new Set(globalExtraItems.map((e) => e.componentId));
  const availableGlobalComponents = components.filter((c) => !["S04", "S05", "CV00"].includes(c.id) && !usedGlobalIds.has(c.id));

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
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
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
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" className="gap-1.5 text-primary-foreground/80 hover:text-primary-foreground" onClick={() => requestSwitch({ type: "home" })}>
              <House className="h-4 w-4" /> Início
            </Button>
            <span className="hidden items-center gap-1.5 text-xs text-primary-foreground/80 lg:flex" role="status">
              {hasUnsavedChanges ? <CircleAlert className="h-3.5 w-3.5" /> : <CircleCheck className="h-3.5 w-3.5" />}
              {hasUnsavedChanges ? "Alterações não salvas" : currentBudgetId ? "Orçamento salvo" : "Novo orçamento"}
            </span>
            <Input
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              className="w-48 h-8 text-sm bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 font-heading"
              placeholder="Nome do orçamento"
              aria-label="Nome do orçamento"
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
                  <DialogDescription>Selecione um orçamento para continuar ou crie um novo.</DialogDescription>
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
                        onClick={() => requestSwitch({ type: "load", id: b.id })}
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
                        aria-label={`Excluir orçamento ${b.name}`}
                        title={`Excluir orçamento ${b.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLoadDialogOpen(false);
                          setPendingDeleteBudgetId(b.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full gap-1.5 font-heading" onClick={() => { setLoadDialogOpen(false); requestSwitch({ type: "new" }); }}>
                  <Plus className="h-4 w-4" /> Novo Orçamento
                </Button>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary-foreground/70 hover:text-primary-foreground gap-1.5 font-heading"
              onClick={() => requestSwitch({ type: "signOut" })}
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <AlertDialog open={Boolean(pendingSwitch)} onOpenChange={(open) => { if (!open) setPendingSwitch(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações não salvas?</AlertDialogTitle>
            <AlertDialogDescription>
              As mudanças feitas em {budgetName || "este orçamento"} desde o último salvamento serão perdidas.
              Use Cancelar e depois Salvar para preservá-las.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={discardChangesAndSwitch}>
              Descartar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(pendingDeleteBudgetId)} onOpenChange={(open) => { if (!open) setPendingDeleteBudgetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {savedBudgets.find((budget) => budget.id === pendingDeleteBudgetId)?.name || "Este orçamento"} será excluído permanentemente, junto com a lista de compras vinculada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
              if (pendingDeleteBudgetId) void handleDelete(pendingDeleteBudgetId);
              setPendingDeleteBudgetId(null);
            }}>
              Excluir orçamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={saveAuthorizationOpen} onOpenChange={setSaveAuthorizationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Autorizar alteração deste orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              “{budgetName}” está consolidado e será sobrescrito com os dados e cálculos exibidos agora. Essa autorização vale para esta gravação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar sem salvar</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={(event) => {
              event.preventDefault();
              setSaveAuthorizationOpen(false);
              void persistBudget();
            }}>
              Autorizar e salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-4 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Fluxo sugerido:</span> configure as pontes, confira o orçamento e salve antes de organizar as compras.
          {hasUnsavedChanges && <span className="ml-2 font-medium text-amber-700 dark:text-amber-400">Há alterações pendentes de salvamento.</span>}
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 lg:grid-cols-6">
            <TabsTrigger value="bridges" className="font-heading text-xs">
              1 · Pontes
            </TabsTrigger>
            <TabsTrigger value="budget" className="font-heading text-xs">
              2 · Orçamento
            </TabsTrigger>
            <TabsTrigger value="procurement" className="font-heading text-xs gap-1">
              <ShoppingCart className="h-3 w-3" /> 3 · Compras
            </TabsTrigger>
            <TabsTrigger value="summary" className="font-heading text-xs">
              Resumo
            </TabsTrigger>
            <TabsTrigger value="catalog" className="font-heading text-xs">
              Componentes
            </TabsTrigger>
            <TabsTrigger value="extras" className="font-heading text-xs">
              Extras Globais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <div className="space-y-8">
              <ComponentCatalog components={components} compositions={compositions} onCompositionsChange={setCompositions} onUpdate={setComponents} />
              <details className="rounded-lg border bg-card">
                <summary className="cursor-pointer px-4 py-3 font-heading font-semibold">Composições do orçamento · abrir para editar quantidades e bases</summary>
                <div className="border-t p-4">
                <CompositionEditor
                  components={components}
                  onComponentsChange={setComponents}
                  compositions={compositions}
                  onChange={setCompositions}
                />
                </div>
              </details>
            </div>
          </TabsContent>

          <TabsContent value="bridges">
            <BridgeConfig bridges={bridges} onUpdate={setBridges} components={components} />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">Terminou de configurar as pontes? Confira os valores e as premissas do orçamento.</p>
              <Button variant="outline" onClick={() => setActiveTab("budget")}>Conferir orçamento</Button>
            </div>
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
              proposalName={budgetName}
              proposalNumber={proposalNumber}
              onProposalNumberChange={setProposalNumber}
              roadName={roadName}
              onRoadNameChange={setRoadName}
              clientName={clientName}
              onClientNameChange={setClientName}
              onBdiChange={setBdiRate}
              onTaxChange={setTaxRate}
              onMarkupChange={setMarkup}
              accompanimentMonths={accompanimentMonths}
              onAccompanimentMonthsChange={setAccompanimentMonths}
              onInternalLaborIncludedChange={(includeInternalLabor) =>
                setCompositions((current) => ({ ...current, includeInternalLabor }))
              }
              onBridgesChange={setBridges}
              bridges={bridges}
              components={components}
              globalExtraItems={globalExtraItems}
              compositions={compositions}
            />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {hasUnsavedChanges || !currentBudgetId
                  ? "Salve o orçamento para registrar as alterações e liberar a exportação da lista de compras."
                  : "Orçamento salvo. Agora você pode acompanhar e exportar as compras."}
              </p>
              <Button onClick={() => {
                if (hasUnsavedChanges || !currentBudgetId) void handleSave();
                else setActiveTab("procurement");
              }} disabled={saving}>
                {hasUnsavedChanges || !currentBudgetId ? "Salvar orçamento" : "Abrir compras"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="procurement">
            <ProcurementList
              key={currentBudgetId ?? "novo-orcamento"}
              budgetId={currentBudgetId}
              bridges={bridges}
              components={components}
              globalExtraItems={globalExtraItems}
              compositions={compositions}
              budgetName={budgetName}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
