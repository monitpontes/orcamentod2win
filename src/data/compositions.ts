import { BridgeSpan } from "./bridgeConfig";
import { SENSOR_BOM } from "./sensorBom";

export type CompositionBase =
  | "fixo"
  | "sensor"
  | "temperatura"
  | "vao"
  | "metro"
  | "metro_cabo"
  | "kit_solar"
  | "kit_conexao"
  | "caixa_comando"
  | "poste"
  | "hora_montagem"
  | "hora_adequacao";

export type CompositionCondition =
  | "sempre"
  | "solar"
  | "rede"
  | "conexao_completa"
  | "conexao_parcial";

export interface CompositionLine {
  componentId: string;
  /** Quantidade por unidade da base escolhida */
  qty: number;
  base: CompositionBase;
  condition?: CompositionCondition;
}

export type BudgetGroupKey =
  | "sensors"
  | "infrastructure"
  | "energy"
  | "connectivity"
  | "commandBox"
  | "internalLabor"
  | "services"
  | "modeling";

export type SensorPricingMode = "margin" | "salePrice";

export interface SensorPricingSettings {
  mode: SensorPricingMode;
  /** Margem de lucro sobre o preço de venda (não markup sobre o custo). */
  marginPercent: number;
  /** Preço unitário final quando o modo de valor de venda estiver selecionado. */
  salePrice: number;
}

export const defaultSensorPricing: SensorPricingSettings = {
  mode: "margin",
  marginPercent: 0,
  salePrice: 0,
};

export type Compositions = Record<BudgetGroupKey, CompositionLine[]> & {
  sensorPricing: SensorPricingSettings;
  includeInternalLabor: boolean;
};

export const BUDGET_GROUPS: { key: BudgetGroupKey; label: string }[] = [
  { key: "sensors", label: "Sensores" },
  { key: "infrastructure", label: "Infraestrutura — responsabilidade do cliente" },
  { key: "energy", label: "Energia" },
  { key: "connectivity", label: "Conectividade" },
  { key: "internalLabor", label: "Mão de Obra Interna" },
  { key: "services", label: "Serviços" },
  { key: "modeling", label: "Modelagem e Simulação" },
];

export const BASE_OPTIONS: { value: CompositionBase; label: string }[] = [
  { value: "fixo", label: "Fixo (1x por OAE)" },
  { value: "sensor", label: "Por sensor" },
  { value: "temperatura", label: "Por estação meteorológica" },
  { value: "vao", label: "Por vão" },
  { value: "metro", label: "Por metro (extensão total)" },
  { value: "metro_cabo", label: "Por metro (extensão + cabo extra)" },
  { value: "kit_solar", label: "Por conjunto de energia" },
  { value: "kit_conexao", label: "Por kit de conexão" },
  { value: "poste", label: "Por poste" },
  { value: "hora_montagem", label: "Por hora de montagem" },
  { value: "hora_adequacao", label: "Por hora de adequação de BD" },
];

export const CONDITION_OPTIONS: { value: CompositionCondition; label: string }[] = [
  { value: "sempre", label: "Sempre" },
  { value: "solar", label: "Somente energia Solar" },
  { value: "rede", label: "Somente energia Rede" },
  { value: "conexao_completa", label: "Somente conexão Completa" },
  { value: "conexao_parcial", label: "Somente conexão Parcial" },
];

export function baseMultiplier(base: CompositionBase, bridge: BridgeSpan): number {
  const totalLength = bridge.spanLength * bridge.spanCount;
  switch (base) {
    case "fixo":
      return 1;
    case "sensor":
      return bridge.sensorCount || 0;
    case "temperatura":
      return bridge.temperatureCount || 0;
    case "vao":
      return bridge.spanCount || 0;
    case "metro":
      return totalLength;
    case "metro_cabo":
      return totalLength + (bridge.extraCableDistance || 0);
    case "kit_solar":
      return bridge.solarKitCount ?? 1;
    case "kit_conexao":
      return bridge.connectivityKitCount ?? 1;
    case "caixa_comando":
      return bridge.commandBoxCount || 0;
    case "poste":
      return bridge.postCount || 0;
    case "hora_montagem":
      return bridge.hoursAssembly || 0;
    case "hora_adequacao":
      return bridge.hoursAdequation || 0;
    default:
      return 0;
  }
}

