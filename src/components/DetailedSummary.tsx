import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";
import {
  BudgetSummary as BudgetSummaryType,
  BridgeCosts,
  CompositionDetailLine,
  formatCurrency,
} from "@/lib/budgetCalculations";
import { BUDGET_GROUPS } from "@/data/compositions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SENSOR_BOM, SENSOR_BOM_UNIT_COST } from "@/data/sensorBom";
import { ClipboardList } from "lucide-react";


interface LineItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  qty: number;
  total: number;
  category?: string;
}

const THIRD_PARTY_CATEGORY = "Infraestrutura de Terceiros";

function getCategory(components: ComponentItem[], id: string): string {
  return components.find((c) => c.id === id)?.category ?? "";
}

function getPrice(components: ComponentItem[], id: string): number {
  return components.find((c) => c.id === id)?.unitPrice ?? 0;
}

function getName(components: ComponentItem[], id: string): string {
  return components.find((c) => c.id === id)?.name ?? id;
}

function getUnit(components: ComponentItem[], id: string): string {
  return components.find((c) => c.id === id)?.unit ?? "Unid.";
}

function buildBridgeLines(
  costs: BridgeCosts,
  bridge: BridgeSpan,
  components: ComponentItem[]
): { category: string; items: LineItem[] }[] {
  const sections: { category: string; items: LineItem[] }[] = [];

  const toLine = (l: CompositionDetailLine): LineItem => ({
    id: l.componentId,
    name: l.componentName,
    unit: l.unit,
    unitPrice: l.unitPrice,
    qty: Math.round(l.qty * 1000) / 1000,
    total: l.total,
    category: getCategory(components, l.componentId),
  });

  BUDGET_GROUPS.forEach(({ key, label }) => {
    const lines = costs.details[key] ?? [];
    if (lines.length > 0) {
      sections.push({ category: label, items: lines.map(toLine) });
    }
  });

  // Itens Extras da ponte
  if (bridge.extraItems && bridge.extraItems.length > 0) {
    sections.push({
      category: "Itens Adicionais",
      items: bridge.extraItems.map((e) => ({
        id: e.componentId,
        name: getName(components, e.componentId),
        unit: getUnit(components, e.componentId),
        unitPrice: getPrice(components, e.componentId),
        qty: e.qty,
        total: getPrice(components, e.componentId) * e.qty,
        category: getCategory(components, e.componentId),
      })),
    });
  }

  return sections;
}


function buildGlobalExtrasLines(globalExtras: ExtraItem[], components: ComponentItem[]): LineItem[] {
  return globalExtras.map((e) => ({
    id: e.componentId,
    name: getName(components, e.componentId),
    unit: getUnit(components, e.componentId),
    unitPrice: getPrice(components, e.componentId),
    qty: e.qty,
    total: getPrice(components, e.componentId) * e.qty,
    category: getCategory(components, e.componentId),
  }));
}

interface Props {
  bridges: BridgeSpan[];
  components: ComponentItem[];
  summary: BudgetSummaryType;
  globalExtraItems: ExtraItem[];
}

