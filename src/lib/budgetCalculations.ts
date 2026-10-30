import { ComponentItem } from "../data/components";
import { BridgeSpan, ExtraItem } from "../data/bridgeConfig";
import {
  BudgetGroupKey,
  CompositionLine,
  Compositions,
  SensorPricingSettings,
  baseMultiplier,
  conditionApplies,
  defaultCompositions,
  defaultSensorPricing,
} from "../data/compositions";

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
  /** Custo de compra/fabricação dos sensores, antes da margem comercial. */
  sensorCost: number;
  sensors: number;
  infrastructure: number;
  energy: number;
  connectivity: number;
  /** @deprecated A caixa de comando está incluída em Energia. */
  commandBox: number;
  internalLabor: number;
  equipmentTotal: number;
  services: number;
  modeling: number;
  /** Alias de modelagem/simulação */
  modelingEngineering: number;
  /** Compatibilidade: parcela de adequação de banco de dados dentro de Serviços */
  databaseAdequationCost: number;
  extraItemsCost: number;
  details: Record<BudgetGroupKey, CompositionDetailLine[]>;
  /** Custo direto real da OAE, sem BDI, impostos ou margem comercial dos sensores. */
  directCost: number;
  total: number;
}

export interface BudgetSummary {
  bridgeCosts: BridgeCosts[];
  subtotal: number;
  servicesTotal: number;
  modelingTotal: number;
  internalLaborTotal: number;
  databaseAdequationCost: number;
  globalExtrasCost: number;
  grandSubtotal: number;
  bdiRate: number;
  bdiValue: number;
  taxRate: number;
  taxValue: number;
  markup: number;
  markupValue: number;
  proposalValue: number;
  /** Custos reais cadastrados, incluindo materiais e mão de obra interna. */
  directCost: number;
  /** Custos diretos acrescidos dos impostos estimados da proposta. */
  totalEstimatedCost: number;
  /** Resultado bruto antes de despesas indiretas que não estejam cadastradas. */
  estimatedProfit: number;
  estimatedProfitMargin: number;
  monthlyAccompaniment: number;
}

export const MONTHLY_ACCOMPANIMENT_BASE = 1_200;
export const MONTHLY_ACCOMPANIMENT_INCLUDED_LENGTH = 40;
export const MONTHLY_ACCOMPANIMENT_EXTRA_METER = 25;