export function conditionApplies(
  condition: CompositionCondition | undefined,
  bridge: BridgeSpan
): boolean {
  switch (condition) {
    case "solar":
      return bridge.energySource === "Solar";
    case "rede":
      return bridge.energySource === "Rede";
    case "conexao_completa":
      return bridge.connectivity === "Completa";
    case "conexao_parcial":
      return bridge.connectivity === "Parcial";
    default:
      return true;
  }
}

export const defaultCompositions: Compositions = {
  sensorPricing: defaultSensorPricing,
  includeInternalLabor: true,
  sensors: [
    ...SENSOR_BOM.map((item) => ({
      componentId: item.componentId,
      qty: item.qtyPerSensor,
      base: "sensor" as const,
    })),
    { componentId: "S04", qty: 1, base: "temperatura" },
  ],
  infrastructure: [
    { componentId: "INF01", qty: 1 / 3, base: "metro" },
    { componentId: "INF02", qty: 0.01, base: "metro_cabo" },
    { componentId: "INF03", qty: 1, base: "vao" },
    { componentId: "INF04", qty: 1, base: "sensor" },
    { componentId: "INF05", qty: 1, base: "vao" },
    { componentId: "INF06", qty: 1, base: "sensor" },
    { componentId: "INF07", qty: 1, base: "poste" },
  ],
  energy: [
    { componentId: "PS06", qty: 1, base: "kit_solar", condition: "solar" },
    { componentId: "PS07", qty: 2, base: "kit_solar", condition: "solar" },
    { componentId: "PS02", qty: 1, base: "kit_solar", condition: "solar" },
    { componentId: "PS03", qty: 2, base: "kit_solar", condition: "solar" },
    { componentId: "PS08", qty: 1, base: "kit_solar", condition: "solar" },
    { componentId: "PS04", qty: 1, base: "kit_solar", condition: "solar" },
    { componentId: "PS09", qty: 1, base: "kit_solar", condition: "solar" },
    { componentId: "PS10", qty: 1, base: "kit_solar", condition: "solar" },
    { componentId: "PS11", qty: 4, base: "kit_solar", condition: "solar" },
    // A caixa de comando integra o conjunto de energia.
    { componentId: "CC01", qty: 1, base: "kit_solar" },
    { componentId: "CC02", qty: 1, base: "kit_solar" },
    { componentId: "CC03", qty: 1, base: "kit_solar" },
    { componentId: "CC04", qty: 1, base: "kit_solar" },
    { componentId: "CC06", qty: 1, base: "kit_solar", condition: "rede" },
    { componentId: "ER01", qty: 1, base: "kit_solar", condition: "rede" },
    { componentId: "ER02", qty: 1, base: "kit_solar", condition: "rede" },
    { componentId: "ER03", qty: 1, base: "kit_solar", condition: "rede" },
    { componentId: "ER04", qty: 1, base: "kit_solar", condition: "rede" },
    { componentId: "ER05", qty: 1, base: "kit_solar", condition: "rede" },
  ],
  connectivity: [
    { componentId: "CON1", qty: 1, base: "kit_conexao", condition: "conexao_completa" },
    { componentId: "CON2", qty: 1, base: "kit_conexao", condition: "conexao_parcial" },
  ],
  commandBox: [],
  internalLabor: [
    { componentId: "MOI01", qty: 4, base: "fixo" },
    { componentId: "MOI02", qty: 2, base: "vao" },
    { componentId: "MOI03", qty: 1, base: "sensor" },
    { componentId: "MOI04", qty: 0.5, base: "sensor" },
    { componentId: "MOI05", qty: 2, base: "fixo" },
    { componentId: "CC05", qty: 1, base: "hora_montagem" },
    { componentId: "CN02", qty: 1, base: "hora_adequacao" },
  ],
  services: [],
  modeling: [
    { componentId: "P01", qty: 1, base: "vao" },
    { componentId: "P02", qty: 1, base: "vao" },
  ],
};

