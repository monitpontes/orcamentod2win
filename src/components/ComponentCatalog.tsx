import { useState } from "react";
import { ComponentItem, categories } from "@/data/components";
import { Compositions } from "@/data/compositions";
import { WEATHER_STATION_BOM } from "@/data/weatherStationBom";
import { INTERNAL_TEMPERATURE_BOM } from "@/data/internalTemperatureBom";
import { SPAN_CONTROL_BOM } from "@/data/spanControlBom";
import { formatCurrency } from "@/lib/budgetCalculations";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Package, Plus, Trash2, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Props {
  components: ComponentItem[];
  compositions: Compositions;
  onCompositionsChange: (compositions: Compositions) => void;
  onUpdate: (components: ComponentItem[]) => void;
}

const emptyItem: Omit<ComponentItem, "id"> = {
  name: "",
  unit: "Unid.",
  unitPrice: 0,
  category: "Sensores",
};

export default function ComponentCatalog({ components, compositions, onCompositionsChange, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stationOpen, setStationOpen] = useState(false);
  const [internalTemperatureOpen, setInternalTemperatureOpen] = useState(false);
  const [commandBoxOpen, setCommandBoxOpen] = useState(false);
  const [relayOpen, setRelayOpen] = useState(false);
  const [newItem, setNewItem] = useState(emptyItem);
  const [newId, setNewId] = useState("");

  const filtered = components.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });
  const categoryGroups = Array.from(new Set([...categories, ...components.map((c) => c.category)]))
    .map((category) => ({ category, items: filtered.filter((item) => item.category === category) }))
    .filter((group) => group.items.length > 0);
  const stationLines = compositions.sensors.filter((line) =>
    WEATHER_STATION_BOM.some((part) => part.componentId === line.componentId)
  );
  const stationCost = stationLines.reduce((total, line) => {
    const part = components.find((component) => component.id === line.componentId);
    return total + line.qty * (part?.unitPrice ?? 0);
  }, 0);
  const internalTemperatureLines = compositions.sensors.filter((line) =>
    INTERNAL_TEMPERATURE_BOM.some((part) => part.componentId === line.componentId)
  );
  const internalTemperatureCost = internalTemperatureLines.reduce((total, line) => {
    const part = components.find((component) => component.id === line.componentId);
    return total + line.qty * (part?.unitPrice ?? 0);
  }, 0);
  const commandBoxIds = ["CC01", "PS02", "PS04", "CC07", "PS07", "CC08"];
  const commandBoxLines = commandBoxIds
    .map((id) => compositions.energy.find((line) => line.componentId === id))
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
  const commandBoxCost = commandBoxLines.reduce((total, line) => {
    const part = components.find((component) => component.id === line.componentId);
    return total + line.qty * (part?.unitPrice ?? 0);
  }, 0);
  const relayLines = SPAN_CONTROL_BOM.filter((item) => item.kind === "relay")
    .map((item) => compositions.energy.find((line) => line.componentId === item.componentId))
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
  const relayCost = relayLines.reduce((total, line) => {
    const part = components.find((component) => component.id === line.componentId);
    return total + line.qty * (part?.unitPrice ?? 0);
  }, 0);
  const handleStationQuantityChange = (componentId: string, value: string) => {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    onCompositionsChange({
      ...compositions,
      sensors: compositions.sensors.map((line) =>
        line.componentId === componentId ? { ...line, qty } : line
      ),
    });
  };
  const handleInternalTemperatureQuantityChange = (componentId: string, value: string) => {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    onCompositionsChange({
      ...compositions,
      sensors: compositions.sensors.map((line) =>
        line.componentId === componentId ? { ...line, qty } : line
      ),
    });
  };
  const handleCommandBoxQuantityChange = (componentId: string, value: string) => {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    onCompositionsChange({
      ...compositions,
      energy: compositions.energy.map((line) =>
        line.componentId === componentId ? { ...line, qty } : line
      ),
    });
  };

  const handlePriceChange = (id: string, value: string) => {
    const numVal = parseFloat(value.replace(",", "."));
    if (isNaN(numVal)) return;
    onUpdate(
      components.map((c) => (c.id === id ? { ...c, unitPrice: numVal } : c))
    );
  };

  const handleAdd = () => {
    if (!newId.trim() || !newItem.name.trim()) return;
    if (components.some((c) => c.id === newId.trim())) return;
    onUpdate([...components, { ...newItem, id: newId.trim() }]);
    setNewItem(emptyItem);
    setNewId("");
    setDialogOpen(false);
  };

  const handleRemove = (id: string) => {
    onUpdate(components.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Catálogo de Componentes
          </h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 font-heading">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Novo Componente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-heading text-xs">Código</Label>
                  <Input
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="Ex: S05"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-heading text-xs">Unidade</Label>
                  <Input
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit: e.target.value })
                    }
                    placeholder="Unid."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Nome</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  placeholder="Nome do componente"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-heading text-xs">Categoria</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(v) =>
                      setNewItem({ ...newItem, category: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-heading text-xs">Valor Unitário (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.unitPrice || ""}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full font-heading">
                Adicionar Componente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
      {categoryGroups.map(({ category, items }) => {
        const expanded = Boolean(search.trim()) || openCategory === category;
        return <div key={category} className="rounded-lg border overflow-hidden">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setOpenCategory(openCategory === category ? null : category)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-card hover:bg-muted/40"
        >
          <span className="font-heading font-semibold">{category}</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "itens"}
            <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </span>
        </button>
        {expanded && <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-4 py-3 text-left font-heading font-semibold">Código</th>
              <th className="px-4 py-3 text-left font-heading font-semibold">Item</th>
              <th className="px-4 py-3 text-left font-heading font-semibold">Unidade</th>
              <th className="px-4 py-3 text-left font-heading font-semibold">Categoria</th>
              <th className="px-4 py-3 text-right font-heading font-semibold">Valor Unitário</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={item.id}
                className={`border-t transition-colors hover:bg-muted/50 ${
                  idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                }`}
              >
                <td className="px-4 py-3 font-heading font-medium text-accent">
                  {item.id}
                </td>
                <td className="px-4 py-3">
                  {["S04", "S05", "CC01", "CV00"].includes(item.id) ? (
                    <Button variant="link" className="h-auto p-0 gap-1 font-normal" onClick={() => item.id === "S04" ? setStationOpen(true) : item.id === "S05" ? setInternalTemperatureOpen(true) : item.id === "CC01" ? setCommandBoxOpen(true) : setRelayOpen(true)}>
                      {item.name} <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : item.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {["S04", "S05", "CV00"].includes(item.id) ? (
                    <span className="font-heading font-medium">{formatCurrency(item.id === "S04" ? stationCost : item.id === "S05" ? internalTemperatureCost : relayCost)}</span>
                  ) : <Input
                    type="text"
                    defaultValue={item.unitPrice.toFixed(2)}
                    onBlur={(e) => handlePriceChange(item.id, e.target.value)}
                    className="w-32 text-right ml-auto font-heading text-sm h-8"
                  />}
                </td>
                <td className="px-4 py-2 text-center">
                  {!["S04", "S05", "CV00"].includes(item.id) && <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>}
        </div>;
      })}
      </div>

      <Dialog open={stationOpen} onOpenChange={setStationOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estação Meteorológica · placa genérica</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Sensor externo SHT30 via I²C. Resistores da placa desconsiderados.
          </p>
          <div className="space-y-2">
            {stationLines.map((line) => {
              const part = components.find((component) => component.id === line.componentId);
              if (!part) return null;
              return (
                <div key={line.componentId} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b py-2 text-sm">
                  <span>{part.name}</span>
                  <Input
                    aria-label={`Quantidade de ${part.name} por estação`}
                    type="number"
                    min="0"
                    step="1"
                    value={line.qty}
                    onChange={(event) => handleStationQuantityChange(part.id, event.target.value)}
                    className="w-20 text-right"
                  />
                  <Input
                    aria-label={`Preço de ${part.name}`}
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={part.unitPrice}
                    onBlur={(event) => handlePriceChange(part.id, event.target.value)}
                    className="w-28 text-right"
                  />
                </div>
              );
            })}
            <div className="flex justify-between font-semibold pt-2">
              <span>Custo por estação</span><span>{formatCurrency(stationCost)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={internalTemperatureOpen} onOpenChange={setInternalTemperatureOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sensor de temperatura interna · NTC 10k</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Um sensor por vão, cada um com sua própria placa genérica. As quantidades abaixo são por vão.
          </p>
          <div className="space-y-2">
            {internalTemperatureLines.map((line) => {
              const part = components.find((component) => component.id === line.componentId);
              if (!part) return null;
              return (
                <div key={line.componentId} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b py-2 text-sm">
                  <span>{part.name}</span>
                  <Input
                    aria-label={`Quantidade de ${part.name} por vão`}
                    type="number"
                    min="0"
                    step="1"
                    value={line.qty}
                    onChange={(event) => handleInternalTemperatureQuantityChange(part.id, event.target.value)}
                    className="w-20 text-right"
                  />
                  <Input
                    aria-label={`Preço de ${part.name} no sensor interno`}
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={part.unitPrice}
                    onBlur={(event) => handlePriceChange(part.id, event.target.value)}
                    className="w-28 text-right"
                  />
                </div>
              );
            })}
            <div className="flex justify-between font-semibold pt-2">
              <span>Custo por vão</span><span>{formatCurrency(internalTemperatureCost)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={commandBoxOpen} onOpenChange={setCommandBoxOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Caixa de comando · composição do conjunto solar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Controladora Epever MPPT 20A, cooler com placa genérica, duas baterias 40Ah e equalizador JFA.
          </p>
          <div className="space-y-2">
            {commandBoxLines.map((line) => {
              const part = components.find((component) => component.id === line.componentId);
              if (!part) return null;
              return (
                <div key={line.componentId} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b py-2 text-sm">
                  <span>{part.name}</span>
                  <Input
                    aria-label={`Quantidade de ${part.name} por caixa`}
                    type="number"
                    min="0"
                    step="1"
                    value={line.qty}
                    onChange={(event) => handleCommandBoxQuantityChange(part.id, event.target.value)}
                    className="w-20 text-right"
                  />
                  <Input
                    aria-label={`Preço de ${part.name}`}
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={part.unitPrice}
                    onBlur={(event) => handlePriceChange(part.id, event.target.value)}
                    className="w-28 text-right"
                  />
                </div>
              );
            })}
            <div className="flex justify-between font-semibold pt-2">
              <span>Custo dos itens da caixa</span><span>{formatCurrency(commandBoxCost)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={relayOpen} onOpenChange={setRelayOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Módulo relé de controle · por vão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Uma placa genérica, um relé de dois canais 3V3 e uma caixa PVC 154×110×70 mm por vão.
          </p>
          <div className="space-y-2">
            {relayLines.map((line) => {
              const part = components.find((component) => component.id === line.componentId);
              if (!part) return null;
              return (
                <div key={line.componentId} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b py-2 text-sm">
                  <span>{part.name}</span>
                  <Input
                    aria-label={`Quantidade de ${part.name} por vão`}
                    type="number"
                    min="0"
                    step="1"
                    value={line.qty}
                    onChange={(event) => handleCommandBoxQuantityChange(part.id, event.target.value)}
                    className="w-20 text-right"
                  />
                  <Input
                    aria-label={`Preço de ${part.name}`}
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={part.unitPrice}
                    onBlur={(event) => handlePriceChange(part.id, event.target.value)}
                    className="w-28 text-right"
                  />
                </div>
              );
            })}
            <div className="flex justify-between font-semibold pt-2">
              <span>Custo do módulo por vão</span><span>{formatCurrency(relayCost)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {components.length} itens • Clique nos valores para editar
      </p>
    </div>
  );
}
