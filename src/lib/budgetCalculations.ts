import { ComponentItem } from "@/data/components";
import { BridgeSpan } from "@/data/bridgeConfig";

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
  total: number;
}

export interface BudgetSummary {
  bridgeCosts: BridgeCosts[];
  subtotal: number;
  bdiRate: number;
  bdiValue: number;
  taxRate: number;
  taxValue: number;
  markup: number;
  markupValue: number;
  proposalValue: number;
  monthlyAccompaniment: number;
}

function getComponentPrice(components: ComponentItem[], id: string): number {
  return components.find((c) => c.id === id)?.unitPrice ?? 0;
}

export function calculateBridgeCosts(
  bridge: BridgeSpan,
  components: ComponentItem[]
): BridgeCosts {
  const totalLength = bridge.spanLength * bridge.spanCount;

  // Custo Sensores: (S01 + S02 + S03) * sensorCount + S04 * temperatureCount
  const sensorUnitCost =
    getComponentPrice(components, "S01") +
    getComponentPrice(components, "S02") +
    getComponentPrice(components, "S03");
  const sensors =
    sensorUnitCost * bridge.sensorCount +
    getComponentPrice(components, "S04") * bridge.temperatureCount;

  // Custo Infraestrutura
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

  // Custo Energia
  const energy =
    bridge.energySource === "Solar"
      ? getComponentPrice(components, "SOL-KIT") * (bridge.solarKitCount || 1)
      : getComponentPrice(components, "REDE");

  // Custo Conectividade
  const connectionCost =
    bridge.connectivity === "Completa"
      ? getComponentPrice(components, "CON1")
      : getComponentPrice(components, "CON2");
  const connectivity = connectionCost * (bridge.connectivityKitCount || 1);

  // Custo Caixa de Comando e Mão de obra
  const ccBase =
    getComponentPrice(components, "CC01") +
    getComponentPrice(components, "CC02") +
    getComponentPrice(components, "CC03") +
    getComponentPrice(components, "CC04");
  const ccMontagem =
    getComponentPrice(components, "CC05") * bridge.hoursAssembly;
  const ccConversor =
    bridge.energySource === "Rede"
      ? getComponentPrice(components, "CC06")
      : 0;
  const commandBox = ccBase + ccMontagem + ccConversor;

  const equipmentTotal = sensors + infrastructure + energy + connectivity + commandBox;

  // Custo Modelagem e Engenharia
  const modelingEngineering =
    (getComponentPrice(components, "P01") +
    getComponentPrice(components, "P02") +
    getComponentPrice(components, "CN02") * bridge.hoursAdequation) * bridge.spanCount;

  const total = equipmentTotal + modelingEngineering;

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
    total,
  };
}

export function calculateBudgetSummary(
  bridges: BridgeSpan[],
  components: ComponentItem[],
  bdiRate: number = 0.3,
  taxRate: number = 0.2,
  markup: number = 3
): BudgetSummary {
  const bridgeCosts = bridges.map((b) => calculateBridgeCosts(b, components));
  const subtotal = bridgeCosts.reduce((sum, bc) => sum + bc.total, 0);
  const bdiValue = subtotal * bdiRate;
  const taxValue = subtotal * taxRate;
  const markupValue = subtotal * markup;
  const proposalValue = subtotal + bdiValue + taxValue;

  // Mensalidade: (MEN * 40 + CN06 + CN05 + CN07) * total spans across all bridges
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
