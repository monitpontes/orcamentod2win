import {
  BridgeSpan,
  BridgeTypology,
  applyEprReferenceQuantities,
  applyBridgeTemplate,
  applySupportSetRule,
  bridgeFromInventoryRow,
  bridgeNeedsReview,
  calculateAutomaticTemperatureCount,
  createDefaultBridge,
  isBeamTypology,
  isEprInventory,
} from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Building2, ChevronLeft, ChevronRight, FileSpreadsheet, Pencil, Plus, Search, Trash2, PackagePlus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

interface Props {
  bridges: BridgeSpan[];
  onUpdate: (bridges: BridgeSpan[]) => void;
  components: ComponentItem[];
}

const typologies: BridgeTypology[] = [
  "Viga I", "Viga retangular", "Viga T", "Caixão", "Laje - seção única",
  "Laje - duas vias", "Passarela", "Viga I + Caixão", "Outra", "Manual",
];

export default function BridgeConfig({ bridges, onUpdate, components }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [typologyFilter, setTypologyFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addBridge = () => {
    const bridge = createDefaultBridge();
    onUpdate([...bridges, bridge]);
    setSelectedId(bridge.id);
  };

  const removeBridge = (id: string) => {
    onUpdate(bridges.filter((bridge) => bridge.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const replaceBridge = (id: string, update: Partial<BridgeSpan>, reapplyTemplate = false) => {
    onUpdate(bridges.map((bridge) => {
      if (bridge.id !== id) return bridge;
      const updated = { ...bridge, ...update };
      if (reapplyTemplate) return applyBridgeTemplate(updated);
      if ("sensorCount" in update || "temperatureCount" in update) {
        return applySupportSetRule(updated);
      }
      if ("solarKitCount" in update) {
        const energySets = Math.max(0, Number(updated.solarKitCount) || 0);
        return { ...updated, commandBoxCount: energySets, postCount: energySets };
      }
      return updated;
    }));
  };

  const updateBridge = (id: string, field: keyof BridgeSpan, value: unknown) => {
    replaceBridge(id, { [field]: value } as Partial<BridgeSpan>);
  };

  const handleInventoryImport = async (file?: File) => {
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets["OAEs Existentes"] ?? workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
      const parsed = rows.slice(2).map((row) => bridgeFromInventoryRow(row)).filter((bridge): bridge is BridgeSpan => Boolean(bridge));
      if (!parsed.length) throw new Error("Nenhuma OAE foi encontrada na planilha.");
      const useEprReference = /\bepr\b/i.test(file.name) || isEprInventory(parsed);
      const imported = useEprReference
        ? parsed.map((bridge) => applyBridgeTemplate(applyEprReferenceQuantities(bridge)))
        : parsed;
      if (bridges.some((bridge) => bridge.name.trim()) && !window.confirm(`Substituir as ${bridges.length} OAE(s) atuais pelas ${imported.length} da planilha?`)) return;
      onUpdate(imported);
      setPage(1);
      setSelectedId(null);
      toast({
        title: `${imported.length} OAEs importadas`,
        description: useEprReference
          ? "Foi usado o maior quantitativo entre a proposta EPR de referência e a regra recalculada. Revise as OAEs sinalizadas."
          : "As regras por vão foram aplicadas. Revise as vigas sem quantidade e as tipologias ainda não confirmadas.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível importar a planilha",
        description: error instanceof Error ? error.message : "Verifique o arquivo selecionado.",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const stats = useMemo(() => ({
    total: bridges.length,
    review: bridges.filter(bridgeNeedsReview).length,
    sensors: bridges.reduce((total, bridge) => total + bridge.sensorCount + bridge.temperatureCount, 0),
  }), [bridges]);

  const filteredBridges = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return bridges.filter((bridge) => {
      if (reviewOnly && !bridgeNeedsReview(bridge)) return false;
      if (typologyFilter !== "all" && bridge.typology !== typologyFilter) return false;
      if (!query) return true;
      return [bridge.name, bridge.inventoryCode, bridge.structuralSection, bridge.typology]
        .some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(query));
    });
  }, [bridges, reviewOnly, search, typologyFilter]);

  const pageSize = 15;
  const pageCount = Math.max(1, Math.ceil(filteredBridges.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageBridges = filteredBridges.slice(pageStart, pageStart + pageSize);

  const selectedBridge = bridges.find((bridge) => bridge.id === selectedId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-accent" />
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">Configuração das Pontes</h2>
            <p className="text-sm text-muted-foreground">Importe o inventário e revise somente as OAEs que precisam de informação do desenho.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.xlsm" className="hidden" onChange={(event) => handleInventoryImport(event.target.files?.[0])} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Importar inventário
          </Button>
          <Button onClick={addBridge} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4" /> Adicionar OAE
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="OAEs" value={stats.total} />
        <Stat label="Prontas" value={stats.total - stats.review} />
        <Stat label="Para revisar" value={stats.review} highlight={stats.review > 0} />
        <Stat label="Sensores" value={stats.sensors} />
      </div>

      {bridges.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Importe o inventário ou adicione uma OAE para começar.</CardContent></Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="border-b py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar OAE, código ou seção..." className="pl-9" />
              </div>
              <Select value={typologyFilter} onValueChange={(value) => { setTypologyFilter(value); setPage(1); }}><SelectTrigger className="md:w-48" aria-label="Filtrar pontes por tipologia"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as tipologias</SelectItem>{typologies.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>
              <div className="flex items-center gap-2">
                <Switch checked={reviewOnly} onCheckedChange={(checked) => { setReviewOnly(checked); setPage(1); }} id="review-only" />
                <Label htmlFor="review-only" className="text-sm">Mostrar somente pendentes</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[1360px] text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">OAE</th><th className="px-3 py-2 text-left">Tipologia</th>
                  <th className="px-3 py-2 text-right">Vãos</th><th className="px-3 py-2 text-right">Vigas/vão</th>
                  <th className="px-3 py-2 text-right">Estruturais</th><th className="px-3 py-2 text-right">Temperatura</th><th className="px-3 py-2 text-center">Preço</th>
                  <th className="px-3 py-2 text-right">Conect. / 10</th><th className="px-3 py-2 text-right">Energia / 20</th>
                  <th className="px-3 py-2 text-right">Postes</th>
                  <th className="px-3 py-2 text-center">Status</th><th className="px-3 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageBridges.map((bridge) => (
                  <tr key={bridge.id} className="border-t align-middle hover:bg-muted/20">
                    <td className="px-3 py-2 min-w-64">
                      <Input value={bridge.name} onChange={(event) => updateBridge(bridge.id, "name", event.target.value)} className="h-8" />
                      {bridge.structuralSection && <span className="mt-1 block text-[11px] text-muted-foreground">{bridge.structuralSection}</span>}
                    </td>
                    <td className="px-3 py-2 w-44">
                      <Select value={bridge.typology} onValueChange={(value: BridgeTypology) => replaceBridge(bridge.id, { typology: value }, true)}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{typologies.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <NumberCell value={bridge.spanCount} min={1} onChange={(value) => replaceBridge(bridge.id, { spanCount: value }, true)} />
                    <NumberCell value={bridge.beamCount} disabled={!isBeamTypology(bridge.typology)} onChange={(value) => replaceBridge(bridge.id, { beamCount: value }, true)} />
                    <NumberCell value={bridge.sensorCount} onChange={(value) => updateBridge(bridge.id, "sensorCount", value)} />
                    <td className="px-3 py-2 text-right font-medium">{bridge.temperatureCount}</td>
                    <td className="px-3 py-2 text-center"><Badge variant={bridge.sensorPriceMultiplier === 2 ? "default" : "outline"}>{bridge.sensorPriceMultiplier}×</Badge></td>
                    <NumberCell value={bridge.connectivityKitCount} onChange={(value) => updateBridge(bridge.id, "connectivityKitCount", value)} />
                    <NumberCell value={bridge.solarKitCount} onChange={(value) => updateBridge(bridge.id, "solarKitCount", value)} />
                    <td className="px-3 py-2 text-right font-medium">{bridge.postCount}</td>
                    <td className="px-3 py-2 text-center"><Badge variant={bridgeNeedsReview(bridge) ? "destructive" : "secondary"}>{bridgeNeedsReview(bridge) ? "Revisar" : "Pronta"}</Badge></td>
                    <td className="px-3 py-2"><div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar detalhes" onClick={() => setSelectedId(bridge.id)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir OAE" onClick={() => removeBridge(bridge.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredBridges.length && <p className="p-8 text-center text-muted-foreground">Nenhuma OAE corresponde ao filtro.</p>}
          </CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">{filteredBridges.length ? pageStart + 1 : 0}–{Math.min(pageStart + pageSize, filteredBridges.length)} de {filteredBridges.length} pontes</span>
            <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</Button><span className="text-xs">{currentPage} / {pageCount}</span><Button size="sm" variant="outline" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Próxima <ChevronRight className="ml-1 h-4 w-4" /></Button></div>
          </div>
        </Card>
      )}

      <Dialog open={Boolean(selectedBridge)} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader className="sr-only"><DialogTitle>Editar {selectedBridge?.name || "ponte"}</DialogTitle><DialogDescription>Configuração, preços e itens adicionais da ponte selecionada.</DialogDescription></DialogHeader>
          {selectedBridge && <BridgeCard key={selectedBridge.id} bridge={selectedBridge} components={components} onUpdate={updateBridge} onReplace={replaceBridge} onRemove={removeBridge} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return <Card className={highlight ? "border-destructive/40" : ""}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-heading font-bold">{value}</p></CardContent></Card>;
}

function NumberCell({ value, onChange, disabled = false, min = 0 }: { value: number; onChange: (value: number) => void; disabled?: boolean; min?: number }) {
  return <td className="px-3 py-2 w-24"><Input type="number" min={min} value={value} disabled={disabled} onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))} className="h-8 text-right" /></td>;
}

interface BridgeCardProps {
  bridge: BridgeSpan;
  components: ComponentItem[];
  onUpdate: (id: string, field: keyof BridgeSpan, value: unknown) => void;
  onReplace: (id: string, update: Partial<BridgeSpan>, reapplyTemplate?: boolean) => void;
  onRemove: (id: string) => void;
}

function BridgeCard({ bridge, components, onUpdate, onReplace, onRemove }: BridgeCardProps) {
  const [selectedComponent, setSelectedComponent] = useState("");
  const automaticTemperatureCount = calculateAutomaticTemperatureCount(bridge.typology, bridge.spanCount);
  const availableComponents = components.filter((component) => !bridge.extraItems.some((item) => item.componentId === component.id));
  const addExtra = () => {
    if (!selectedComponent) return;
    onUpdate(bridge.id, "extraItems", [...bridge.extraItems, { componentId: selectedComponent, qty: 1 }]);
    setSelectedComponent("");
  };

  return (
    <Card className="overflow-hidden border-accent/40">
      <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4">
        <div><CardTitle className="text-lg font-heading">Detalhes — {bridge.name || "OAE sem nome"}</CardTitle><p className="text-xs text-muted-foreground mt-1">Regra automática: 1 conjunto de conectividade por grupo iniciado de 10 sensores, com mínimo de 1 por vão; 1 conjunto de energia por grupo iniciado de 20 sensores, com mínimo de 1 a cada 2 vãos. Painel, quadro e baterias acompanham Energia; a quantidade de postes segue o conjunto, mantendo a premissa de fornecimento pelo cliente.</p></div>
        <Button variant="ghost" size="icon" onClick={() => onRemove(bridge.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Seção estrutural"><Input value={bridge.structuralSection} onChange={(e) => onUpdate(bridge.id, "structuralSection", e.target.value)} /></Field>
          <Field label="Tipologia"><Select value={bridge.typology} onValueChange={(value: BridgeTypology) => onReplace(bridge.id, { typology: value }, true)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{typologies.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Comp. vão (m)"><Input type="number" value={bridge.spanLength} onChange={(e) => onUpdate(bridge.id, "spanLength", +e.target.value)} /></Field>
          <Field label="Qtd. vãos"><Input type="number" min={1} value={bridge.spanCount} onChange={(e) => onReplace(bridge.id, { spanCount: +e.target.value }, true)} /></Field>
          {isBeamTypology(bridge.typology) && <Field label="Vigas por vão (do desenho)"><Input type="number" min={0} value={bridge.beamCount} onChange={(e) => onReplace(bridge.id, { beamCount: +e.target.value }, true)} /></Field>}
          <Field label="Qtd. sensores"><Input type="number" min={0} value={bridge.sensorCount} onChange={(e) => onUpdate(bridge.id, "sensorCount", +e.target.value)} /></Field>
          <Field label="Fator de preço do sensor"><Input type="number" min={1} value={bridge.sensorPriceMultiplier} onChange={(e) => onUpdate(bridge.id, "sensorPriceMultiplier", +e.target.value)} /></Field>
          <Field label={`Qtd. temperatura (${automaticTemperatureCount === null ? "manual" : "automática"})`}><Input type="number" min={0} value={bridge.temperatureCount} readOnly={automaticTemperatureCount !== null} className={automaticTemperatureCount !== null ? "bg-muted/40" : ""} onChange={(e) => onUpdate(bridge.id, "temperatureCount", +e.target.value)} /></Field>
          {bridge.quantityReference && <Field label="Piso do comparativo"><div className="flex h-10 items-center"><Badge variant="outline">{bridge.referenceSensorCount || 0} estruturais · {bridge.referenceTemperatureCount || 0} temperatura</Badge></div></Field>}
          <Field label="Fonte de energia"><Select value={bridge.energySource} onValueChange={(value) => onUpdate(bridge.id, "energySource", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Solar">Solar</SelectItem><SelectItem value="Rede">Rede elétrica</SelectItem></SelectContent></Select></Field>
          <Field label="Conjuntos de conectividade"><Input type="number" min={0} value={bridge.connectivityKitCount} onChange={(e) => onUpdate(bridge.id, "connectivityKitCount", +e.target.value)} /></Field>
          <Field label="Conjuntos de energia"><Input type="number" min={0} value={bridge.solarKitCount} onChange={(e) => onUpdate(bridge.id, "solarKitCount", +e.target.value)} /></Field>
          <Field label="Postes no conjunto de energia"><Input type="number" value={bridge.postCount} readOnly className="bg-muted/40" /></Field>
          <Field label="Dist. cabos extra (m)"><Input type="number" min={0} value={bridge.extraCableDistance} onChange={(e) => onUpdate(bridge.id, "extraCableDistance", +e.target.value)} /></Field>
          <Field label="Conectividade"><Select value={bridge.connectivity} onValueChange={(value) => onUpdate(bridge.id, "connectivity", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Completa">Completa</SelectItem><SelectItem value="Parcial">Parcial</SelectItem></SelectContent></Select></Field>
          <Field label="Horas adequação"><Input type="number" min={0} value={bridge.hoursAdequation} onChange={(e) => onUpdate(bridge.id, "hoursAdequation", +e.target.value)} /></Field>
          <Field label="Horas montagem"><Input type="number" min={0} value={bridge.hoursAssembly} onChange={(e) => onUpdate(bridge.id, "hoursAssembly", +e.target.value)} /></Field>
          <Field label="Infraestrutura de campo"><div className="flex items-center h-10"><Badge variant="outline">Cliente — fora do orçamento</Badge></div></Field>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span>Comprimento total: {bridge.spanLength * bridge.spanCount} m</span><span>Temperatura: {automaticTemperatureCount === null ? "preenchimento manual até validar a tipologia" : "cálculo automático por vão"}</span>{bridge.quantityReference && <span>Critério EPR: nunca reduz abaixo do maior quantitativo do comparativo revisado</span>}<Button size="sm" variant="outline" onClick={() => onReplace(bridge.id, {}, true)}>Reaplicar padrão</Button></div>

        <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
          <div>
            <h3 className="font-heading font-semibold">Modelagem e simulação</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Escolha o cálculo pela composição ou informe um único valor final de modelagem e simulação para esta ponte.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Forma de cálculo">
              <Select value={bridge.modelingPricingMode || "automatic"} onValueChange={(value) => onUpdate(bridge.id, "modelingPricingMode", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automático — composição</SelectItem>
                  <SelectItem value="manual">Manual — valor final por ponte</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {bridge.modelingPricingMode === "manual" && (
              <Field label="Modelagem e simulação — valor final (R$)">
                <Input type="number" min={0} step="0.01" value={bridge.manualModelingSimulationFinalValue} onChange={(event) => onUpdate(bridge.id, "manualModelingSimulationFinalValue", Math.max(0, Number(event.target.value) || 0))} />
              </Field>
            )}
          </div>
          {bridge.modelingPricingMode === "manual" && <p className="text-xs text-muted-foreground">
            Inclua neste valor o BDI e os impostos configurados no orçamento. O sistema calcula o valor-base sem esses acréscimos e mantém o total informado na proposta. Informe zero para não cobrar. O valor fica guardado ao alternar o modo.
          </p>}
        </div>


        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3"><PackagePlus className="h-4 w-4 text-accent" /><span className="text-sm font-heading font-semibold">Itens extras</span></div>
          <div className="space-y-2 mb-3">
            {bridge.extraItems.map((item) => {
              const component = components.find((candidate) => candidate.id === item.componentId);
              return <div key={item.componentId} className="flex items-center gap-2 text-sm"><span className="font-mono text-xs text-muted-foreground w-16">{item.componentId}</span><span className="flex-1 truncate">{component?.name || item.componentId}</span><Input type="number" className="w-20 h-8" value={item.qty} onChange={(e) => onUpdate(bridge.id, "extraItems", bridge.extraItems.map((candidate) => candidate.componentId === item.componentId ? { ...candidate, qty: +e.target.value } : candidate))} /><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onUpdate(bridge.id, "extraItems", bridge.extraItems.filter((candidate) => candidate.componentId !== item.componentId))}><Trash2 className="h-3 w-3" /></Button></div>;
            })}
          </div>
          <div className="flex items-center gap-2"><Select value={selectedComponent} onValueChange={setSelectedComponent}><SelectTrigger className="flex-1 h-8"><SelectValue placeholder="Selecionar componente..." /></SelectTrigger><SelectContent>{availableComponents.map((component) => <SelectItem key={component.id} value={component.id}>{component.id} — {component.name}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" className="h-8 gap-1" disabled={!selectedComponent} onClick={addExtra}><Plus className="h-3 w-3" /> Adicionar</Button></div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
