import { ComponentItem } from "@/data/components";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import {
  BudgetGroupKey,
  CompositionLine,
  Compositions,
  baseMultiplier,
  conditionApplies,
  defaultCompositions,
} from "@/data/compositions";

export interface CompositionDetailLine {
  componentId: string;
  componentName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface BridgeCosts {
  bridgeId: string;
  bridgeName: string;
  sensors: number;
  infrastructure: number;
  energy: number;
  connectivity: number;
  commandBox: number;
  equipmentTotal: number;
  services: number;
  /** Compatibilidade: parcela de modelagem/simulação dentro de Serviços */
  modelingEngineering: number;
  /** Compatibilidade: parcela de adequação de banco de dados dentro de Serviços */
  databaseAdequationCost: number;
  extraItemsCost: number;
  /** Compatibilidade: terceiros removidos do orçamento (sempre 0) */
  thirdPartyCost: number;
  details: Record<BudgetGroupKey, CompositionDetailLine[]>;
  total: number;
}

export interface BudgetSummary {
  bridgeCosts: BridgeCosts[];
  subtotal: number;
  servicesTotal: number;
  databaseAdequationCost: number;
  globalExtrasCost: number;
  /** Compatibilidade: terceiros removidos do orçamento (sempre 0) */
  thirdPartyTotal: number;
  grandSubtotal: number;
  bdiRate: number;
  bdiValue: number;
  taxRate: number;
  taxValue: number;
  markup: number;
  markupValue: number;
  proposalValue: number;
  monthlyAccompaniment: number;
}

function getComponent(components: ComponentItem[], id: string): ComponentItem | undefined {
  return components.find((c) => c.id === id);
}

function getComponentPrice(components: ComponentItem[], id: string): number {
  return getComponent(components, id)?.unitPrice ?? 0;
}

function calculateExtraItemsCost(extras: ExtraItem[], components: ComponentItem[]): number {
  return extras.reduce(
    (sum, item) => sum + getComponentPrice(components, item.componentId) * item.qty,
    0
  );
}

function buildGroup(
  lines: CompositionLine[],
  bridge: BridgeSpan,
  components: ComponentItem[]
): CompositionDetailLine[] {
  return lines
    .filter((line) => conditionApplies(line.condition, bridge))
    .map((line) => {
      const comp = getComponent(components, line.componentId);
      const qty = (line.qty || 0) * baseMultiplier(line.base, bridge);
      const unitPrice = comp?.unitPrice ?? 0;
      return {
        componentId: line.componentId,
        componentName: comp?.name ?? line.componentId,
        unit: comp?.unit ?? "Unid.",
        qty,
        unitPrice,
        total: qty * unitPrice,
      };
    })
    .filter((l) => l.qty !== 0);
}

const sumLines = (lines: CompositionDetailLine[]) => lines.reduce((s, l) => s + l.total, 0);

export function calculateBridgeCosts(
  bridge: BridgeSpan,
  components: ComponentItem[],
  compositions: Compositions = defaultCompositions
): BridgeCosts {
  const details = {
    sensors: buildGroup(compositions.sensors, bridge, components),
    infrastructure: bridge.hasInfrastructure
      ? buildGroup(compositions.infrastructure, bridge, components)
      : [],
    energy: buildGroup(compositions.energy, bridge, components),
    connectivity: buildGroup(compositions.connectivity, bridge, components),
    commandBox: buildGroup(compositions.commandBox, bridge, components),
    services: buildGroup(compositions.services, bridge, components),
  } as Record<BudgetGroupKey, CompositionDetailLine[]>;

  const sensors = sumLines(details.sensors);
  const infrastructure = sumLines(details.infrastructure);
  const energy = sumLines(details.energy);
  const connectivity = sumLines(details.connectivity);
  const commandBox = sumLines(details.commandBox);
  const services = sumLines(details.services);

  const equipmentTotal = sensors + infrastructure + energy + connectivity + commandBox;

  const modelingEngineering = details.services
    .filter((l) => l.componentId === "P01" || l.componentId === "P02")
    .reduce((s, l) => s + l.total, 0);
  const databaseAdequationCost = details.services
    .filter((l) => l.componentId === "CN02")
    .reduce((s, l) => s + l.total, 0);

  const extraItemsCost = calculateExtraItemsCost(bridge.extraItems || [], components);

  const total = equipmentTotal + services + extraItemsCost;

  return {
    bridgeId: bridge.id,
    bridgeName: bridge.name || "OAE sem nome",
    sensors,
    infrastructure,
    energy,
    connectivity,
    commandBox,
    equipmentTotal,
    services,
    modelingEngineering,
    databaseAdequationCost,
    extraItemsCost,
    thirdPartyCost: 0,
    details,
    total,
  };
}

export function calculateBudgetSummary(
  bridges: BridgeSpan[],
  components: ComponentItem[],
  bdiRate: number = 0.3,
  taxRate: number = 0.2,
  markup: number = 3,
  globalExtraItems: ExtraItem[] = [],
  compositions: Compositions = defaultCompositions
): BudgetSummary {
  const bridgeCosts = bridges.map((b) => calculateBridgeCosts(b, components, compositions));
  const subtotal = bridgeCosts.reduce((sum, bc) => sum + bc.total, 0);
  const servicesTotal = bridgeCosts.reduce((sum, bc) => sum + bc.services, 0);
  const databaseAdequationCost = bridgeCosts.reduce(
    (sum, bc) => sum + bc.databaseAdequationCost,
    0
  );
  const globalExtrasCost = calculateExtraItemsCost(globalExtraItems, components);
  const grandSubtotal = subtotal + globalExtrasCost;
  const bdiValue = grandSubtotal * bdiRate;
  const taxValue = grandSubtotal * taxRate;
  const markupValue = grandSubtotal * markup;

  const proposalValue = grandSubtotal + bdiValue + taxValue;

  const monthlyBase =
    getComponentPrice(components, "MEN") * 40 +
    getComponentPrice(components, "CN06") +
    getComponentPrice(components, "CN05") +
    getComponentPrice(components, "CN07");
  const totalSpans = bridges.reduce((sum, b) => sum + b.spanCount, 0);
  const monthlyAccompaniment = monthlyBase * totalSpans;

  return {
    bridgeCosts,
    subtotal,
    servicesTotal,
    databaseAdequationCost,
    globalExtrasCost,
    thirdPartyTotal: 0,
    grandSubtotal,
    bdiRate,
    bdiValue,
    taxRate,
    taxValue,
    markup,
    markupValue,
    proposalValue,
    monthlyAccompaniment,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