export function normalizeCompositions(raw: unknown): Compositions {
  const result: Compositions = {
    sensorPricing: structuredClone(defaultSensorPricing),
    includeInternalLabor: true,
    sensors: [],
    infrastructure: [],
    energy: [],
    connectivity: [],
    commandBox: [],
    internalLabor: [],
    services: [],
    modeling: [],
  };
  const source = (raw && typeof raw === "object" ? raw : {}) as Partial<Compositions>;
  result.includeInternalLabor = source.includeInternalLabor !== false;
  if (source.sensorPricing && typeof source.sensorPricing === "object") {
    const mode = source.sensorPricing.mode === "salePrice" ? "salePrice" : "margin";
    result.sensorPricing = {
      mode,
      marginPercent: Math.min(99.99, Math.max(0, Number(source.sensorPricing.marginPercent) || 0)),
      salePrice: Math.max(0, Number(source.sensorPricing.salePrice) || 0),
    };
  }
  const hasInternalLaborGroup = Array.isArray(source.internalLabor);
  let hasAny = false;
  BUDGET_GROUPS.forEach(({ key }) => {
    const lines = source[key];
    if (Array.isArray(lines)) {
      hasAny = true;
      result[key] = lines
        .filter((l) => l && typeof l.componentId === "string")
        .map((l) => ({
          componentId: l.componentId,
          qty: Number(l.qty) || 0,
          base: (l.base as CompositionBase) || "fixo",
          condition: (l.condition as CompositionCondition) || "sempre",
        }));
    }
  });

  // Migração: propostas antigas guardavam a caixa em um grupo separado.
  // O conjunto passa a usar a mesma quantidade configurada para Energia.
  if (Array.isArray(source.commandBox) && source.commandBox.length > 0) {
    hasAny = true;
    const existingEnergyIds = new Set(result.energy.map((line) => line.componentId));
    const migratedCommandBox = source.commandBox
      .filter((line) => line && typeof line.componentId === "string")
      .filter((line) => !existingEnergyIds.has(line.componentId))
      .map((line) => ({
        componentId: line.componentId,
        qty: Number(line.qty) || 0,
        base: "kit_solar" as const,
        condition: (line.condition as CompositionCondition) || "sempre",
      }));
    result.energy = [...result.energy, ...migratedCommandBox];
  }
  if (!hasAny) return structuredClone(defaultCompositions);

  if (!hasInternalLaborGroup) {
    result.internalLabor = structuredClone(defaultCompositions.internalLabor);
  }

  // Migração: substitui os itens agregados antigos pela lista completa do sensor.
  const hasLegacySensor = result.sensors.some((line) =>
    line.componentId === "S01" || line.componentId === "S02"
  );
  if (hasLegacySensor) {
    const withoutLegacy = result.sensors.filter((line) =>
      line.componentId !== "S01" && line.componentId !== "S02"
    );
    const existingIds = new Set(withoutLegacy.map((line) => line.componentId));
    const detailedSensorLines = defaultCompositions.sensors.filter((line) =>
      line.componentId.startsWith("SA") && !existingIds.has(line.componentId)
    );
    result.sensors = [...detailedSensorLines, ...withoutLegacy];
  }

  // Migração: hora de produção do sensor (S03) vai para Sensores;
  // modelagem/simulação (P01/P02) viram grupo próprio.
  const isModelingId = (id: string) => id === "P01" || id === "P02";
  const modelingFromServices = result.services.filter((l) => isModelingId(l.componentId));
  if (modelingFromServices.length > 0) {
    result.services = result.services.filter((l) => !isModelingId(l.componentId));
    const existing = new Set(result.modeling.map((l) => l.componentId));
    result.modeling = [
      ...result.modeling,
      ...modelingFromServices.filter((l) => !existing.has(l.componentId)),
    ];
  }
  if (result.modeling.length === 0) {
    result.modeling = structuredClone(defaultCompositions.modeling);
  }
  result.commandBox = [];
  if (!result.infrastructure.some((line) => line.componentId === "INF07")) {
    result.infrastructure = [
      ...result.infrastructure,
      { componentId: "INF07", qty: 1, base: "poste", condition: "sempre" },
    ];
  }
  // Migração: kits de energia viram itens detalhados
  if (result.energy.some((l) => l.componentId === "SOL-KIT" || l.componentId === "REDE")) {
    const keep = result.energy.filter(
      (l) => l.componentId !== "SOL-KIT" && l.componentId !== "REDE"
    );
    result.energy = [...keep, ...structuredClone(defaultCompositions.energy)];
  }
  result.energy = result.energy.map((line) =>
    line.base === "caixa_comando"
      ? { ...line, base: "kit_solar" }
      : line.condition === "rede" && line.base === "fixo"
      ? { ...line, base: "kit_solar" }
      : line
  );
  const migratedLaborIds = new Set(["S03", "CC05", "CN02"]);
  result.sensors = result.sensors.filter((line) => line.componentId !== "S03");
  result.services = result.services.filter((line) => !migratedLaborIds.has(line.componentId));
  return result;
}
