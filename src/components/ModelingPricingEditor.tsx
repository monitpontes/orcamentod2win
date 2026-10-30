import { useMemo, useState } from "react";
import { BridgeSpan } from "@/data/bridgeConfig";
import { BudgetSummary, formatCurrency } from "@/lib/budgetCalculations";
import { applyModelingPricingBatch, filterModelingBridges, ModelingMode } from "@/lib/modelingPricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Layers, Search, Undo2 } from "lucide-react";

interface Props {
  bridges: BridgeSpan[];
  summary: BudgetSummary;
  onChange: (bridges: BridgeSpan[]) => void;
}

type PricingSnapshot = Pick<BridgeSpan, "modelingPricingMode" | "manualModelingSimulationFinalValue">;

export default function ModelingPricingEditor({ bridges, summary, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [typology, setTypology] = useState("all");
  const [mode, setMode] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchMode, setBatchMode] = useState<ModelingMode>("manual");
  const [batchValue, setBatchValue] = useState("");
  const [undo, setUndo] = useState<Map<string, PricingSnapshot> | null>(null);
  const filtered = useMemo(() => filterModelingBridges(bridges, query, typology, mode), [bridges, query, typology, mode]);
  const costs = useMemo(() => new Map(summary.bridgeCosts.map((cost) => [cost.bridgeId, cost])), [summary.bridgeCosts]);
  const types = [...new Set(bridges.map((bridge) => bridge.typology))];
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  const selectedIds = new Set(bridges.filter((bridge) => selected.has(bridge.id)).map((bridge) => bridge.id));
  const selectedOutsideFilter = selectedIds.size - filtered.filter((bridge) => selectedIds.has(bridge.id)).length;
  const allPageSelected = rows.length > 0 && rows.every((bridge) => selectedIds.has(bridge.id));
  const commercialFactor = 1 + summary.bdiRate + summary.taxRate;
  const validBatch = batchMode === "automatic" || (batchValue.trim() !== "" && Number.isFinite(Number(batchValue)) && Number(batchValue) >= 0);

  const update = (id: string, patch: Partial<BridgeSpan>) => {
    setUndo(null);
    onChange(bridges.map((bridge) => bridge.id === id ? { ...bridge, ...patch } : bridge));
  };
  const toggle = (ids: string[], checked: boolean) => {
    setSelected((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  };
  const applyBatch = () => {
    if (!selectedIds.size || !validBatch) return;
    setUndo(new Map(bridges.filter((bridge) => selectedIds.has(bridge.id)).map((bridge) => [bridge.id, {
      modelingPricingMode: bridge.modelingPricingMode,
      manualModelingSimulationFinalValue: bridge.manualModelingSimulationFinalValue,
    }])));
    onChange(applyModelingPricingBatch(bridges, selectedIds, batchMode, Number(batchValue)));
    setBatchOpen(false);
  };

  return (
    <Card className="overflow-hidden border-accent/30">
      <CardHeader className="border-b bg-accent/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-heading"><Layers className="h-5 w-5 text-accent" /> Edição rápida — Modelagem e simulação</CardTitle>
        <p className="text-sm text-muted-foreground">Edite o preço final direto na lista ou selecione várias pontes para aplicar o mesmo valor por OAE.</p>
        <div className="grid gap-3 pt-2 sm:grid-cols-3">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar pontes na edição de preços" placeholder="Buscar ponte ou código..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="pl-9" /></div>
          <Select value={typology} onValueChange={(value) => { setTypology(value); setPage(1); }}><SelectTrigger aria-label="Filtrar preços por tipologia"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as tipologias</SelectItem>{types.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>
          <Select value={mode} onValueChange={(value) => { setMode(value); setPage(1); }}><SelectTrigger aria-label="Filtrar forma de cálculo"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os modos de cálculo</SelectItem><SelectItem value="manual">Somente manuais</SelectItem><SelectItem value="automatic">Somente automáticos</SelectItem></SelectContent></Select>
        </div>
      </CardHeader>
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-3">
        <span className="mr-2 text-sm font-medium" role="status">{selectedIds.size} selecionada(s) de {bridges.length}</span>
        {selectedOutsideFilter > 0 && <span className="text-xs text-amber-700">{selectedOutsideFilter} selecionada(s) fora do filtro atual</span>}
        <Button size="sm" variant="outline" disabled={!filtered.length} onClick={() => toggle(filtered.map((bridge) => bridge.id), true)}>Selecionar todas as {filtered.length} filtradas</Button>
        <Button size="sm" variant="ghost" disabled={!selectedIds.size} onClick={() => setSelected(new Set())}>Limpar seleção</Button>
        <Button size="sm" disabled={!selectedIds.size} onClick={() => setBatchOpen(true)}>Editar selecionadas</Button>
        {undo && <Button size="sm" variant="outline" onClick={() => { onChange(bridges.map((bridge) => undo.has(bridge.id) ? { ...bridge, ...undo.get(bridge.id) } : bridge)); setUndo(null); }}><Undo2 className="mr-1 h-4 w-4" /> Desfazer último lote</Button>}
      </div>
      <CardContent className="p-0">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="sticky top-0 z-10 bg-muted text-xs text-muted-foreground"><tr>
              <th className="w-12 px-4 py-3"><Checkbox aria-label="Selecionar pontes desta página" checked={allPageSelected ? true : rows.some((bridge) => selectedIds.has(bridge.id)) ? "indeterminate" : false} onCheckedChange={(checked) => toggle(rows.map((bridge) => bridge.id), checked === true)} /></th>
              <th className="px-3 py-3 text-left">Ponte / OAE</th><th className="px-3 py-3 text-left">Cálculo</th><th className="px-3 py-3 text-right">Preço final (R$)</th><th className="px-4 py-3 text-right">Valor-base (R$)</th>
            </tr></thead>
            <tbody>{rows.map((bridge) => {
              const manual = bridge.modelingPricingMode === "manual";
              const base = costs.get(bridge.id)?.modeling || 0;
              return <tr key={bridge.id} className={`border-t ${selectedIds.has(bridge.id) ? "bg-accent/5" : "hover:bg-muted/20"}`}>
                <td className="px-4 py-3"><Checkbox aria-label={`Selecionar ${bridge.name || bridge.id}`} checked={selectedIds.has(bridge.id)} onCheckedChange={(checked) => toggle([bridge.id], checked === true)} /></td>
                <td className="px-3 py-3"><p className="font-medium">{bridge.name || "OAE sem nome"}</p><p className="text-xs text-muted-foreground">{bridge.typology} · {bridge.spanCount} vão(s) × {bridge.spanLength} m</p></td>
                <td className="w-40 px-3 py-3"><Select value={bridge.modelingPricingMode || "automatic"} onValueChange={(value: ModelingMode) => update(bridge.id, { modelingPricingMode: value })}><SelectTrigger className="h-9" aria-label={`Cálculo de ${bridge.name || bridge.id}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="automatic">Automático</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent></Select></td>
                <td className="w-48 px-3 py-3 text-right">{manual ? <Input aria-label={`Preço final de ${bridge.name || bridge.id}`} type="number" min={0} step="0.01" className="h-9 text-right font-heading" value={bridge.manualModelingSimulationFinalValue} onChange={(event) => update(bridge.id, { manualModelingSimulationFinalValue: Math.max(0, Number(event.target.value) || 0) })} /> : <span className="font-heading">{formatCurrency(base * commercialFactor)}</span>}</td>
                <td className="px-4 py-3 text-right font-heading text-muted-foreground">{formatCurrency(base)}</td>
              </tr>;
            })}</tbody>
          </table>
          {!rows.length && <p className="p-8 text-center text-muted-foreground">Nenhuma ponte corresponde aos filtros.</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <span className="text-xs text-muted-foreground">{filtered.length ? start + 1 : 0}–{Math.min(start + pageSize, filtered.length)} de {filtered.length} pontes · Preço final já inclui BDI e impostos.</span>
          <div className="flex items-center gap-2"><Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}><SelectTrigger className="h-8 w-28" aria-label="Pontes por página"><SelectValue /></SelectTrigger><SelectContent>{[15, 30, 50].map((size) => <SelectItem key={size} value={String(size)}>{size} por página</SelectItem>)}</SelectContent></Select><Button size="icon" variant="outline" className="h-8 w-8" aria-label="Página anterior de preços" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-xs">{currentPage} / {pageCount}</span><Button size="icon" variant="outline" className="h-8 w-8" aria-label="Próxima página de preços" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight className="h-4 w-4" /></Button></div>
        </div>
      </CardContent>
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}><DialogContent><DialogHeader><DialogTitle>Editar {selectedIds.size} pontes em lote</DialogTitle><DialogDescription>A alteração afeta somente as pontes selecionadas, inclusive as selecionadas em outras páginas ou filtros.</DialogDescription></DialogHeader>
        <p className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
          {bridges.filter((bridge) => selectedIds.has(bridge.id)).slice(0, 3).map((bridge) => bridge.name || "OAE sem nome").join(" · ")}
          {selectedIds.size > 3 ? ` · e mais ${selectedIds.size - 3} ponte(s)` : ""}
        </p>
        <Label>Forma de cálculo</Label><Select value={batchMode} onValueChange={(value: ModelingMode) => setBatchMode(value)}><SelectTrigger aria-label="Forma de cálculo em lote"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Mesmo preço final por ponte</SelectItem><SelectItem value="automatic">Voltar ao cálculo automático</SelectItem></SelectContent></Select>
        {batchMode === "manual" && <><Label htmlFor="batch-modeling-value">Modelagem e simulação — preço final por ponte (R$)</Label><Input id="batch-modeling-value" type="number" min={0} step="0.01" value={batchValue} onChange={(event) => setBatchValue(event.target.value)} /><p className="text-xs text-muted-foreground">Inclui BDI e impostos. O mesmo valor será aplicado individualmente a cada OAE, substituindo seus preços manuais anteriores.</p>{validBatch && <p className="rounded-md bg-muted p-3 text-sm">Total final do lote: <strong>{formatCurrency(Number(batchValue) * selectedIds.size)}</strong></p>}</>}
        {batchMode === "automatic" && <p className="text-sm text-muted-foreground">Os valores manuais ficam guardados. O cálculo passa a usar novamente a composição cadastrada.</p>}
        <DialogFooter><Button variant="outline" onClick={() => setBatchOpen(false)}>Cancelar</Button><Button disabled={!validBatch || !selectedIds.size} onClick={applyBatch}>Aplicar em {selectedIds.size} pontes</Button></DialogFooter>
      </DialogContent></Dialog>
    </Card>
  );
}
