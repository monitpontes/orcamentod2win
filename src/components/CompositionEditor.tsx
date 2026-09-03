import { ComponentItem } from "@/data/components";
import { formatCurrency } from "@/lib/budgetCalculations";
import {
  BASE_OPTIONS,
  BUDGET_GROUPS,
  BudgetGroupKey,
  CONDITION_OPTIONS,
  CompositionLine,
  Compositions,
  defaultCompositions,
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
  compositions: Compositions;
  onChange: (c: Compositions) => void;
}

export default function CompositionEditor({ components, compositions, onChange }: Props) {
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
                <CardTitle className="text-sm font-heading uppercase tracking-wide text-accent">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