/** Valor mensal por vão: R$ 1.200 até 40 m, mais R$ 25 por metro excedente. */
export function calculateMonthlyAccompanimentPerSpan(spanLength: number): number {
  const length = Math.max(0, Number(spanLength) || 0);
  const excessLength = Math.max(0, length - MONTHLY_ACCOMPANIMENT_INCLUDED_LENGTH);
  return MONTHLY_ACCOMPANIMENT_BASE + excessLength * MONTHLY_ACCOMPANIMENT_EXTRA_METER;
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

export function calculateSensorMaterialUnitCost(
  components: ComponentItem[],
  compositions: Compositions = defaultCompositions
): number {
  return compositions.sensors.reduce((sum, line) => {
    if (line.base !== "sensor" || !conditionApplies(line.condition, {} as BridgeSpan)) {
      return sum;
    }
    return sum + (line.qty || 0) * getComponentPrice(components, line.componentId);
  }, 0);
}

export function calculateSensorSaleUnitPrice(
  materialCost: number,
  pricing: SensorPricingSettings
): number {
  if (pricing.mode === "salePrice") return Math.max(0, pricing.salePrice || 0);
  const margin = Math.min(99.99, Math.max(0, pricing.marginPercent || 0)) / 100;
  return materialCost / (1 - margin);
}

function buildGroup(
  lines: CompositionLine[],
  bridge: BridgeSpan,
  components: ComponentItem[],
  sensorPriceMultiplier: number = 1
): CompositionDetailLine[] {
  return lines
    .filter((line) => conditionApplies(line.condition, bridge))
    .map((line) => {
      const comp = getComponent(components, line.componentId);
      const qty = (line.qty || 0) * baseMultiplier(line.base, bridge);
      const unitPrice = (comp?.unitPrice ?? 0) *
        (line.base === "sensor" ? sensorPriceMultiplier : 1);
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

/** Converte o preço final manual em valor-base para não reaplicar BDI/impostos. */
export function calculateModelingDetails(
  bridge: BridgeSpan,
  components: ComponentItem[],
  compositions: Compositions = defaultCompositions,
  commercialFactor = 1.5
): CompositionDetailLine[] {
  if (bridge.modelingPricingMode !== "manual") {
    return buildGroup(compositions.modeling, bridge, components);
  }
  const finalValue = Number.isFinite(Number(bridge.manualModelingSimulationFinalValue))
    ? Math.max(0, Number(bridge.manualModelingSimulationFinalValue)) : 0;
  const factor = Number.isFinite(commercialFactor) && commercialFactor > 0 ? commercialFactor : 1;
  const amount = finalValue / factor;
  return [{
    componentId: "MODEL-SIM-MANUAL", componentName: "Modelagem e simulação (valor-base manual)",
    unit: "Serviço", qty: 1, unitPrice: amount, total: amount,
  }];
}

export function calculateBridgeCosts(
  bridge: BridgeSpan,
  components: ComponentItem[],
  compositions: Compositions = defaultCompositions,
  commercialFactor = 1.5
): BridgeCosts {
  const sensorCostDetails = buildGroup(compositions.sensors, bridge, components);
  const sensorCost = sumLines(sensorCostDetails);
  const sensorMaterialUnitCost = calculateSensorMaterialUnitCost(components, compositions);
  const sensorSaleUnitPrice = calculateSensorSaleUnitPrice(
    sensorMaterialUnitCost,
    compositions.sensorPricing ?? defaultSensorPricing
  );
  const sensorCommercialFactor = sensorMaterialUnitCost > 0
    ? sensorSaleUnitPrice / sensorMaterialUnitCost
    : 0;
  const legacyCommandBoxLines = compositions.commandBox.map((line) => ({
    ...line,
    base: line.base === "caixa_comando" ? "kit_solar" as const : line.base,
  }));
  const details = {
    sensors: buildGroup(
      compositions.sensors,
      bridge,
      components,
      (bridge.sensorPriceMultiplier || 1) * sensorCommercialFactor
    ),
    // Infraestrutura e instalação de campo são premissas de responsabilidade do cliente.
    infrastructure: [],
    energy: buildGroup([...compositions.energy, ...legacyCommandBoxLines], bridge, components),
    connectivity: buildGroup(compositions.connectivity, bridge, components),
    commandBox: [],
    internalLabor: compositions.includeInternalLabor !== false
      ? buildGroup(
          compositions.internalLabor,
          bridge,
          components,
          bridge.sensorPriceMultiplier || 1
        )
      : [],
    services: buildGroup(compositions.services, bridge, components),
    modeling: calculateModelingDetails(bridge, components, compositions, commercialFactor),
  } as Record<BudgetGroupKey, CompositionDetailLine[]>;

  const sensors = sumLines(details.sensors);
  const infrastructure = sumLines(details.infrastructure);
  const energy = sumLines(details.energy);
  const connectivity = sumLines(details.connectivity);
  const commandBox = 0;
  const internalLabor = sumLines(details.internalLabor);
  const services = sumLines(details.services);
  const modeling = sumLines(details.modeling);

  const equipmentTotal = sensors + infrastructure + energy + connectivity + commandBox;

  const modelingEngineering = modeling;
  const databaseAdequationCost = details.internalLabor
    .filter((l) => l.componentId === "CN02")
    .reduce((s, l) => s + l.total, 0);

  const extraItemsCost = calculateExtraItemsCost(bridge.extraItems || [], components);

  const directCost = sensorCost + infrastructure + energy + connectivity + commandBox +
    internalLabor + services + modeling + extraItemsCost;
  const total = equipmentTotal + internalLabor + services + modeling + extraItemsCost;

  return {
    bridgeId: bridge.id,
    bridgeName: bridge.name || "OAE sem nome",
    sensorCost,
    sensors,
    infrastructure,
    energy,
    connectivity,
    commandBox,
    internalLabor,
    equipmentTotal,
    services,
    modeling,
    modelingEngineering,
    databaseAdequationCost,
    extraItemsCost,
    details,
    directCost,
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
  const commercialFactor = 1 + bdiRate + taxRate;
  const bridgeCosts = bridges.map((b) => calculateBridgeCosts(b, components, compositions, commercialFactor));
  const subtotal = bridgeCosts.reduce((sum, bc) => sum + bc.total, 0);
  const servicesTotal = bridgeCosts.reduce((sum, bc) => sum + bc.services, 0);
  const modelingTotal = bridgeCosts.reduce((sum, bc) => sum + bc.modeling, 0);
  const internalLaborTotal = bridgeCosts.reduce((sum, bc) => sum + bc.internalLabor, 0);
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
  const directCost = bridgeCosts.reduce((sum, bridge) => sum + bridge.directCost, 0) + globalExtrasCost;
  const totalEstimatedCost = directCost + taxValue;
  const estimatedProfit = proposalValue - totalEstimatedCost;
  const estimatedProfitMargin = proposalValue > 0 ? estimatedProfit / proposalValue : 0;

  const monthlyAccompaniment = bridges.reduce(
    (sum, bridge) => sum +
      calculateMonthlyAccompanimentPerSpan(bridge.spanLength) * Math.max(0, Number(bridge.spanCount) || 0),
    0
  );

  return {
    bridgeCosts,
    subtotal,
    servicesTotal,
    modelingTotal,
    internalLaborTotal,
    databaseAdequationCost,
    globalExtrasCost,
    grandSubtotal,
    bdiRate,
    bdiValue,
    taxRate,
    taxValue,
    markup,
    markupValue,
    proposalValue,
    directCost,
    totalEstimatedCost,
    estimatedProfit,
    estimatedProfitMargin,
    monthlyAccompaniment,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
