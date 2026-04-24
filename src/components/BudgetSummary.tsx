import { useMemo, useState } from "react";
import { BudgetSummary as BudgetSummaryType, formatCurrency } from "@/lib/budgetCalculations";
import { generateBudgetDocx } from "@/lib/generateDocx";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calculator, TrendingUp, DollarSign, FileDown } from "lucide-react";

const THIRD_PARTY_CATEGORY = "Infraestrutura de Terceiros";

interface Props {
  summary: BudgetSummaryType;
  clientName: string;
  onClientNameChange: (name: string) => void;
  onBdiChange: (rate: number) => void;
  onTaxChange: (rate: number) => void;
  onMarkupChange: (markup: number) => void;
  bridges: BridgeSpan[];
  components: ComponentItem[];
  globalExtraItems: ExtraItem[];
}

function isThirdParty(components: ComponentItem[], id: string): boolean {
  return components.find((c) => c.id === id)?.category === THIRD_PARTY_CATEGORY;
}

function thirdPartyTotal(extras: ExtraItem[] | undefined, components: ComponentItem[]): number {
  if (!extras) return 0;
  return extras.reduce((sum, e) => {
    const comp = components.find((c) => c.id === e.componentId);
    if (!comp || comp.category !== THIRD_PARTY_CATEGORY) return sum;
    return sum + comp.unitPrice * e.qty;
  }, 0);
}

