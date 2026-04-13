import { BudgetSummary as BudgetSummaryType, formatCurrency } from "@/lib/budgetCalculations";
import { generateBudgetDocx } from "@/lib/generateDocx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, DollarSign, FileDown } from "lucide-react";

interface Props {
  summary: BudgetSummaryType;
  clientName: string;
  onClientNameChange: (name: string) => void;
  onBdiChange: (rate: number) => void;
  onTaxChange: (rate: number) => void;
  onMarkupChange: (markup: number) => void;
}

export default function BudgetSummaryView({
  summary,
  clientName,
  onClientNameChange,
  onBdiChange,
  onTaxChange,
  onMarkupChange,
}: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Orçamento
          </h2>
        </div>
        <Button
          onClick={() => generateBudgetDocx(summary, clientName || undefined)}
          className="gap-1.5 font-heading"
          size="sm"
        >
          <FileDown className="h-4 w-4" /> Exportar Word
        </Button>
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
      {summary.bridgeCosts.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-4 py-3 text-left font-heading">OAE</th>
                <th className="px-4 py-3 text-right font-heading">Sensores</th>
                <th className="px-4 py-3 text-right font-heading">Infra</th>
                <th className="px-4 py-3 text-right font-heading">Energia</th>
                <th className="px-4 py-3 text-right font-heading">Conect.</th>
                <th className="px-4 py-3 text-right font-heading">Cx. Comando</th>
                <th className="px-4 py-3 text-right font-heading">Equipamentos</th>
                <th className="px-4 py-3 text-right font-heading">Modelagem</th>
                <th className="px-4 py-3 text-right font-heading">Extras</th>
                <th className="px-4 py-3 text-right font-heading font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {summary.bridgeCosts.map((bc, idx) => (
                <tr
                  key={bc.bridgeId}
                  className={`border-t ${idx % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                >
                  <td className="px-4 py-3 font-medium">{bc.bridgeName}</td>
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
                  <td className="px-4 py-3 text-right font-heading text-xs font-bold text-accent">
                    {formatCurrency(bc.total)}
                  </td>
                </tr>
              ))}
              {summary.globalExtrasCost > 0 && (
                <tr className="border-t bg-muted/30">
                  <td className="px-4 py-3 font-medium italic">Extras Globais</td>
                  <td colSpan={7}></td>
                  <td className="px-4 py-3 text-right font-heading text-xs">
                    {formatCurrency(summary.globalExtrasCost)}
                  </td>
                  <td></td>
                </tr>
              )}
              <tr className="border-t-2 border-accent bg-primary/5 font-bold">
                <td className="px-4 py-3 font-heading">SUBTOTAL</td>
                <td colSpan={8}></td>
                <td className="px-4 py-3 text-right font-heading text-accent">
                  {formatCurrency(summary.grandSubtotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Parameters */}
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

      {/* Final Values */}
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
    </div>
  );
}
