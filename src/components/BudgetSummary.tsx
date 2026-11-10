import { BudgetSummary as BudgetSummaryType, formatCurrency } from "@/lib/budgetCalculations";
import { generateBudgetDocx } from "@/lib/generateDocx";
import { generateTechnicalProposalDocx } from "@/lib/generateTechnicalDocx";
import { generateMaterialsXlsx } from "@/lib/generateXlsx";
import { inferRoadName, proposalFilename } from "@/lib/proposalFilename";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";
import { Compositions } from "@/data/compositions";
import { CLIENT_SCOPE, SCOPE_ASSUMPTION_TEXT, SUPPLIER_SCOPE } from "@/data/scopeAssumptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import ModelingPricingEditor from "@/components/ModelingPricingEditor";
import { Calculator, TrendingUp, DollarSign, FileDown, FileSpreadsheet, CircleCheck, CircleUserRound, FileText, WalletCards, BadgePercent } from "lucide-react";

interface Props {
  summary: BudgetSummaryType;
  proposalName: string;
  proposalNumber: string;
  onProposalNumberChange: (number: string) => void;
  roadName: string;
  onRoadNameChange: (name: string) => void;
  clientName: string;
  onClientNameChange: (name: string) => void;
  onBdiChange: (rate: number) => void;
  onTaxChange: (rate: number) => void;
  onMarkupChange: (markup: number) => void;
  accompanimentMonths: number;
  onAccompanimentMonthsChange: (months: number) => void;
  onInternalLaborIncludedChange: (included: boolean) => void;
  bridges: BridgeSpan[];
  onBridgesChange: (bridges: BridgeSpan[]) => void;
  components: ComponentItem[];
  globalExtraItems: ExtraItem[];
  compositions: Compositions;
}

