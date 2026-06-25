import { Fragment, useMemo, useState } from "react";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";
import { categories as defaultCategories } from "@/data/components";
import { useProcurement, ProcurementRow, PurchaseStatus } from "@/hooks/useProcurement";
import { formatCurrency } from "@/lib/budgetCalculations";
import { GLOBAL_EXTRAS_KEY } from "@/lib/materialsList";
import { SENSOR_PROD_KEY } from "@/data/sensorProduction";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Search, Loader2, CheckCircle2, Plus, Trash2, ExternalLink, Eye, EyeOff, Package, Layers, Boxes, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface Props {
  budgetId: string | null;
  bridges: BridgeSpan[];
  components: ComponentItem[];
  globalExtraItems: ExtraItem[];
}

const STATUS_LABEL: Record<PurchaseStatus, string> = {
  nao: "Não",
  parcial: "Parcial",
  sim: "Sim",
};

const STATUS_CLASSES: Record<PurchaseStatus, string> = {
  nao: "bg-muted text-muted-foreground border-border",
  parcial: "bg-accent/15 text-accent border-accent/30",
  sim: "bg-primary/15 text-primary border-primary/30",
};

// Ordem preferida das categorias na visão global
const CATEGORY_ORDER = [
  "Produção de Sensores",
  "Placa",
  "Módulos",
  "Componentes Eletrônicos",
  "Mecânica",
  "Mão de Obra",
  "Sensores",
  "Caixa de Comando",
  "Conectividade",
  "Energia",
  "Energia Solar",
  "Infraestrutura",
  "Modelagem e Engenharia",
  "Projeto e Simulação",
  "Pacotes",
  "Instalação",
  "Infraestrutura de Terceiros",
  "Itens Adicionais",
];

function categorySortKey(cat: string) {
  const idx = CATEGORY_ORDER.indexOf(cat);
  return idx === -1 ? 999 : idx;
}