export default function DetailedSummary({ bridges, components, summary, globalExtraItems }: Props) {
  const globalLines = buildGlobalExtrasLines(globalExtraItems, components);
  const globalTotal = globalLines.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-accent" />
        <h2 className="text-2xl font-heading font-bold text-foreground">
          Resumo Detalhado
        </h2>
      </div>

      {bridges.map((bridge) => {
        const costs = summary.bridgeCosts.find((bc) => bc.bridgeId === bridge.id);
        if (!costs) return null;
        const sections = buildBridgeLines(costs, bridge, components);
        const bridgeTotal = sections.reduce(
          (sum, s) => sum + s.items.reduce((s2, i) => s2 + i.total, 0),
          0
        );

        return (
          <Card key={bridge.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="font-heading text-lg flex items-center justify-between">
                <span>{bridge.name || "OAE sem nome"}</span>
                <span className="text-accent">{formatCurrency(bridgeTotal)}</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {bridge.spanCount} vão(s) × {bridge.spanLength}m · {bridge.sensorCount} sensores · {bridge.energySource} · {bridge.connectivity}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {sections.map((section) => {
                const sectionTotal = section.items.reduce((s, i) => s + i.total, 0);
                return (
                  <div key={section.category}>
                    <div className="px-4 py-2 bg-muted/40 border-y flex items-center justify-between">
                      <span className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wide">
                        {section.category}
                      </span>
                      <span className="text-xs font-heading font-semibold text-muted-foreground">
                        {formatCurrency(sectionTotal)}
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b">
                          <th className="px-4 py-1.5 text-left font-medium">ID</th>
                          <th className="px-4 py-1.5 text-left font-medium">Item</th>
                          <th className="px-4 py-1.5 text-center font-medium">Unid.</th>
                          <th className="px-4 py-1.5 text-right font-medium">Preço Unit.</th>
                          <th className="px-4 py-1.5 text-right font-medium">Qtd.</th>
                          <th className="px-4 py-1.5 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((item) => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.id}</td>
                            <td className="px-4 py-2">
                              {item.name}
                              {item.category === THIRD_PARTY_CATEGORY && (
                                <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-heading font-semibold uppercase rounded bg-accent/15 text-accent border border-accent/30">
                                  Terceiros
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center text-muted-foreground">{item.unit}</td>
                            <td className="px-4 py-2 text-right font-heading text-xs">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-2 text-right font-heading text-xs">{item.qty}</td>
                            <td className="px-4 py-2 text-right font-heading text-xs font-semibold">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* BOM unitário do sensor — dentro da seção Sensores */}
                    {section.category === "Sensores" && (
                      <div className="border-t bg-muted/10">
                        <div className="px-4 py-2 flex items-center justify-between">
                          <span className="text-[11px] font-heading font-semibold text-accent uppercase tracking-wide">
                            Materiais a comprar por sensor ({bridge.sensorCount} un.)
                          </span>
                          <span className="text-[11px] font-heading font-semibold text-accent">
                            {formatCurrency(SENSOR_BOM_UNIT_COST * bridge.sensorCount)}
                          </span>
                        </div>
                        <p className="px-4 pb-1.5 text-[11px] text-muted-foreground italic">
                          Insumos por sensor (referência de compra) — já contemplados no custo dos sensores acima, não somam no total.
                        </p>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-muted-foreground border-y">
                              <th className="px-4 py-1.5 text-left font-medium">Item</th>
                              <th className="px-4 py-1.5 text-center font-medium">Unid.</th>
                              <th className="px-4 py-1.5 text-right font-medium">Qtd./sensor</th>
                              <th className="px-4 py-1.5 text-right font-medium">Preço Unit.</th>
                              <th className="px-4 py-1.5 text-right font-medium">Qtd. total</th>
                              <th className="px-4 py-1.5 text-right font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {SENSOR_BOM.map((item) => (
                              <tr key={item.name} className="border-b last:border-0 hover:bg-muted/20">
                                <td className="px-4 py-2 pl-6">{item.name}</td>
                                <td className="px-4 py-2 text-center text-muted-foreground">{item.unit}</td>
                                <td className="px-4 py-2 text-right font-heading text-xs">{item.qtyPerSensor}x</td>
                                <td className="px-4 py-2 text-right font-heading text-xs">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-4 py-2 text-right font-heading text-xs font-semibold">
                                  {item.qtyPerSensor * bridge.sensorCount}
                                </td>
                                <td className="px-4 py-2 text-right font-heading text-xs font-semibold">
                                  {formatCurrency(item.qtyPerSensor * item.unitPrice * bridge.sensorCount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

            </CardContent>
          </Card>
        );
      })}


      {/* Global extras */}
      {globalLines.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="font-heading text-lg flex items-center justify-between">
              <span>Custos Adicionais Globais</span>
              <span className="text-accent">{formatCurrency(globalTotal)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="px-4 py-1.5 text-left font-medium">ID</th>
                  <th className="px-4 py-1.5 text-left font-medium">Item</th>
                  <th className="px-4 py-1.5 text-center font-medium">Unid.</th>
                  <th className="px-4 py-1.5 text-right font-medium">Preço Unit.</th>
                  <th className="px-4 py-1.5 text-right font-medium">Qtd.</th>
                  <th className="px-4 py-1.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {globalLines.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.id}</td>
                    <td className="px-4 py-2">
                      {item.name}
                      {item.category === THIRD_PARTY_CATEGORY && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-heading font-semibold uppercase rounded bg-accent/15 text-accent border border-accent/30">
                          Terceiros
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{item.unit}</td>
                    <td className="px-4 py-2 text-right font-heading text-xs">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-2 text-right font-heading text-xs">{item.qty}</td>
                    <td className="px-4 py-2 text-right font-heading text-xs font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Totais gerais */}
      <Card className="overflow-hidden border-accent/50">
        <CardHeader className="bg-accent/10 pb-3">
          <CardTitle className="font-heading text-lg">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal (pontes)</span>
              <span className="font-heading font-semibold">{formatCurrency(summary.subtotal)}</span>
            </div>
            {summary.globalExtrasCost > 0 && (
              <div className="flex justify-between">
                <span>Extras globais</span>
                <span className="font-heading font-semibold">{formatCurrency(summary.globalExtrasCost)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Subtotal Geral</span>
              <span className="font-heading font-bold">{formatCurrency(summary.grandSubtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>BDI ({(summary.bdiRate * 100).toFixed(0)}%)</span>
              <span className="font-heading">{formatCurrency(summary.bdiValue)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Impostos ({(summary.taxRate * 100).toFixed(0)}%)</span>
              <span className="font-heading">{formatCurrency(summary.taxValue)}</span>
            </div>
            {summary.thirdPartyTotal > 0 && (
              <>
                <div className="flex justify-between text-accent">
                  <span>Infraestrutura de Terceiros (sem BDI/Impostos)</span>
                  <span className="font-heading">{formatCurrency(summary.thirdPartyTotal)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground italic -mt-1">
                  Repasse direto: terceiros somam apenas no valor final, sem incidência de BDI ou impostos.
                </p>
              </>
            )}
            <div className="flex justify-between border-t pt-2 text-lg">
              <span className="font-heading font-bold">Valor da Proposta</span>
              <span className="font-heading font-bold text-accent">{formatCurrency(summary.proposalValue)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Acompanhamento Mensal</span>
              <span className="font-heading font-semibold text-primary">{formatCurrency(summary.monthlyAccompaniment)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
