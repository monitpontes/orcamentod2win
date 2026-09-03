import { defaultCompositions, baseMultiplier, conditionApplies } from "@/data/compositions";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";

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
  qty: number
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
    unitPrice: c.unitPrice,
    total: Math.round(c.unitPrice * qty * 100) / 100,
  });
}

export function buildBridgeMaterials(
  bridge: BridgeSpan,
  components: ComponentItem[]
): MaterialRow[] {
  const rows: MaterialRow[] = [];
  const key = bridge.id;
  const name = bridge.name || "OAE sem nome";
  const totalLength = bridge.spanLength * bridge.spanCount;

  pushRow(rows, key, name, "Sensores", components, "S01", bridge.sensorCount);
  pushRow(rows, key, name, "Sensores", components, "S02", bridge.sensorCount);
  pushRow(rows, key, name, "Sensores", components, "S03", bridge.sensorCount);
  if (bridge.temperatureCount > 0)
    pushRow(rows, key, name, "Sensores", components, "S04", bridge.temperatureCount);

  if (bridge.hasInfrastructure) {
    pushRow(rows, key, name, "Infraestrutura", components, "INF01", totalLength / 3);
    pushRow(
      rows,
      key,
      name,
      "Infraestrutura",
      components,
      "INF02",
      (totalLength + bridge.extraCableDistance) / 100
    );
    pushRow(rows, key, name, "Infraestrutura", components, "INF03", bridge.spanCount);
    pushRow(rows, key, name, "Infraestrutura", components, "INF04", bridge.sensorCount);
    pushRow(rows, key, name, "Infraestrutura", components, "INF05", bridge.spanCount);
    pushRow(rows, key, name, "Infraestrutura", components, "INF06", bridge.sensorCount);
  }

  defaultCompositions.energy
    .filter((line) => conditionApplies(line.condition, bridge))
    .forEach((line) => {
      const qty = (line.qty || 0) * baseMultiplier(line.base, bridge);
      if (qty > 0) pushRow(rows, key, name, "Energia", components, line.componentId, qty);
    });

  const conId = bridge.connectivity === "Completa" ? "CON1" : "CON2";
  pushRow(rows, key, name, "Conectividade", components, conId, bridge.connectivityKitCount || 1);

  const ccCount = bridge.solarKitCount || 1;
  pushRow(rows, key, name, "Caixa de Comando", components, "CC01", ccCount);
  pushRow(rows, key, name, "Caixa de Comando", components, "CC02", ccCount);
  pushRow(rows, key, name, "Caixa de Comando", components, "CC03", ccCount);
  pushRow(rows, key, name, "Caixa de Comando", components, "CC04", ccCount);
  pushRow(rows, key, name, "Caixa de Comando", components, "CC05", bridge.hoursAssembly);
  if (bridge.energySource === "Rede")
    pushRow(rows, key, name, "Caixa de Comando", components, "CC06", ccCount);

  pushRow(rows, key, name, "Modelagem e Engenharia", components, "P01", bridge.spanCount);
  pushRow(rows, key, name, "Modelagem e Engenharia", components, "P02", bridge.spanCount);
  pushRow(rows, key, name, "Modelagem e Engenharia", components, "CN02", bridge.hoursAdequation);

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
  extras: ExtraItem[]
): MaterialRow[] {
  const rows: MaterialRow[] = [];
  bridges.forEach((b) => rows.push(...buildBridgeMaterials(b, components)));
  rows.push(...buildGlobalExtras(extras, components));
  return rows;
}
