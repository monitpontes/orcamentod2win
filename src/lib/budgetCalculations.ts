import { ComponentItem } from "@/data/components";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";

const THIRD_PARTY_CATEGORY = "Infraestrutura de Terceiros";

export interface BridgeCosts {
  bridgeId: string;
  bridgeName: string;
  sensors: number;
  infrastructure: number;
  energy: number;
  connectivity: number;
  commandBox: number;
  equipmentTotal: number;
  modelingEngineering: number;
  extraItemsCost: number;
  thirdPartyCost: number;
  total: number;
}

export interface BudgetSummary {
  bridgeCosts: BridgeCosts[];
  subtotal: number;
  databaseAdequationCost: number;
  globalExtrasCost: number;
  grandSubtotal: number;
  bdiRate: number;
  bdiValue: number;
  taxRate: number;
  taxValue: number;
  markup: number;
  markupValue: number;
  thirdPartyTotal: number;
  proposalValue: number;
  monthlyAccompaniment: number;
}

function getComponent(components: ComponentItem[], id: string): ComponentItem | undefined {
  return components.find((c) => c.id === id);
}

function getComponentPrice(components: ComponentItem[], id: string): number {
  return getComponent(components, id)?.unitPrice ?? 0;
}

function isThirdParty(components: ComponentItem[], id: string): boolean {
  return getComponent(components, id)?.category === THIRD_PARTY_CATEGORY;
}

// Sums extras EXCLUDING third-party items
function calculateExtraItemsCost(extras: ExtraItem[], components: ComponentItem[]): number {
  return extras.reduce((sum, item) => {
    if (isThirdParty(components, item.componentId)) return sum;
    return sum + getComponentPrice(components, item.componentId) * item.qty;
  }, 0);
}

// Sums ONLY third-party extras (pass-through cost)
function calculateThirdPartyCost(extras: ExtraItem[], components: ComponentItem[]): number {
  return extras.reduce((sum, item) => {
    if (!isThirdParty(components, item.componentId)) return sum;
    return sum + getComponentPrice(components, item.componentId) * item.qty;
  }, 0);
}

export function calculateBridgeCosts(
  bridge: BridgeSpan,
  components: ComponentItem[]
): BridgeCosts {
  const totalLength = bridge.spanLength * bridge.spanCount;

  const sensorUnitCost =
    getComponentPrice(components, "S01") +
    getComponentPrice(components, "S02") +
    getComponentPrice(components, "S03");
  const sensors =
    sensorUnitCost * bridge.sensorCount +
    getComponentPrice(components, "S04") * bridge.temperatureCount;

  const eletrodutos = getComponentPrice(components, "INF01") * (totalLength / 3);
  const cabos =
    getComponentPrice(components, "INF02") *
    ((totalLength + bridge.extraCableDistance) / 100);
  const caixasPassagem = getComponentPrice(components, "INF03") * bridge.spanCount;
  const conduletes = getComponentPrice(components, "INF04") * bridge.sensorCount;
  const wagoKit = getComponentPrice(components, "INF05") * bridge.spanCount;
  const abraçadeiras = getComponentPrice(components, "INF06") * bridge.sensorCount;
  const infrastructure = bridge.hasInfrastructure
    ? eletrodutos + cabos + caixasPassagem + conduletes + wagoKit + abraçadeiras
    : 0;

  const energy =
    bridge.energySource === "Solar"
      ? getComponentPrice(components, "SOL-KIT") * (bridge.solarKitCount || 1)
      : getComponentPrice(components, "REDE");

  const connectionCost =
    bridge.connectivity === "Completa"
      ? getComponentPrice(components, "CON1")
      : getComponentPrice(components, "CON2");
  const connectivity = connectionCost * (bridge.connectivityKitCount || 1);

  const commandBoxCount = bridge.solarKitCount || 1;
  const ccBase =
    (getComponentPrice(components, "CC01") +
      getComponentPrice(components, "CC02") +
      getComponentPrice(components, "CC03") +
      getComponentPrice(components, "CC04")) *
    commandBoxCount;
  const ccMontagem =
    getComponentPrice(components, "CC05") * bridge.hoursAssembly;
  const ccConversor =
    bridge.energySource === "Rede"
      ? getComponentPrice(components, "CC06") * commandBoxCount
      : 0;
  const commandBox = ccBase + ccMontagem + ccConversor;

  const equipmentTotal = sensors + infrastructure + energy + connectivity + commandBox;

  const modelingEngineering =
    getComponentPrice(components, "P01") * bridge.spanCount +
    getComponentPrice(components, "P02") * bridge.spanCount;

  const extras = bridge.extraItems || [];
  const extraItemsCost = calculateExtraItemsCost(extras, components);
  const thirdPartyCost = calculateThirdPartyCost(extras, components);

  // Third-party items are excluded from the bridge total (pass-through, no BDI/Tax)
  const total = equipmentTotal + modelingEngineering + extraItemsCost;

  return {
    bridgeId: bridge.id,
    bridgeName: bridge.name || "OAE sem nome",
    sensors,
    infrastructure,
    energy,
    connectivity,
    commandBox,
    equipmentTotal,
    modelingEngineering,
    extraItemsCost,
    thirdPartyCost,
    total,
  };
}

export function calculateBudgetSummary(
  bridges: BridgeSpan[],
  components: ComponentItem[],
  bdiRate: number = 0.3,
  taxRate: number = 0.2,
  markup: number = 3,
  globalExtraItems: ExtraItem[] = []
): BudgetSummary {
  const bridgeCosts = bridges.map((b) => calculateBridgeCosts(b, components));
  const bridgesSubtotal = bridgeCosts.reduce((sum, bc) => sum + bc.total, 0);
  const totalAdequationHours = bridges.reduce((sum, b) => sum + (b.hoursAdequation || 0), 0);
  const databaseAdequationCost = getComponentPrice(components, "CN02") * totalAdequationHours;
  const subtotal = bridgesSubtotal + databaseAdequationCost;
  const globalExtrasCost = calculateExtraItemsCost(globalExtraItems, components);
  const grandSubtotal = subtotal + globalExtrasCost;
  const bdiValue = grandSubtotal * bdiRate;
  const taxValue = grandSubtotal * taxRate;
  const markupValue = grandSubtotal * markup;

  // Third-party costs (pass-through: no BDI / Taxes / Markup)
  const bridgeThirdPartyTotal = bridgeCosts.reduce((sum, bc) => sum + bc.thirdPartyCost, 0);
  const globalThirdPartyCost = calculateThirdPartyCost(globalExtraItems, components);
  const thirdPartyTotal = bridgeThirdPartyTotal + globalThirdPartyCost;

  const proposalValue = grandSubtotal + bdiValue + taxValue + thirdPartyTotal;

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
    databaseAdequationCost,
    globalExtrasCost,
    grandSubtotal,
    bdiRate,
    bdiValue,
    taxRate,
    taxValue,
    markup,
    markupValue,
    thirdPartyTotal,
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
