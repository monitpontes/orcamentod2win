import { Compositions, defaultCompositions, baseMultiplier, conditionApplies } from "@/data/compositions";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";
import { calculateModelingDetails } from "@/lib/budgetCalculations";

export interface MaterialRow {
  bridgeKey: string;
  bridgeName: string;
  category: string;
  componentId: string;
  componentName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
}

const get = (components: ComponentItem[], id: string) =>
  components.find((c) => c.id === id);

function pushRow(
  rows: MaterialRow[],
  bridgeKey: string,
  bridgeName: string,
  category: string,
  components: ComponentItem[],
  id: string,
  qty: number,
  unitPriceMultiplier: number = 1
) {
  const c = get(components, id);
  if (!c || qty === 0) return;
  rows.push({
    bridgeKey,
    bridgeName,
    category,
    componentId: id,
    componentName: c.name,
    unit: c.unit,
    qty: Math.round(qty * 1000) / 1000,
    unitPrice: c.unitPrice * unitPriceMultiplier,
    total: Math.round(c.unitPrice * unitPriceMultiplier * qty * 100) / 100,
  });
}

export function buildBridgeMaterials(
  bridge: BridgeSpan,
  components: ComponentItem[],
  compositions: Compositions = defaultCompositions,
  commercialFactor = 1.5
): MaterialRow[] {
  const rows: MaterialRow[] = [];
  const key = bridge.id;
  const name = bridge.name || "OAE sem nome";

  const sensorPriceMultiplier = bridge.sensorPriceMultiplier || 1;
  compositions.sensors
    .filter((line) => conditionApplies(line.condition, bridge))
    .forEach((line) => {
      const qty = (line.qty || 0) * baseMultiplier(line.base, bridge);
      const multiplier = line.base === "sensor" ? sensorPriceMultiplier : 1;
      if (qty > 0) pushRow(rows, key, name, "Sensores", components, line.componentId, qty, multiplier);
    });

  const energyLines = [
    ...compositions.energy,
    ...compositions.commandBox.map((line) => ({
      ...line,
      base: line.base === "caixa_comando" ? "kit_solar" as const : line.base,
    })),
  ];
  energyLines
    .filter((line) => conditionApplies(line.condition, bridge))
    .forEach((line) => {
      const qty = (line.qty || 0) * baseMultiplier(line.base, bridge);
      if (qty > 0) pushRow(rows, key, name, "Energia", components, line.componentId, qty);
    });

  const conId = bridge.connectivity === "Completa" ? "CON1" : "CON2";
  pushRow(rows, key, name, "Conectividade", components, conId, bridge.connectivityKitCount ?? 0);

  if (compositions.includeInternalLabor !== false) {
    compositions.internalLabor
      .filter((line) => conditionApplies(line.condition, bridge))
      .forEach((line) => {
        const qty = (line.qty || 0) * baseMultiplier(line.base, bridge);
        const multiplier = line.base === "sensor" ? sensorPriceMultiplier : 1;
        if (qty > 0) pushRow(rows, key, name, "Mão de Obra Interna", components, line.componentId, qty, multiplier);
      });
  }

  calculateModelingDetails(bridge, components, compositions, commercialFactor).forEach((line) => {
    rows.push({
      bridgeKey: key, bridgeName: name, category: "Modelagem e Engenharia",
      componentId: line.componentId, componentName: line.componentName,
      unit: line.unit, qty: line.qty, unitPrice: line.unitPrice, total: line.total,
    });
  });

  (bridge.extraItems || []).forEach((e) => {
    const c = get(components, e.componentId);
    pushRow(rows, key, name, c?.category || "Itens Adicionais", components, e.componentId, e.qty);
  });

  return rows;
}

export const GLOBAL_EXTRAS_KEY = "__global_extras__";

export function buildGlobalExtras(
  extras: ExtraItem[],
  components: ComponentItem[]
): MaterialRow[] {
  return extras
    .map((e) => {
      const c = get(components, e.componentId);
      if (!c) return null;
      return {
        bridgeKey: GLOBAL_EXTRAS_KEY,
        bridgeName: "— Extras Globais —",
        category: c.category,
        componentId: e.componentId,
        componentName: c.name,
        unit: c.unit,
        qty: e.qty,
        unitPrice: c.unitPrice,
        total: Math.round(c.unitPrice * e.qty * 100) / 100,
      } as MaterialRow;
    })
    .filter((r): r is MaterialRow => r !== null);
}

export function buildMaterialsList(
  bridges: BridgeSpan[],
  components: ComponentItem[],
  extras: ExtraItem[],
  compositions: Compositions = defaultCompositions,
  commercialFactor = 1.5
): MaterialRow[] {
  const rows: MaterialRow[] = [];
  bridges.forEach((b) => rows.push(...buildBridgeMaterials(b, components, compositions, commercialFactor)));
  rows.push(...buildGlobalExtras(extras, components));
  return rows;
}
