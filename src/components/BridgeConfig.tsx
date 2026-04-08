import { BridgeSpan, createDefaultBridge } from "@/data/bridgeConfig";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Building2 } from "lucide-react";

interface Props {
  bridges: BridgeSpan[];
  onUpdate: (bridges: BridgeSpan[]) => void;
}

export default function BridgeConfig({ bridges, onUpdate }: Props) {
  const addBridge = () => onUpdate([...bridges, createDefaultBridge()]);

  const removeBridge = (id: string) =>
    onUpdate(bridges.filter((b) => b.id !== id));

  const updateBridge = (id: string, field: keyof BridgeSpan, value: any) => {
    onUpdate(
      bridges.map((b) => (b.id === id ? { ...b, [field]: value } : b))
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
        <Card key={bridge.id} className="overflow-hidden">
          <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-accent text-accent-foreground text-sm font-bold">
                {idx + 1}
              </span>
              <Input
                placeholder="Nome da OAE"
                value={bridge.name}
                onChange={(e) => updateBridge(bridge.id, "name", e.target.value)}
                className="max-w-xs h-8 bg-card"
              />
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeBridge(bridge.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="Comp. Vão (m)">
                <Input
                  type="number"
                  value={bridge.spanLength}
                  onChange={(e) =>
                    updateBridge(bridge.id, "spanLength", +e.target.value)
                  }
                />
              </Field>
              <Field label="Qtd. Vãos">
                <Input
                  type="number"
                  value={bridge.spanCount}
                  onChange={(e) =>
                    updateBridge(bridge.id, "spanCount", +e.target.value)
                  }
                />
              </Field>
              <Field label="Qtd. Sensores">
                <Input
                  type="number"
                  value={bridge.sensorCount}
                  onChange={(e) =>
                    updateBridge(bridge.id, "sensorCount", +e.target.value)
                  }
                />
              </Field>
              <Field label="Qtd. Temperatura">
                <Input
                  type="number"
                  value={bridge.temperatureCount}
                  onChange={(e) =>
                    updateBridge(bridge.id, "temperatureCount", +e.target.value)
                  }
                />
              </Field>
              <Field label="Fonte de Energia">
                <Select
                  value={bridge.energySource}
                  onValueChange={(v) =>
                    updateBridge(bridge.id, "energySource", v)
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solar">Solar</SelectItem>
                    <SelectItem value="Rede">Rede Elétrica</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Dist. Cabos Extra (m)">
                <Input
                  type="number"
                  value={bridge.extraCableDistance}
                  onChange={(e) =>
                    updateBridge(bridge.id, "extraCableDistance", +e.target.value)
                  }
                />
              </Field>
              <Field label="Conectividade">
                <Select
                  value={bridge.connectivity}
                  onValueChange={(v) =>
                    updateBridge(bridge.id, "connectivity", v)
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completa">Completa</SelectItem>
                    <SelectItem value="Parcial">Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Horas Adequação">
                <Input
                  type="number"
                  value={bridge.hoursAdequation}
                  onChange={(e) =>
                    updateBridge(bridge.id, "hoursAdequation", +e.target.value)
                  }
                />
              </Field>
              <Field label="Horas Montagem">
                <Input
                  type="number"
                  value={bridge.hoursAssembly}
                  onChange={(e) =>
                    updateBridge(bridge.id, "hoursAssembly", +e.target.value)
                  }
                />
              </Field>
              <Field label="Infraestrutura">
                <div className="flex items-center h-10 gap-2">
                  <Switch
                    checked={bridge.hasInfrastructure}
                    onCheckedChange={(v) =>
                      updateBridge(bridge.id, "hasInfrastructure", v)
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {bridge.hasInfrastructure ? "Sim" : "Não"}
                  </span>
                </div>
              </Field>
            </div>
            <div className="mt-4 text-sm text-muted-foreground font-heading">
              Comprimento total: {bridge.spanLength * bridge.spanCount}m
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