export default function BudgetSummaryView({
  summary,
  proposalName,
  proposalNumber,
  onProposalNumberChange,
  roadName,
  onRoadNameChange,
  clientName,
  onClientNameChange,
  onBdiChange,
  onTaxChange,
  onMarkupChange,
  accompanimentMonths,
  onAccompanimentMonthsChange,
  onInternalLaborIncludedChange,
  bridges,
  onBridgesChange,
  components,
  globalExtraItems,
  compositions,
}: Props) {
  const visibleBridges = summary.bridgeCosts;
  const includeInternalLabor = compositions.includeInternalLabor !== false;
  const effectiveRoadName = roadName || inferRoadName(proposalName, bridges);

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
          <Button
            onClick={() => generateMaterialsXlsx(bridges, components, globalExtraItems, clientName || undefined, compositions, 1 + summary.bdiRate + summary.taxRate)}
            variant="outline"
            className="gap-1.5 font-heading"
            size="sm"
            title="Lista de materiais para controle interno"
          >
            <FileSpreadsheet className="h-4 w-4" /> Materiais (Excel)
          </Button>
          <Button
            onClick={() => generateTechnicalProposalDocx(bridges, { clientName, proposalName }, proposalNumber, effectiveRoadName)}
            variant="outline"
            className="gap-1.5 font-heading"
            size="sm"
            title="Gera a proposta técnica no padrão original, com o quadro de sensores preenchido"
          >
            <FileText className="h-4 w-4" /> Proposta Técnica
          </Button>
          <Button
            onClick={() => generateBudgetDocx(summary, clientName || undefined, bridges, globalExtraItems, components, proposalName, proposalNumber, effectiveRoadName)}
            className="gap-1.5 font-heading"
            size="sm"
            title="Gera a proposta comercial com valores, quantitativos e mão de obra preenchidos"
          >
            <FileDown className="h-4 w-4" /> Proposta Comercial
          </Button>
        </div>
      </div>

      {/* Client name */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem]">
        <div>
          <Label htmlFor="proposal-client" className="text-xs text-muted-foreground">Concessionária / cliente</Label>
          <Input id="proposal-client" value={clientName} onChange={(e) => onClientNameChange(e.target.value)} placeholder="Ex: Entrevias" className="mt-1 font-heading" />
        </div>
        <div>
          <Label htmlFor="proposal-road" className="text-xs text-muted-foreground">Rodovia</Label>
          <Input id="proposal-road" value={roadName} onChange={(e) => onRoadNameChange(e.target.value)} placeholder="Ex: SP160" className="mt-1 font-heading" />
        </div>
        <div>
          <Label htmlFor="proposal-number" className="text-xs text-muted-foreground">Número da proposta</Label>
          <Input id="proposal-number" inputMode="numeric" value={proposalNumber} onChange={(e) => onProposalNumberChange(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="001" className="mt-1 font-heading" />
        </div>
        <p className="text-xs text-muted-foreground md:col-span-2">
          Nome do arquivo técnico: <span className="break-all font-mono text-foreground">{proposalFilename(clientName, effectiveRoadName, proposalNumber, "TECNICA")}</span>
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/[0.025]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Escopo e premissas da proposta</CardTitle>
          <p className="text-sm text-muted-foreground">{SCOPE_ASSUMPTION_TEXT}</p>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <ScopeList icon={<CircleCheck className="h-5 w-5 text-accent" />} title="Fornecido pela contratada" items={SUPPLIER_SCOPE} />
          <ScopeList icon={<CircleUserRound className="h-5 w-5 text-primary" />} title="Responsabilidade do cliente" items={CLIENT_SCOPE} />
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div>
            <Label htmlFor="include-internal-labor" className="font-heading font-semibold">
              Incluir mão de obra interna
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Ao desativar, as horas permanecem cadastradas, mas seus custos saem do orçamento e das propostas.
            </p>
          </div>
          <Switch
            id="include-internal-labor"
            checked={includeInternalLabor}
            onCheckedChange={onInternalLaborIncludedChange}
          />
        </CardContent>
      </Card>

      {/* Per-bridge breakdown */}
      <ModelingPricingEditor bridges={bridges} summary={summary} onChange={onBridgesChange} />
      <p className="text-xs text-muted-foreground">
        A modelagem pertence ao consórcio e é apresentada separadamente. O valor informado não recebe BDI ou impostos da d2win.
      </p>
      {visibleBridges.length > 0 && (
        <details className="rounded-lg border">
          <summary className="cursor-pointer bg-muted/20 px-4 py-3 font-heading font-semibold">Detalhamento financeiro das {visibleBridges.length} pontes</summary>
          <div className="max-h-[440px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-primary text-primary-foreground">
                <th className="px-4 py-3 text-left font-heading">OAE</th>
                <th className="px-4 py-3 text-right font-heading">Sensores</th>
                {includeInternalLabor && <th className="px-4 py-3 text-right font-heading">M.O. interna</th>}
                <th className="px-4 py-3 text-right font-heading">Energia</th>
                <th className="px-4 py-3 text-right font-heading">Conect.</th>
                <th className="px-4 py-3 text-right font-heading">Equipamentos</th>
                <th className="px-4 py-3 text-right font-heading">Serviços</th>
                <th className="px-4 py-3 text-right font-heading">Modelagem</th>
                <th className="px-4 py-3 text-right font-heading">Extras</th>
                <th className="px-4 py-3 text-right font-heading font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {visibleBridges.map((bc, idx) => (
                <tr
                  key={bc.bridgeId}
                  className={`border-t ${idx % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                >
                  <td className="px-4 py-3 font-medium">{bc.bridgeName}</td>
                  <td className="px-4 py-3 text-right font-heading text-xs">
                    {formatCurrency(bc.sensors)}
                  </td>
                  {includeInternalLabor && (
                    <td className="px-4 py-3 text-right font-heading text-xs">
                      {formatCurrency(bc.internalLabor)}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right font-heading text-xs">
                    {formatCurrency(bc.energy)}
                  </td>
                  <td className="px-4 py-3 text-right font-heading text-xs">
                    {formatCurrency(bc.connectivity)}
                  </td>
                  <td className="px-4 py-3 text-right font-heading text-xs">
                    {formatCurrency(bc.equipmentTotal)}
                  </td>
                  <td className="px-4 py-3 text-right font-heading text-xs">
                    {formatCurrency(bc.services)}
                  </td>
                  <td className="px-4 py-3 text-right font-heading text-xs">
                    {formatCurrency(bc.modeling)}
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
                  <td colSpan={includeInternalLabor ? 7 : 6}></td>
                  <td className="px-4 py-3 text-right font-heading text-xs">
                    {formatCurrency(summary.globalExtrasCost)}
                  </td>
                  <td></td>
                </tr>
              )}
              <tr className="border-t-2 border-accent bg-primary/5 font-bold">
                <td className="px-4 py-3 font-heading">SUBTOTAL</td>
                <td colSpan={includeInternalLabor ? 8 : 7}></td>
                <td className="px-4 py-3 text-right font-heading text-accent">
                  {formatCurrency(summary.grandSubtotal)}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </details>
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

      {/* Proposal totals and full-contract accompaniment */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-heading"><TrendingUp className="h-5 w-5 text-primary" /> Acompanhamento da proposta inteira</CardTitle>
          <p className="text-sm text-muted-foreground">O acompanhamento mensal é calculado para todas as pontes e vãos deste orçamento.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="max-w-xs">
            <Label htmlFor="accompaniment-months">Período esperado de acompanhamento (meses)</Label>
            <Input id="accompaniment-months" type="number" min={0} step={1} value={accompanimentMonths} onChange={(event) => onAccompanimentMonthsChange(Math.max(0, Math.floor(Number(event.target.value) || 0)))} className="mt-1" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FinancialMetric label="Valores totais d2win" value={formatCurrency(summary.d2winProposalValue)} />
            <FinancialMetric label="Valores totais de modelagem · consórcio" value={formatCurrency(summary.modelingTotal)} />
            <FinancialMetric label="Acompanhamento mensal" value={formatCurrency(summary.monthlyAccompaniment)} detail="R$ 1.200/vão até 40 m + R$ 25/m excedente" />
            <FinancialMetric label="d2win + modelagem" value={formatCurrency(summary.totalWithModeling)} />
            <FinancialMetric label={`Acompanhamento · ${summary.accompanimentMonths} ${summary.accompanimentMonths === 1 ? "mês" : "meses"}`} value={formatCurrency(summary.accompanimentTotal)} detail="Valor mensal × período informado" />
            <FinancialMetric label="Total da proposta + acompanhamento" value={formatCurrency(summary.totalWithAccompaniment)} accent />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/25">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-primary" />
            Resultado interno do orçamento
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Análise interna do CAPEX. Estes valores não são exibidos nas propostas geradas para o cliente.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FinancialMetric label="Custo direto do sistema" value={formatCurrency(summary.directCost)} />
            <FinancialMetric label="Impostos estimados" value={formatCurrency(summary.taxValue)} />
            <FinancialMetric label="Gasto total estimado" value={formatCurrency(summary.totalEstimatedCost)} />
            <FinancialMetric
              label="Lucro bruto estimado"
              value={formatCurrency(summary.estimatedProfit)}
              accent
              detail={`${(summary.estimatedProfitMargin * 100).toFixed(1)}% de margem`}
            />
          </div>
          <div className="mt-4 flex gap-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <BadgePercent className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              O gasto total considera os custos cadastrados e os impostos. O lucro é estimado antes de despesas indiretas não cadastradas; inclua essas despesas como componentes ou itens adicionais para aumentar a precisão.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FinancialMetric({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-heading text-lg font-bold ${accent ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
      {detail && <p className="mt-1 text-xs font-medium text-accent">{detail}</p>}
    </div>
  );
}

function ScopeList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 font-heading font-semibold">{icon}<span>{title}</span></div>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {items.map((item) => <li key={item} className="flex gap-2"><span aria-hidden>•</span><span>{item}</span></li>)}
      </ul>
    </div>
  );
}
