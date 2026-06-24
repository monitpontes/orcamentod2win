import { Fragment, useMemo, useState } from "react";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";
import { categories as defaultCategories } from "@/data/components";
import { useProcurement, ProcurementRow, PurchaseStatus } from "@/hooks/useProcurement";
import { formatCurrency } from "@/lib/budgetCalculations";
import { GLOBAL_EXTRAS_KEY } from "@/lib/materialsList";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Search, Loader2, CheckCircle2, Plus, Trash2 } from "lucide-react";

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
  const { rows, loading, saving, updateRow, addCustomItem, removeRow } = useProcurement({
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

  const bridgeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((r) => {
      if (!seen.has(r.bridge_key)) seen.set(r.bridge_key, r.bridge_name);
    });
    return Array.from(seen.entries()).map(([key, name]) => ({ key, name }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (bridgeFilter !== "all" && r.bridge_key !== bridgeFilter) return false;
      if (purchaseFilter !== "all" && r.purchase_status !== purchaseFilter) return false;
      if (deliveryFilter !== "all" && r.delivery_status !== deliveryFilter) return false;
      if (q) {
        const hay = `${r.component_id} ${r.component_name} ${r.category} ${r.supplier}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, bridgeFilter, purchaseFilter, deliveryFilter]);

  // Indicadores
  const stats = useMemo(() => {
    const inScope = rows.filter((r) => r.in_scope);
    const total = inScope.length;
    const bought = inScope.filter((r) => r.purchase_status === "sim").length;
    const delivered = inScope.filter((r) => r.delivery_status === "sim").length;
    const totalRef = inScope.reduce((s, r) => s + Number(r.total_ref), 0);
    const totalPaid = inScope.reduce((s, r) => s + Number(r.amount_paid), 0);
    return {
      total,
      bought,
      delivered,
      totalRef,
      totalPaid,
      pctBought: total ? Math.round((bought / total) * 100) : 0,
      pctDelivered: total ? Math.round((delivered / total) * 100) : 0,
    };
  }, [rows]);

  // Agrupado por ponte → categoria
  const grouped = useMemo(() => {
    const g = new Map<string, { name: string; categories: Map<string, ProcurementRow[]> }>();
    filtered.forEach((r) => {
      if (!g.has(r.bridge_key)) {
        g.set(r.bridge_key, { name: r.bridge_name, categories: new Map() });
      }
      const bucket = g.get(r.bridge_key)!;
      if (!bucket.categories.has(r.category)) bucket.categories.set(r.category, []);
      bucket.categories.get(r.category)!.push(r);
    });
    return g;
  }, [filtered]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-heading font-bold text-foreground">Lista de Compras</h2>
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
                      className="mt-1 h-9 text-sm font-heading text-right"
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
                      className="mt-1 h-9 text-sm font-heading text-right"
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

      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Entregues</p>
            <p className="text-2xl font-heading font-bold text-primary">
              {stats.delivered}{" "}
              <span className="text-sm text-muted-foreground">({stats.pctDelivered}%)</span>
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

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar item, ID, fornecedor…"
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
      {Array.from(grouped.entries()).map(([bridgeKey, { name, categories }]) => {
        const bridgeRows = Array.from(categories.values()).flat();
        const isOutOfScope = bridgeRows.every((r) => !r.in_scope);
        const bridgeTotal = bridgeRows.reduce((s, r) => s + Number(r.total_ref), 0);
        const bridgePaid = bridgeRows.reduce((s, r) => s + Number(r.amount_paid), 0);

        return (
          <div key={bridgeKey} className="rounded-lg border overflow-hidden">
            <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-sm">{name}</h3>
                {isOutOfScope && (
                  <Badge variant="outline" className="text-[10px] bg-background/10 border-background/30 text-primary-foreground">
                    Fora do escopo
                  </Badge>
                )}
              </div>
              <div className="text-xs font-heading flex gap-4">
                <span>Ref: {formatCurrency(bridgeTotal)}</span>
                <span className={bridgePaid > bridgeTotal ? "text-accent-foreground" : ""}>
                  Pago: {formatCurrency(bridgePaid)}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground">
                    <th className="px-2 py-2 text-left font-medium w-20">ID</th>
                    <th className="px-2 py-2 text-left font-medium">Item</th>
                    <th className="px-2 py-2 text-right font-medium w-16">Qtd</th>
                    <th className="px-2 py-2 text-right font-medium w-28">Preço unit. ref.</th>
                    <th className="px-2 py-2 text-right font-medium w-24">Total ref.</th>
                    <th className="px-2 py-2 text-center font-medium w-[110px]">Comprado?</th>
                    <th className="px-2 py-2 text-right font-medium w-32">Valor pago</th>
                    <th className="px-2 py-2 text-left font-medium w-48">Fornecedor / Local</th>
                    <th className="px-2 py-2 text-left font-medium w-36">Data compra</th>
                    <th className="px-2 py-2 text-center font-medium w-[110px]">Entregue?</th>
                    <th className="px-2 py-2 text-left font-medium w-36">Data entrega</th>
                    <th className="px-2 py-2 text-left font-medium w-48">Obs.</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>

                </thead>
                <tbody>
                  {Array.from(categories.entries()).map(([cat, catRows]) => (
                    <Fragment key={`cat-${bridgeKey}-${cat}`}>
                      <tr className="bg-muted/20 border-t">
                        <td colSpan={13} className="px-3 py-1.5 font-heading text-[11px] uppercase tracking-wider text-muted-foreground">
                          {cat}
                        </td>
                      </tr>
                      {catRows.map((r) => {
                        const divergePay =
                          Number(r.amount_paid) > 0 &&
                          Math.abs(Number(r.amount_paid) - Number(r.total_ref)) > 0.01;
                        return (
                          <tr
                            key={`${r.bridge_key}-${r.component_id}`}
                            className={`border-t hover:bg-muted/20 ${!r.in_scope ? "opacity-60" : ""}`}
                          >
                            <td className="px-2 py-1.5 font-mono text-muted-foreground">{r.component_id}</td>
                            <td className="px-2 py-1.5">{r.component_name}</td>
                            <td className="px-2 py-1.5 text-right font-heading">
                              {r.qty} <span className="text-muted-foreground">{r.unit}</span>
                            </td>
                            <td className="px-2 py-1.5 text-right font-heading">
                              {formatCurrency(Number(r.total_ref))}
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <StatusSelect
                                value={r.purchase_status}
                                onChange={(v) => updateRow(r.bridge_key, r.component_id, { purchase_status: v })}
                                ariaLabel={`Status de compra ${r.component_id}`}
                              />
                            </td>
                            <td className="px-2 py-1.5">
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
                                className={`h-8 text-xs text-right font-heading ${
                                  divergePay ? "border-accent text-accent" : ""
                                }`}
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <Input
                                value={r.supplier}
                                onChange={(e) =>
                                  updateRow(r.bridge_key, r.component_id, { supplier: e.target.value })
                                }
                                placeholder="—"
                                className="h-8 text-xs"
                              />
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
                            </td>
                          </tr>

                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {grouped.size === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground text-center">
            Nenhum item para mostrar com os filtros atuais.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
