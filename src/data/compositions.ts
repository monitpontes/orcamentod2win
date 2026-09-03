import { BridgeSpan } from "@/data/bridgeConfig";

export type CompositionBase =
  | "fixo"
  | "sensor"
  | "temperatura"
  | "vao"
  | "metro"
  | "metro_cabo"
  | "kit_solar"
  | "kit_conexao"
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
  | "services"
  | "modeling";

export type Compositions = Record<BudgetGroupKey, CompositionLine[]>;

export const BUDGET_GROUPS: { key: BudgetGroupKey; label: string }[] = [
  { key: "sensors", label: "Sensores" },
  { key: "infrastructure", label: "Infraestrutura" },
  { key: "energy", label: "Energia" },
  { key: "connectivity", label: "Conectividade" },
  { key: "commandBox", label: "Caixa de Comando" },
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
  { value: "kit_solar", label: "Por kit solar" },
  { value: "kit_conexao", label: "Por kit de conexão" },
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
      return bridge.solarKitCount || 1;
    case "kit_conexao":
      return bridge.connectivityKitCount || 1;
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
  sensors: [
    { componentId: "S01", qty: 1, base: "sensor" },
    { componentId: "S03", qty: 1, base: "sensor" },
    { componentId: "S02", qty: 1, base: "sensor" },
    { componentId: "S04", qty: 1, base: "temperatura" },
  ],
  infrastructure: [
    { componentId: "INF01", qty: 1 / 3, base: "metro" },
    { componentId: "INF02", qty: 0.01, base: "metro_cabo" },
    { componentId: "INF03", qty: 1, base: "vao" },
    { componentId: "INF04", qty: 1, base: "sensor" },
    { componentId: "INF05", qty: 1, base: "vao" },
    { componentId: "INF06", qty: 1, base: "sensor" },
  ],
  energy: [
    { componentId: "SOL-KIT", qty: 1, base: "kit_solar", condition: "solar" },
    { componentId: "REDE", qty: 1, base: "fixo", condition: "rede" },
  ],
  connectivity: [
    { componentId: "CON1", qty: 1, base: "kit_conexao", condition: "conexao_completa" },
    { componentId: "CON2", qty: 1, base: "kit_conexao", condition: "conexao_parcial" },
  ],
  commandBox: [
    { componentId: "CC01", qty: 1, base: "kit_solar" },
    { componentId: "CC02", qty: 1, base: "kit_solar" },
    { componentId: "CC03", qty: 1, base: "kit_solar" },
    { componentId: "CC04", qty: 1, base: "kit_solar" },
    { componentId: "CC06", qty: 1, base: "kit_solar", condition: "rede" },
  ],
  services: [
    { componentId: "CC05", qty: 1, base: "hora_montagem" },
    { componentId: "CN02", qty: 1, base: "hora_adequacao" },
  ],
  modeling: [
    { componentId: "P01", qty: 1, base: "vao" },
    { componentId: "P02", qty: 1, base: "vao" },
  ],
};

export function normalizeCompositions(raw: unknown): Compositions {
  const result: Compositions = {
    sensors: [],
    infrastructure: [],
    energy: [],
    connectivity: [],
    commandBox: [],
    services: [],
    modeling: [],
  };
  const source = (raw && typeof raw === "object" ? raw : {}) as Partial<Compositions>;
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
  if (!hasAny) return structuredClone(defaultCompositions);

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
  const s03 = result.services.find((l) => l.componentId === "S03");
  if (s03) {
    result.services = result.services.filter((l) => l.componentId !== "S03");
    if (!result.sensors.some((l) => l.componentId === "S03")) {
      result.sensors = [...result.sensors, s03];
    }
  }
  return result;
}
