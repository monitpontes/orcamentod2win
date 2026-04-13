import { BridgeSpan, ExtraItem, createDefaultBridge } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Building2, PackagePlus } from "lucide-react";
import { useState } from "react";

interface Props {
  bridges: BridgeSpan[];
  onUpdate: (bridges: BridgeSpan[]) => void;
  components: ComponentItem[];
}

export default function BridgeConfig({ bridges, onUpdate, components }: Props) {
  const addBridge = () => onUpdate([...bridges, createDefaultBridge()]);

  const removeBridge = (id: string) =>
    onUpdate(bridges.filter((b) => b.id !== id));

  const updateBridge = (id: string, field: keyof BridgeSpan, value: any) => {
    onUpdate(
      bridges.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const addExtraItem = (bridgeId: string, componentId: string, qty: number) => {
    onUpdate(
      bridges.map((b) => {
        if (b.id !== bridgeId) return b;
        const existing = (b.extraItems || []).find((e) => e.componentId === componentId);
        if (existing) {
          return {
            ...b,
            extraItems: b.extraItems.map((e) =>
              e.componentId === componentId ? { ...e, qty: e.qty + qty } : e
            ),
          };
        }
        return { ...b, extraItems: [...(b.extraItems || []), { componentId, qty }] };
      })
    );
  };

  const removeExtraItem = (bridgeId: string, componentId: string) => {
    onUpdate(
      bridges.map((b) => {
        if (b.id !== bridgeId) return b;
        return { ...b, extraItems: (b.extraItems || []).filter((e) => e.componentId !== componentId) };
      })
    );
  };

  const updateExtraQty = (bridgeId: string, componentId: string, qty: number) => {
    onUpdate(
      bridges.map((b) => {
        if (b.id !== bridgeId) return b;
        return {
          ...b,
          extraItems: (b.extraItems || []).map((e) =>
            e.componentId === componentId ? { ...e, qty } : e
          ),
        };
      })
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Configuração das Pontes
          </h2>
        </div>
        <Button onClick={addBridge} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" />
          Adicionar OAE
        </Button>
      </div>

      {bridges.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma ponte configurada. Clique em "Adicionar OAE" para começar.
          </CardContent>
        </Card>
      )}

      {bridges.map((bridge, idx) => (
        <BridgeCard
          key={bridge.id}
          bridge={bridge}
          idx={idx}
          components={components}
          onUpdate={updateBridge}
          onRemove={removeBridge}
          onAddExtra={addExtraItem}
          onRemoveExtra={removeExtraItem}
          onUpdateExtraQty={updateExtraQty}
        />
      ))}
    </div>
  );
}

interface BridgeCardProps {
  bridge: BridgeSpan;
  idx: number;
  components: ComponentItem[];
  onUpdate: (id: string, field: keyof BridgeSpan, value: any) => void;
  onRemove: (id: string) => void;
  onAddExtra: (bridgeId: string, componentId: string, qty: number) => void;
  onRemoveExtra: (bridgeId: string, componentId: string) => void;
  onUpdateExtraQty: (bridgeId: string, componentId: string, qty: number) => void;
}

function BridgeCard({ bridge, idx, components, onUpdate, onRemove, onAddExtra, onRemoveExtra, onUpdateExtraQty }: BridgeCardProps) {
  const [selectedComponent, setSelectedComponent] = useState("");

  const usedIds = new Set((bridge.extraItems || []).map((e) => e.componentId));
  const availableComponents = components.filter((c) => !usedIds.has(c.id));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-accent text-accent-foreground text-sm font-bold">
            {idx + 1}
          </span>
          <Input
            placeholder="Nome da OAE"
            value={bridge.name}
            onChange={(e) => onUpdate(bridge.id, "name", e.target.value)}
            className="max-w-xs h-8 bg-card"
          />
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(bridge.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Comp. Vão (m)">
            <Input type="number" value={bridge.spanLength} onChange={(e) => onUpdate(bridge.id, "spanLength", +e.target.value)} />
          </Field>
          <Field label="Qtd. Vãos">
            <Input type="number" value={bridge.spanCount} onChange={(e) => onUpdate(bridge.id, "spanCount", +e.target.value)} />
          </Field>
          <Field label="Qtd. Sensores">
            <Input type="number" value={bridge.sensorCount} onChange={(e) => onUpdate(bridge.id, "sensorCount", +e.target.value)} />
          </Field>
          <Field label="Qtd. Temperatura">
            <Input type="number" value={bridge.temperatureCount} onChange={(e) => onUpdate(bridge.id, "temperatureCount", +e.target.value)} />
          </Field>
          <Field label="Fonte de Energia">
            <Select value={bridge.energySource} onValueChange={(v) => onUpdate(bridge.id, "energySource", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Solar">Solar</SelectItem>
                <SelectItem value="Rede">Rede Elétrica</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Qtd. Kit Solar">
            <Input type="number" value={bridge.solarKitCount} onChange={(e) => onUpdate(bridge.id, "solarKitCount", +e.target.value)} />
          </Field>
          <Field label="Dist. Cabos Extra (m)">
            <Input type="number" value={bridge.extraCableDistance} onChange={(e) => onUpdate(bridge.id, "extraCableDistance", +e.target.value)} />
          </Field>
          <Field label="Conectividade">
            <Select value={bridge.connectivity} onValueChange={(v) => onUpdate(bridge.id, "connectivity", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Completa">Completa</SelectItem>
                <SelectItem value="Parcial">Parcial</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Qtd. Kit Conectividade">
            <Input type="number" value={bridge.connectivityKitCount} onChange={(e) => onUpdate(bridge.id, "connectivityKitCount", +e.target.value)} />
          </Field>
          <Field label="Horas Adequação">
            <Input type="number" value={bridge.hoursAdequation} onChange={(e) => onUpdate(bridge.id, "hoursAdequation", +e.target.value)} />
          </Field>
          <Field label="Horas Montagem">
            <Input type="number" value={bridge.hoursAssembly} onChange={(e) => onUpdate(bridge.id, "hoursAssembly", +e.target.value)} />
          </Field>
          <Field label="Infraestrutura">
            <div className="flex items-center h-10 gap-2">
              <Switch checked={bridge.hasInfrastructure} onCheckedChange={(v) => onUpdate(bridge.id, "hasInfrastructure", v)} />
              <span className="text-sm text-muted-foreground">{bridge.hasInfrastructure ? "Sim" : "Não"}</span>
            </div>
          </Field>
        </div>
        <div className="mt-4 text-sm text-muted-foreground font-heading">
          Comprimento total: {bridge.spanLength * bridge.spanCount}m
        </div>

        {/* Extra Items */}
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <PackagePlus className="h-4 w-4 text-accent" />
            <span className="text-sm font-heading font-semibold">Itens Extras</span>
          </div>

          {(bridge.extraItems || []).length > 0 && (
            <div className="space-y-2 mb-3">
              {(bridge.extraItems || []).map((item) => {
                const comp = components.find((c) => c.id === item.componentId);
                return (
                  <div key={item.componentId} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-muted-foreground w-16">{item.componentId}</span>
                    <span className="flex-1 truncate">{comp?.name || item.componentId}</span>
                    <Input
                      type="number"
                      className="w-20 h-8 text-xs"
                      value={item.qty}
                      min={0}
                      onChange={(e) => onUpdateExtraQty(bridge.id, item.componentId, +e.target.value)}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemoveExtra(bridge.id, item.componentId)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Select value={selectedComponent} onValueChange={setSelectedComponent}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Selecionar componente..." />
              </SelectTrigger>
              <SelectContent>
                {availableComponents.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.id} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs"
              disabled={!selectedComponent}
              onClick={() => {
                if (selectedComponent) {
                  onAddExtra(bridge.id, selectedComponent, 1);
                  setSelectedComponent("");
                }
              }}
            >
              <Plus className="h-3 w-3" /> Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
