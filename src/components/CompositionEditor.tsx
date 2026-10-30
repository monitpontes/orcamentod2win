import { ComponentItem } from "@/data/components";
import {
  calculateSensorSaleUnitPrice,
  formatCurrency,
} from "@/lib/budgetCalculations";
import {
  BASE_OPTIONS,
  BUDGET_GROUPS,
  BudgetGroupKey,
  CONDITION_OPTIONS,
  CompositionLine,
  Compositions,
  defaultCompositions,
  SensorPricingMode,
} from "@/data/compositions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, Plus, Trash2, RotateCcw } from "lucide-react";
import { useState } from "react";

interface Props {
  components: ComponentItem[];
  onComponentsChange: (components: ComponentItem[]) => void;
  compositions: Compositions;
  onChange: (c: Compositions) => void;
}

export default function CompositionEditor({ components, onComponentsChange, compositions, onChange }: Props) {
  const [newComponentByGroup, setNewComponentByGroup] = useState<Record<string, string>>({});

  const updateLine = (
    group: BudgetGroupKey,
    index: number,
    patch: Partial<CompositionLine>
  ) => {
    onChange({
      ...compositions,
      [group]: compositions[group].map((l, i) => (i === index ? { ...l, ...patch } : l)),
    });
  };

  const removeLine = (group: BudgetGroupKey, index: number) => {
    onChange({
      ...compositions,
      [group]: compositions[group].filter((_, i) => i !== index),
    });
  };

  const addLine = (group: BudgetGroupKey) => {
    const componentId = newComponentByGroup[group];
    if (!componentId) return;
    onChange({
      ...compositions,
      [group]: [
        ...compositions[group],
        { componentId, qty: 1, base: "fixo", condition: "sempre" },
      ],
    });
    setNewComponentByGroup({ ...newComponentByGroup, [group]: "" });
  };

  const updateComponentPrice = (componentId: string, unitPrice: number) => {
    onComponentsChange(
      components.map((component) =>
        component.id === componentId ? { ...component, unitPrice } : component
      )
    );
  };

  const sensorUnitCost = (compositions.sensors ?? []).reduce((total, line) => {
    if (line.base !== "sensor" || !conditionMatchesAlways(line.condition)) return total;
    const component = components.find((item) => item.id === line.componentId);
    return total + line.qty * (component?.unitPrice ?? 0);
  }, 0);
  const sensorPricing = compositions.sensorPricing;
  const sensorSalePrice = calculateSensorSaleUnitPrice(sensorUnitCost, sensorPricing);
  const sensorUnitProfit = sensorSalePrice - sensorUnitCost;
  const effectiveMargin = sensorSalePrice > 0 ? (sensorUnitProfit / sensorSalePrice) * 100 : 0;

  const changeSensorPricingMode = (mode: SensorPricingMode) => {
    onChange({
      ...compositions,
      sensorPricing: {
        ...sensorPricing,
        mode,
        salePrice: mode === "salePrice" ? sensorSalePrice : sensorPricing.salePrice,
      },
    });
  };

  const updateSensorPricing = (patch: Partial<typeof sensorPricing>) => {
    onChange({
      ...compositions,
      sensorPricing: { ...sensorPricing, ...patch },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-accent" />
          <div>
            <h3 className="text-lg font-heading font-bold">Cadastro de Composições</h3>
            <p className="text-xs text-muted-foreground">
              Defina o que compõe cada item do orçamento e a quantidade por base de cálculo.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-heading"
          onClick={() => onChange(structuredClone(defaultCompositions))}
        >
          <RotateCcw className="h-4 w-4" /> Restaurar padrão
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {BUDGET_GROUPS.map(({ key, label }) => {
          const lines = compositions[key] ?? [];
          const available = components.filter(
            (c) => !lines.some((l) => l.componentId === c.id)
          );
          return (
            <Card key={key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-heading uppercase tracking-wide text-accent flex items-center justify-between gap-3">
                  <span>{label}</span>
                  {key === "sensors" && (
                    <span className="normal-case text-xs text-foreground bg-accent/10 border border-accent/20 rounded-md px-2 py-1">
                      Materiais por sensor: {formatCurrency(sensorUnitCost)}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {key === "sensors" && (
                  <div className="rounded-md border border-accent/30 bg-accent/5 p-3 space-y-3">
                    <div>
                      <p className="text-sm font-heading font-semibold">Preço comercial do sensor</p>
                      <p className="text-xs text-muted-foreground">
                        Escolha uma margem sobre a venda ou informe o preço unitário antes de BDI e impostos.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Forma de precificação</Label>
                        <Select
                          value={sensorPricing.mode}
                          onValueChange={(value) => changeSensorPricingMode(value as SensorPricingMode)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="margin">Margem de lucro (%)</SelectItem>
                            <SelectItem value="salePrice">Valor de venda (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">
                          {sensorPricing.mode === "margin" ? "Margem sobre a venda (%)" : "Valor de venda unitário (R$)"}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max={sensorPricing.mode === "margin" ? "99.99" : undefined}
                          step="0.01"
                          value={sensorPricing.mode === "margin" ? sensorPricing.marginPercent : sensorPricing.salePrice}
                          onChange={(event) => {
                            const value = Math.max(0, parseFloat(event.target.value) || 0);
                            updateSensorPricing(
                              sensorPricing.mode === "margin"
                                ? { marginPercent: Math.min(99.99, value) }
                                : { salePrice: value }
                            );
                          }}
                          className="h-9 font-heading text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="rounded bg-background/80 p-2">
                        <span className="text-muted-foreground">Custo dos componentes</span>
                        <p className="font-heading font-semibold">{formatCurrency(sensorUnitCost)}</p>
                      </div>
                      <div className="rounded bg-background/80 p-2">
                        <span className="text-muted-foreground">Lucro unitário</span>
                        <p className={`font-heading font-semibold ${sensorUnitProfit < 0 ? "text-destructive" : "text-accent"}`}>
                          {formatCurrency(sensorUnitProfit)}
                        </p>
                      </div>
                      <div className="rounded bg-background/80 p-2">
                        <span className="text-muted-foreground">Venda / margem efetiva</span>
                        <p className="font-heading font-semibold">
                          {formatCurrency(sensorSalePrice)} · {effectiveMargin.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    {sensorUnitProfit < 0 && (
                      <p className="text-xs text-destructive">
                        Atenção: o valor de venda está abaixo do custo dos componentes.
                      </p>
                    )}
                  </div>
                )}
                {key === "infrastructure" && (
                  <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    Estes quantitativos podem ser usados como referência técnica, mas seus valores não entram na proposta porque o fornecimento e a instalação são responsabilidade do cliente.
                  </p>
                )}
                {key === "internalLabor" && (
                  <p className="rounded-md border border-accent/20 bg-accent/5 p-3 text-sm text-muted-foreground">
                    O preço é o custo da hora interna. A quantidade representa horas por OAE, por vão ou por sensor, conforme a base selecionada.
                  </p>
                )}
                {lines.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum componente cadastrado.</p>
                )}
                {lines.map((line, index) => {
                  const comp = components.find((c) => c.id === line.componentId);
                  return (
                    <div
                      key={`${line.componentId}-${index}`}
                      className="rounded-md border bg-muted/20 p-2.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            <span className="font-heading text-accent">{line.componentId}</span>{" "}
                            — {comp?.name ?? "Componente removido"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(comp?.unitPrice ?? 0)} / {comp?.unit ?? "Unid."}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => removeLine(key, index)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Preço unitário (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={comp?.unitPrice ?? 0}
                            disabled={!comp}
                            onChange={(e) =>
                              updateComponentPrice(line.componentId, parseFloat(e.target.value) || 0)
                            }
                            className="h-8 font-heading text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Quantidade</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={line.qty}
                            onChange={(e) =>
                              updateLine(key, index, { qty: parseFloat(e.target.value) || 0 })
                            }
                            className="h-8 font-heading text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Base</Label>
                          <Select
                            value={line.base}
                            onValueChange={(v) => updateLine(key, index, { base: v as never })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BASE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Condição</Label>
                          <Select
                            value={line.condition ?? "sempre"}
                            onValueChange={(v) =>
                              updateLine(key, index, { condition: v as never })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONDITION_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-2 pt-1">
                  <Select
                    value={newComponentByGroup[key] ?? ""}
                    onValueChange={(v) =>
                      setNewComponentByGroup({ ...newComponentByGroup, [key]: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Adicionar componente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {available.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.id} — {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="h-8 gap-1 font-heading"
                    onClick={() => addLine(key)}
                    disabled={!newComponentByGroup[key]}
                  >
                    <Plus className="h-3.5 w-3.5" /> Incluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function conditionMatchesAlways(condition: CompositionLine["condition"]): boolean {
  return !condition || condition === "sempre";
}