export default function BudgetSummaryView({
  summary,
  clientName,
  onClientNameChange,
  onBdiChange,
  onTaxChange,
  onMarkupChange,
  bridges,
  components,
  globalExtraItems,
}: Props) {
  const [thirdPartyOnly, setThirdPartyOnly] = useState(false);

  // Per-bridge third-party totals (from extra items in the third-party category)
  const bridgeThirdParty = useMemo(() => {
    const map = new Map<string, number>();
    bridges.forEach((b) => map.set(b.id, thirdPartyTotal(b.extraItems, components)));
    return map;
  }, [bridges, components]);

  const globalThirdParty = useMemo(
    () => thirdPartyTotal(globalExtraItems, components),
    [globalExtraItems, components]
  );

  const visibleBridges = thirdPartyOnly
    ? summary.bridgeCosts.filter((bc) => (bridgeThirdParty.get(bc.bridgeId) ?? 0) > 0)
    : summary.bridgeCosts;

  const filteredSubtotal = thirdPartyOnly
    ? Array.from(bridgeThirdParty.values()).reduce((s, v) => s + v, 0) + globalThirdParty
    : summary.grandSubtotal;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Orçamento
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card">
            <Switch
              id="third-party-only"
              checked={thirdPartyOnly}
              onCheckedChange={setThirdPartyOnly}
            />
            <Label htmlFor="third-party-only" className="text-xs font-heading cursor-pointer">
              Apenas Terceiros
            </Label>
          </div>
          <Button
            onClick={() => generateBudgetDocx(summary, clientName || undefined)}
            className="gap-1.5 font-heading"
            size="sm"
          >
            <FileDown className="h-4 w-4" /> Exportar Word
          </Button>
        </div>
      </div>

      {/* Client name */}
      <div className="max-w-sm">
        <Label className="text-xs text-muted-foreground">Nome do Cliente</Label>
        <Input
          value={clientName}
          onChange={(e) => onClientNameChange(e.target.value)}
          placeholder="Ex: DNIT / Concessionária XYZ"
          className="mt-1 font-heading"
        />
      </div>

      {/* Per-bridge breakdown */}
      {visibleBridges.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-4 py-3 text-left font-heading">OAE</th>
                {thirdPartyOnly ? (
                  <th className="px-4 py-3 text-right font-heading font-bold">Terceiros</th>
                ) : (
                  <>
                    <th className="px-4 py-3 text-right font-heading">Sensores</th>
                    <th className="px-4 py-3 text-right font-heading">Infra</th>
                    <th className="px-4 py-3 text-right font-heading">Energia</th>
                    <th className="px-4 py-3 text-right font-heading">Conect.</th>
                    <th className="px-4 py-3 text-right font-heading">Cx. Comando</th>
                    <th className="px-4 py-3 text-right font-heading">Equipamentos</th>
                    <th className="px-4 py-3 text-right font-heading">Modelagem</th>
                    <th className="px-4 py-3 text-right font-heading">Extras</th>
                    <th className="px-4 py-3 text-right font-heading">Terceiros</th>
                    <th className="px-4 py-3 text-right font-heading font-bold">Total</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleBridges.map((bc, idx) => (
                <tr
                  key={bc.bridgeId}
                  className={`border-t ${idx % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                >
                  <td className="px-4 py-3 font-medium">{bc.bridgeName}</td>
                  {thirdPartyOnly ? (
                    <td className="px-4 py-3 text-right font-heading text-xs font-bold text-accent">
                      {formatCurrency(bridgeThirdParty.get(bc.bridgeId) ?? 0)}
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-right font-heading text-xs">
                        {formatCurrency(bc.sensors)}
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-xs">
                        {formatCurrency(bc.infrastructure)}
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-xs">
                        {formatCurrency(bc.energy)}
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-xs">
                        {formatCurrency(bc.connectivity)}
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-xs">
                        {formatCurrency(bc.commandBox)}
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-xs">
                        {formatCurrency(bc.equipmentTotal)}
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-xs">
                        {formatCurrency(bc.modelingEngineering)}
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-xs">
                        {formatCurrency(bc.extraItemsCost)}
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-xs text-accent">
                        {formatCurrency(bc.thirdPartyCost)}
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-xs font-bold text-accent">
                        {formatCurrency(bc.total + bc.thirdPartyCost)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {!thirdPartyOnly && summary.globalExtrasCost > 0 && (
                <tr className="border-t bg-muted/30">
                  <td className="px-4 py-3 font-medium italic">Extras Globais</td>
                  <td colSpan={7}></td>
                  <td className="px-4 py-3 text-right font-heading text-xs">
                    {formatCurrency(summary.globalExtrasCost)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              )}
              {!thirdPartyOnly && summary.thirdPartyTotal > 0 && (
                <tr className="border-t bg-accent/5">
                  <td className="px-4 py-3 font-medium italic text-accent">
                    Terceiros (repasse — sem BDI/Impostos)
                  </td>
                  <td colSpan={8}></td>
                  <td className="px-4 py-3 text-right font-heading text-xs text-accent font-semibold">
                    {formatCurrency(summary.thirdPartyTotal)}
                  </td>
                  <td></td>
                </tr>
              )}
              {thirdPartyOnly && globalThirdParty > 0 && (
                <tr className="border-t bg-muted/30">
                  <td className="px-4 py-3 font-medium italic">Extras Globais (Terceiros)</td>
                  <td className="px-4 py-3 text-right font-heading text-xs">
                    {formatCurrency(globalThirdParty)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-accent bg-primary/5 font-bold">
                <td className="px-4 py-3 font-heading">
                  {thirdPartyOnly ? "TOTAL TERCEIROS" : "SUBTOTAL"}
                </td>
                <td colSpan={thirdPartyOnly ? 0 : 9}></td>
                <td className="px-4 py-3 text-right font-heading text-accent">
                  {formatCurrency(filteredSubtotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {thirdPartyOnly && visibleBridges.length === 0 && globalThirdParty === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground text-center">
            Nenhum item de "Infraestrutura de Terceiros" foi adicionado a este orçamento.
          </CardContent>
        </Card>
      )}

      {/* Parameters */}
      {!thirdPartyOnly && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <Label className="text-xs text-muted-foreground">BDI (%)</Label>
              <Input
                type="number"
                value={(summary.bdiRate * 100).toFixed(0)}
                onChange={(e) => onBdiChange(+e.target.value / 100)}
                className="mt-1 font-heading"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(summary.bdiValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <Label className="text-xs text-muted-foreground">Impostos (%)</Label>
              <Input
                type="number"
                value={(summary.taxRate * 100).toFixed(0)}
                onChange={(e) => onTaxChange(+e.target.value / 100)}
                className="mt-1 font-heading"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(summary.taxValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <Label className="text-xs text-muted-foreground">Markup (x)</Label>
              <Input
                type="number"
                value={summary.markup}
                onChange={(e) => onMarkupChange(+e.target.value)}
                className="mt-1 font-heading"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(summary.markupValue)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Final Values */}
      {!thirdPartyOnly && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-accent/50 bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" />
                Valor da Proposta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-heading font-bold text-accent">
                {formatCurrency(summary.proposalValue)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Acompanhamento Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-heading font-bold text-primary">
                {formatCurrency(summary.monthlyAccompaniment)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">por mês</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