function StatusSelect({
  value,
  onChange,
  ariaLabel,
}: {
  value: PurchaseStatus;
  onChange: (v: PurchaseStatus) => void;
  ariaLabel: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PurchaseStatus)}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={`h-8 text-xs font-heading w-[100px] ${STATUS_CLASSES[value]}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="nao">Não</SelectItem>
        <SelectItem value="parcial">Parcial</SelectItem>
        <SelectItem value="sim">Sim</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function ProcurementList({
  budgetId,
  bridges,
  components,
  globalExtraItems,
}: Props) {
  const {
    rows,
    loading,
    saving,
    updateRow,
    addCustomItem,
    removeRow,
    usdBrlRate,
    sensorCount,
    updateUsdBrlRate,
    updateSensorCount,
    importSensorProduction,
    importSensorProductionBR,
  } = useProcurement({
    budgetId,
    bridges,
    components,
    globalExtras: globalExtraItems,
  });
  const { toast } = useToast();

  // Estado do diálogo "Adicionar item"
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    bridgeKey: "",
    category: "",
    componentName: "",
    unit: "Unid.",
    qty: 1,
    unitPrice: 0,
  });

  const [search, setSearch] = useState("");
  const [bridgeFilter, setBridgeFilter] = useState<string>("all");
  const [purchaseFilter, setPurchaseFilter] = useState<string>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"category" | "bridge">("category");

  const bridgeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((r) => {
      if (!seen.has(r.bridge_key)) seen.set(r.bridge_key, r.bridge_name);
    });
    return Array.from(seen.entries()).map(([key, name]) => ({ key, name }));
  }, [rows]);

  const balanceOf = (r: ProcurementRow) => {
    // Saldo a comprar = qty - estoque (se já comprado/entregue, considera atendido)
    if (r.purchase_status === "sim" && r.delivery_status === "sim") return 0;
    const need = Math.max(0, Number(r.qty) - Number(r.in_stock || 0));
    return Math.round(need * 1000) / 1000;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (bridgeFilter !== "all" && r.bridge_key !== bridgeFilter) return false;
      if (purchaseFilter !== "all" && r.purchase_status !== purchaseFilter) return false;
      if (deliveryFilter !== "all" && r.delivery_status !== deliveryFilter) return false;
      if (pendingOnly && balanceOf(r) <= 0) return false;
      if (q) {
        const hay = `${r.component_id} ${r.component_name} ${r.category} ${r.supplier} ${r.bridge_name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, bridgeFilter, purchaseFilter, deliveryFilter, pendingOnly]);

  // Indicadores
  const stats = useMemo(() => {
    const inScope = rows.filter((r) => r.in_scope);
    const total = inScope.length;
    const bought = inScope.filter((r) => r.purchase_status === "sim").length;
    const partial = inScope.filter((r) => r.purchase_status === "parcial").length;
    const delivered = inScope.filter((r) => r.delivery_status === "sim").length;
    const pendingRows = inScope.filter((r) => balanceOf(r) > 0);
    const pendingValue = pendingRows.reduce(
      (s, r) => s + balanceOf(r) * Number(r.unit_price_ref),
      0
    );
    const totalRef = inScope.reduce((s, r) => s + Number(r.total_ref), 0);
    const totalPaid = inScope.reduce((s, r) => s + Number(r.amount_paid) * Number(r.qty), 0);
    return {
      total,
      bought,
      partial,
      delivered,
      pending: pendingRows.length,
      pendingValue,
      totalRef,
      totalPaid,
      pctBought: total ? Math.round((bought / total) * 100) : 0,
      pctDelivered: total ? Math.round((delivered / total) * 100) : 0,
    };
  }, [rows]);

  const handleExportXlsx = () => {
    const sorted = [...rows].sort(
      (a, b) =>
        categorySortKey(a.category) - categorySortKey(b.category) ||
        a.category.localeCompare(b.category) ||
        a.bridge_name.localeCompare(b.bridge_name) ||
        a.component_name.localeCompare(b.component_name)
    );
    const data = sorted.map((r) => {
      const qtyBought =
        r.purchase_status === "sim"
          ? Number(r.qty)
          : Number(r.qty_bought || 0);
      const saldoComprar = Math.max(0, Number(r.qty) - qtyBought);
      const paidTotal = Number(r.amount_paid) * Number(r.qty);
      return {
        ID: r.component_id,
        Item: r.component_name,
        Categoria: r.category,
        Ponte: r.bridge_name,
        Unidade: r.unit,
        Qtd: Number(r.qty),
        Estoque: Number(r.in_stock || 0),
        "Qtd Comprada": qtyBought,
        "Saldo a comprar": saldoComprar,
        "Preço unit. ref. (R$)": Number(r.unit_price_ref),
        "Total ref. (R$)": Number(r.total_ref),
        "Status compra": STATUS_LABEL[r.purchase_status],
        "Valor pago unit. (R$)": Number(r.amount_paid),
        "Valor pago total (R$)": Math.round(paidTotal * 100) / 100,
        "Data compra": r.purchase_date || "",
        "Status entrega": STATUS_LABEL[r.delivery_status],
        "Data entrega": r.delivery_date || "",
        Link: r.purchase_url || "",
        Observações: r.notes || "",
        "No escopo": r.in_scope ? "Sim" : "Não",
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 10 }, { wch: 40 }, { wch: 22 }, { wch: 22 }, { wch: 8 },
      { wch: 8 }, { wch: 9 }, { wch: 13 }, { wch: 15 }, { wch: 18 },
      { wch: 16 }, { wch: 13 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
      { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Compras");

    // Aba de resumo
    const summary = [
      ["Itens (escopo)", stats.total],
      ["Comprados", stats.bought],
      ["Compras parciais", stats.partial],
      ["Entregues", stats.delivered],
      ["Pendentes (saldo > 0)", stats.pending],
      ["Valor pendente (R$)", Math.round(stats.pendingValue * 100) / 100],
      ["Total referência (R$)", Math.round(stats.totalRef * 100) / 100],
      ["Total pago (R$)", Math.round(stats.totalPaid * 100) / 100],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet([["Indicador", "Valor"], ...summary]);
    ws2["!cols"] = [{ wch: 26 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Resumo");

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `lista-compras-${stamp}.xlsx`);
    toast({ title: "Excel exportado" });
  };

  // Agrupado conforme viewMode
  const grouped = useMemo(() => {
    if (viewMode === "category") {
      // Categoria → linhas (todas as pontes juntas)
      const g = new Map<string, ProcurementRow[]>();
      filtered.forEach((r) => {
        if (!g.has(r.category)) g.set(r.category, []);
        g.get(r.category)!.push(r);
      });
      // Ordena categorias
      const sorted = Array.from(g.entries()).sort(
        ([a], [b]) => categorySortKey(a) - categorySortKey(b) || a.localeCompare(b)
      );
      // Dentro da categoria, ordena por nome do item depois ponte
      sorted.forEach(([, arr]) =>
        arr.sort(
          (a, b) =>
            a.component_name.localeCompare(b.component_name) ||
            a.bridge_name.localeCompare(b.bridge_name)
        )
      );
      return sorted;
    }
    // viewMode === "bridge"
    const g = new Map<string, ProcurementRow[]>();
    filtered.forEach((r) => {
      const label = `${r.bridge_name}|||${r.bridge_key}`;
      if (!g.has(label)) g.set(label, []);
      g.get(label)!.push(r);
    });
    g.forEach((arr) =>
      arr.sort(
        (a, b) =>
          categorySortKey(a.category) - categorySortKey(b.category) ||
          a.component_name.localeCompare(b.component_name)
      )
    );
    return Array.from(g.entries());
  }, [filtered, viewMode]);

  const colSpan = 14;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-heading font-bold text-foreground">Lista de Compras & Estoque</h2>
        </div>
        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {loading && (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sincronizando…
              </span>
            )}
            {!loading && saving && (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…
              </span>
            )}
            {!loading && !saving && budgetId && (
              <span className="flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" /> Salvo
              </span>
            )}
          </div>
          <Dialog
            open={addOpen}
            onOpenChange={(o) => {
              setAddOpen(o);
              if (o) {
                setAddForm({
                  bridgeKey: bridges[0]?.id || GLOBAL_EXTRAS_KEY,
                  category: "",
                  componentName: "",
                  unit: "Unid.",
                  qty: 1,
                  unitPrice: 0,
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-1.5 font-heading bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!budgetId}
                title={!budgetId ? "Salve o orçamento primeiro" : "Adicionar item de compra"}
              >
                <Plus className="h-4 w-4" /> Adicionar item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Adicionar item de compra</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Ponte / Agrupamento</Label>
                  <Select
                    value={addForm.bridgeKey}
                    onValueChange={(v) => setAddForm((f) => ({ ...f, bridgeKey: v }))}
                  >
                    <SelectTrigger className="mt-1 h-9 text-sm font-heading">
                      <SelectValue placeholder="Selecionar ponte..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bridges.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name || "OAE sem nome"}
                        </SelectItem>
                      ))}
                      <SelectItem value={GLOBAL_EXTRAS_KEY}>— Extras Globais —</SelectItem>
                      <SelectItem value={SENSOR_PROD_KEY}>— Produção de Sensores —</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Categoria</Label>
                    <Select
                      value={addForm.category}
                      onValueChange={(v) => setAddForm((f) => ({ ...f, category: v }))}
                    >
                      <SelectTrigger className="mt-1 h-9 text-sm font-heading">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          new Set([
                            ...defaultCategories,
                            ...components.map((c) => c.category),
                            "Itens Adicionais",
                          ])
                        )
                          .filter(Boolean)
                          .map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Unidade</Label>
                    <Input
                      value={addForm.unit}
                      onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
                      placeholder="Unid., m, kg..."
                      className="mt-1 h-9 text-sm"
                      maxLength={20}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nome do item</Label>
                  <Input
                    value={addForm.componentName}
                    onChange={(e) => setAddForm((f) => ({ ...f, componentName: e.target.value }))}
                    placeholder="Descrição do componente"
                    className="mt-1 h-9 text-sm"
                    maxLength={200}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Quantidade</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={addForm.qty}
                      onChange={(e) => setAddForm((f) => ({ ...f, qty: +e.target.value || 0 }))}
                      className="no-spinner mt-1 h-9 text-sm font-heading font-semibold text-right tabular-nums"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Preço unit. ref. (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={addForm.unitPrice}
                      onChange={(e) => setAddForm((f) => ({ ...f, unitPrice: +e.target.value || 0 }))}
                      className="no-spinner mt-1 h-9 text-sm font-heading font-semibold text-right tabular-nums"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)} className="font-heading">
                  Cancelar
                </Button>
                <Button
                  className="font-heading bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={async () => {
                    const name = addForm.componentName.trim();
                    if (!name) {
                      toast({ title: "Informe o nome do item", variant: "destructive" });
                      return;
                    }
                    if (!addForm.bridgeKey) {
                      toast({ title: "Selecione a ponte", variant: "destructive" });
                      return;
                    }
                    const bridge = bridges.find((b) => b.id === addForm.bridgeKey);
                    const bridgeName =
                      addForm.bridgeKey === GLOBAL_EXTRAS_KEY
                        ? "— Extras Globais —"
                        : addForm.bridgeKey === SENSOR_PROD_KEY
                          ? "Produção de Sensores"
                          : bridge?.name || "OAE sem nome";
                    await addCustomItem({
                      bridgeKey: addForm.bridgeKey,
                      bridgeName,
                      category: addForm.category.trim() || "Itens Adicionais",
                      componentName: name,
                      unit: addForm.unit.trim() || "Unid.",
                      qty: addForm.qty,
                      unitPrice: addForm.unitPrice,
                    });
                    setAddOpen(false);
                    toast({ title: "Item adicionado" });
                  }}
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 font-heading"
            onClick={handleExportXlsx}
            disabled={rows.length === 0}
            title="Exportar lista de compras para Excel"
          >
            <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
          </Button>
        </div>
      </div>

      {!budgetId && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="pt-4 text-sm">
            Salve o orçamento para começar a registrar compras. As marcações
            ficam guardadas por orçamento.
          </CardContent>
        </Card>
      )}

      {/* Configurações de produção de sensores */}
      {budgetId && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Taxa USD → BRL</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={usdBrlRate}
                  onChange={(e) => updateUsdBrlRate(+e.target.value || 0)}
                  className="no-spinner mt-1 h-9 w-32 text-base font-heading font-semibold text-right tabular-nums"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Nº de sensores <span className="text-[10px]">(referência inicial)</span>
                </Label>
                <Input
                  type="number"
                  step="1"
                  min={1}
                  value={sensorCount}
                  onChange={(e) => updateSensorCount(+e.target.value || 1)}
                  className="no-spinner mt-1 h-9 w-32 text-base font-heading font-semibold text-right tabular-nums"
                />
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  className="font-heading gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={async () => {
                    await importSensorProductionBR();
                    toast({ title: "Componentes importados (baseline Carvalho Pinto)" });
                  }}
                >
                  <Plus className="h-4 w-4" /> Importar componentes de produção
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-heading gap-1.5"
                  onClick={async () => {
                    await importSensorProduction();
                    toast({ title: "Componentes importados (LCSC / Alibaba)" });
                  }}
                  title="Versão alternativa com fornecedores internacionais"
                >
                  <Plus className="h-4 w-4" /> Internacional (LCSC)
                </Button>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Os componentes do sensor são <strong>globais</strong> (iguais para todas as pontes). A quantidade é editável diretamente na tabela e não é mais sobrescrita pelo nº de sensores. O campo "Nº de sensores" serve apenas como sugestão inicial ao importar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Itens</p>
            <p className="text-2xl font-heading font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Comprados</p>
            <p className="text-2xl font-heading font-bold text-primary">
              {stats.bought}{" "}
              <span className="text-sm text-muted-foreground">({stats.pctBought}%)</span>
            </p>
          </CardContent>
        </Card>
        <Card className={stats.partial > 0 ? "border-accent/40" : ""}>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Parciais</p>
            <p className={`text-2xl font-heading font-bold ${stats.partial > 0 ? "text-accent" : "text-muted-foreground"}`}>
              {stats.partial}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Entregues</p>
            <p className="text-2xl font-heading font-bold text-primary">
              {stats.delivered}{" "}
              <span className="text-sm text-muted-foreground">({stats.pctDelivered}%)</span>
            </p>
          </CardContent>
        </Card>
        <Card
          className={stats.pending > 0 ? "border-accent/60 bg-accent/5" : ""}
        >
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pendentes (saldo &gt; 0)</p>
            <p className={`text-2xl font-heading font-bold ${stats.pending > 0 ? "text-accent" : "text-muted-foreground"}`}>
              {stats.pending}
            </p>
            <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
              {formatCurrency(stats.pendingValue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Ref.</p>
            <p className="text-lg font-heading font-bold">{formatCurrency(stats.totalRef)}</p>
          </CardContent>
        </Card>
        <Card
          className={
            stats.totalPaid > stats.totalRef
              ? "border-accent/60 bg-accent/5"
              : ""
          }
        >
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Pago</p>
            <p
              className={`text-lg font-heading font-bold ${
                stats.totalPaid > stats.totalRef ? "text-accent" : "text-primary"
              }`}
            >
              {formatCurrency(stats.totalPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toggle de visualização */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as "category" | "bridge")}
          className="bg-muted/40 p-1 rounded-md"
        >
          <ToggleGroupItem
            value="category"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-heading text-xs gap-1.5 h-8 px-3"
          >
            <Layers className="h-3.5 w-3.5" /> Por categoria (global)
          </ToggleGroupItem>
          <ToggleGroupItem
            value="bridge"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-heading text-xs gap-1.5 h-8 px-3"
          >
            <Boxes className="h-3.5 w-3.5" /> Por ponte
          </ToggleGroupItem>
        </ToggleGroup>

        <Button
          variant={pendingOnly ? "default" : "outline"}
          size="sm"
          className={`font-heading text-xs gap-1.5 ${pendingOnly ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
          onClick={() => setPendingOnly((v) => !v)}
        >
          <Package className="h-3.5 w-3.5" />
          {pendingOnly ? "Mostrando pendentes" : "Apenas pendentes"}
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar item, ID, ponte…"
            className="pl-9 h-9 font-heading text-sm"
          />
        </div>
        <Select value={bridgeFilter} onValueChange={setBridgeFilter}>
          <SelectTrigger className="h-9 text-sm font-heading">
            <SelectValue placeholder="Ponte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as pontes</SelectItem>
            {bridgeOptions.map((b) => (
              <SelectItem key={b.key} value={b.key}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={purchaseFilter} onValueChange={setPurchaseFilter}>
          <SelectTrigger className="h-9 text-sm font-heading">
            <SelectValue placeholder="Compra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Compra: todas</SelectItem>
            <SelectItem value="nao">Não comprados</SelectItem>
            <SelectItem value="parcial">Compra parcial</SelectItem>
            <SelectItem value="sim">Comprados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
          <SelectTrigger className="h-9 text-sm font-heading">
            <SelectValue placeholder="Entrega" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Entrega: todas</SelectItem>
            <SelectItem value="nao">Não entregues</SelectItem>
            <SelectItem value="parcial">Entrega parcial</SelectItem>
            <SelectItem value="sim">Entregues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabelas agrupadas */}
      {grouped.map(([groupKey, groupRows]) => {
        const isOutOfScope = groupRows.every((r) => !r.in_scope);
        const scopeRows = groupRows.filter((r) => r.in_scope);
        const groupTotal = scopeRows.reduce((s, r) => s + Number(r.total_ref), 0);
        const groupPaid = scopeRows.reduce((s, r) => s + Number(r.amount_paid) * Number(r.qty), 0);
        const groupPending = groupRows.filter((r) => balanceOf(r) > 0).length;
        const [groupLabel] = viewMode === "bridge" ? groupKey.split("|||") : [groupKey];

        return (
          <div key={groupKey} className="rounded-lg border overflow-hidden">
            <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-sm">{groupLabel}</h3>
                <Badge variant="outline" className="text-[10px] bg-background/10 border-background/30 text-primary-foreground">
                  {groupRows.length} {groupRows.length === 1 ? "item" : "itens"}
                </Badge>
                {groupPending > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-accent/30 border-accent/50 text-accent-foreground">
                    {groupPending} pendente{groupPending > 1 ? "s" : ""}
                  </Badge>
                )}
                {isOutOfScope && (
                  <Badge variant="outline" className="text-[10px] bg-background/10 border-background/30 text-primary-foreground">
                    Fora do escopo
                  </Badge>
                )}
              </div>
              <div className="text-xs font-heading flex gap-4">
                <span>Ref: {formatCurrency(groupTotal)}</span>
                <span className={groupPaid > groupTotal ? "text-accent-foreground" : ""}>
                  Pago: {formatCurrency(groupPaid)}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: "1600px" }}>
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground">
                    <th className="px-2 py-2 text-left font-medium w-16">ID</th>
                    <th className="px-2 py-2 text-left font-medium">Item</th>
                    {viewMode === "category" && (
                      <th className="px-2 py-2 text-left font-medium w-32">Ponte</th>
                    )}
                    <th className="px-2 py-2 text-right font-medium w-28">Qtd</th>
                    <th className="px-2 py-2 text-right font-medium w-24">Estoque</th>
                    <th className="px-2 py-2 text-center font-medium w-16">Saldo</th>
                    <th className="px-2 py-2 text-right font-medium w-40">Preço unit. ref.</th>
                    <th className="px-2 py-2 text-right font-medium w-28">Total ref.</th>
                    <th className="px-2 py-2 text-center font-medium w-[100px]">Comprado?</th>
                    <th className="px-2 py-2 text-right font-medium w-28">Qtd compr.</th>
                    <th className="px-2 py-2 text-right font-medium w-44">Valor pago unit.</th>
                    <th className="px-2 py-2 text-left font-medium w-28">Link</th>
                    <th className="px-2 py-2 text-left font-medium w-28">Data compra</th>
                    <th className="px-2 py-2 text-center font-medium w-[100px]">Entregue?</th>
                    <th className="px-2 py-2 text-left font-medium w-28">Data entrega</th>
                    <th className="px-2 py-2 text-left font-medium w-28">Obs.</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Subgrupos: em modo "bridge" agrupa por categoria; em modo "category" não subdivide.
                    const subgroups = new Map<string, ProcurementRow[]>();
                    if (viewMode === "bridge") {
                      groupRows.forEach((r) => {
                        if (!subgroups.has(r.category)) subgroups.set(r.category, []);
                        subgroups.get(r.category)!.push(r);
                      });
                    } else {
                      subgroups.set("__none__", groupRows);
                    }
                    const totalCols = colSpan + (viewMode === "category" ? 1 : 0);
                    return Array.from(subgroups.entries()).map(([subKey, subRows]) => (
                      <Fragment key={`sub-${groupKey}-${subKey}`}>
                        {subKey !== "__none__" && (
                          <tr className="bg-muted/20 border-t">
                            <td colSpan={totalCols} className="px-3 py-1.5 font-heading text-[11px] uppercase tracking-wider text-muted-foreground">
                              {subKey}
                            </td>
                          </tr>
                        )}
                        {subRows.map((r) => {
                          const paidTotal = Number(r.amount_paid) * Number(r.qty);
                          const divergePay =
                            Number(r.amount_paid) > 0 &&
                            Math.abs(paidTotal - Number(r.total_ref)) > 0.01;
                          const saldo = balanceOf(r);
                          return (
                            <tr
                              key={`${r.bridge_key}-${r.component_id}`}
                              className={`border-t hover:bg-muted/20 ${!r.in_scope ? "opacity-60" : ""}`}
                            >
                              <td className="px-2 py-1.5 font-mono text-muted-foreground">{r.component_id}</td>
                              <td className="px-2 py-1.5">{r.component_name}</td>
                              {viewMode === "category" && (
                                <td className="px-2 py-1.5 text-[11px] text-muted-foreground truncate max-w-[150px]" title={r.bridge_name}>
                                  {r.bridge_name}
                                </td>
                              )}
                              <td className="px-1 py-1.5">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={r.qty ?? 0}
                                  onChange={(e) =>
                                    updateRow(r.bridge_key, r.component_id, {
                                      qty: +e.target.value || 0,
                                    })
                                  }
                                  className="no-spinner h-9 px-2 text-sm text-right font-heading font-bold tabular-nums"
                                  title="Quantidade"
                                />
                                <div className="text-[10px] text-muted-foreground text-right pr-1 mt-0.5">{r.unit}</div>
                              </td>
                              <td className="px-1 py-1.5">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={r.in_stock || ""}
                                  onChange={(e) =>
                                    updateRow(r.bridge_key, r.component_id, {
                                      in_stock: +e.target.value || 0,
                                    })
                                  }
                                  placeholder="0"
                                  className="no-spinner h-9 px-2 text-sm text-right font-heading tabular-nums"
                                  title="Quantidade em estoque"
                                />
                              </td>
                              <td className="px-1 py-1.5 text-center">
                                <Badge
                                  variant="outline"
                                  className={`text-[11px] font-heading tabular-nums ${
                                    saldo > 0
                                      ? "bg-accent/15 text-accent border-accent/40"
                                      : "bg-primary/10 text-primary border-primary/30"
                                  }`}
                                >
                                  {saldo > 0 ? saldo : "OK"}
                                </Badge>
                              </td>
                              <td className="px-2 py-1.5">
                                <div className="relative">
                                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-heading font-semibold text-muted-foreground">R$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={r.unit_price_ref ?? 0}
                                    onChange={(e) =>
                                      updateRow(r.bridge_key, r.component_id, {
                                        unit_price_ref: +e.target.value || 0,
                                      })
                                    }
                                    className="no-spinner h-10 pl-8 pr-2 text-base text-right font-heading font-bold tabular-nums"
                                    title="Preço unitário de referência"
                                  />
                                </div>
                              </td>
                              <td className="px-2 py-1.5 text-right font-heading font-medium text-xs tabular-nums text-muted-foreground">
                                {formatCurrency(Number(r.total_ref))}
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <StatusSelect
                                  value={r.purchase_status}
                                  onChange={(v) => updateRow(r.bridge_key, r.component_id, { purchase_status: v })}
                                  ariaLabel={`Status de compra ${r.component_id}`}
                                />
                              </td>
                              <td className="px-1 py-1.5">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={
                                    r.purchase_status === "sim"
                                      ? Number(r.qty)
                                      : r.qty_bought || ""
                                  }
                                  disabled={r.purchase_status === "sim"}
                                  onChange={(e) => {
                                    const val = +e.target.value || 0;
                                    const total = Number(r.qty);
                                    const patch: any = { qty_bought: val };
                                    if (val <= 0) patch.purchase_status = "nao";
                                    else if (val >= total) {
                                      patch.purchase_status = "sim";
                                      patch.qty_bought = total;
                                    } else patch.purchase_status = "parcial";
                                    updateRow(r.bridge_key, r.component_id, patch);
                                  }}
                                  placeholder="0"
                                  className="no-spinner h-9 px-2 text-sm text-right font-heading tabular-nums"
                                  title="Quantidade já comprada"
                                />
                                <div className="text-[10px] text-muted-foreground text-right pr-1 mt-0.5">
                                  de {Number(r.qty)}
                                </div>
                              </td>
                              <td className="px-2 py-1.5">
                                <div className="relative">
                                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-heading font-semibold text-muted-foreground">R$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={r.amount_paid || ""}
                                    onChange={(e) =>
                                      updateRow(r.bridge_key, r.component_id, {
                                        amount_paid: +e.target.value || 0,
                                      })
                                    }
                                    placeholder="0,00"
                                    className={`no-spinner h-10 pl-8 pr-2 text-base text-right font-heading font-bold tabular-nums ${
                                      divergePay ? "border-accent text-accent" : ""
                                    }`}
                                  />
                                </div>
                              </td>
                              <td className="px-2 py-1.5">
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="url"
                                    value={r.purchase_url || ""}
                                    onChange={(e) =>
                                      updateRow(r.bridge_key, r.component_id, { purchase_url: e.target.value })
                                    }
                                    placeholder="https://…"
                                    className="h-8 text-xs"
                                  />
                                  {r.purchase_url && (
                                    <a
                                      href={r.purchase_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-accent shrink-0"
                                      title="Abrir link"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-1.5">
                                <Input
                                  type="date"
                                  value={r.purchase_date || ""}
                                  onChange={(e) =>
                                    updateRow(r.bridge_key, r.component_id, {
                                      purchase_date: e.target.value || null,
                                    })
                                  }
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <StatusSelect
                                  value={r.delivery_status}
                                  onChange={(v) => updateRow(r.bridge_key, r.component_id, { delivery_status: v })}
                                  ariaLabel={`Status de entrega ${r.component_id}`}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <Input
                                  type="date"
                                  value={r.delivery_date || ""}
                                  onChange={(e) =>
                                    updateRow(r.bridge_key, r.component_id, {
                                      delivery_date: e.target.value || null,
                                    })
                                  }
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <Input
                                  value={r.notes}
                                  onChange={(e) =>
                                    updateRow(r.bridge_key, r.component_id, { notes: e.target.value })
                                  }
                                  placeholder="—"
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="px-1 py-1.5 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-7 w-7 ${r.in_scope ? "text-muted-foreground hover:text-accent" : "text-accent"}`}
                                    title={r.in_scope ? "Excluir da soma (já incluso em outro item)" : "Incluir na soma"}
                                    onClick={() =>
                                      updateRow(r.bridge_key, r.component_id, { in_scope: !r.in_scope })
                                    }
                                  >
                                    {r.in_scope ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                  </Button>
                                  {r.component_id.startsWith("CUSTOM-") && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      title="Remover item adicionado"
                                      onClick={() => removeRow(r.bridge_key, r.component_id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {grouped.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground text-center">
            Nenhum item para mostrar com os filtros atuais.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
