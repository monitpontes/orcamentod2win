import { EPR_REFERENCE_LABEL, eprReferenceQuantities } from "./eprReferenceQuantities";

export type EnergySource = "Solar" | "Rede";
export type ConnectivityType = "Completa" | "Parcial";
export type BridgeTypology =
  | "Manual"
  | "Viga I"
  | "Viga retangular"
  | "Viga T"
  | "Caixão"
  | "Laje - seção única"
  | "Laje - duas vias"
  | "Viga I + Caixão"
  | "Passarela"
  | "Outra";

export const SENSORS_PER_CONNECTIVITY_SET = 10;
export const SENSORS_PER_ENERGY_SET = 20;
/** @deprecated Use SENSORS_PER_CONNECTIVITY_SET. */
export const SENSORS_PER_SUPPORT_SET = SENSORS_PER_CONNECTIVITY_SET;

export interface ExtraItem {
  componentId: string;
  qty: number;
}

export interface BridgeSpan {
  id: string;
  name: string;
  inventoryCode?: string;
  structuralSection: string;
  typology: BridgeTypology;
  beamCount: number;
  spanLength: number;
  spanCount: number;
  sensorCount: number;
  sensorPriceMultiplier: number;
  temperatureCount: number;
  referenceSensorCount?: number;
  referenceTemperatureCount?: number;
  quantityReference?: string;
  energySource: EnergySource;
  solarKitCount: number;
  commandBoxCount: number;
  postCount: number;
  extraCableDistance: number;
  connectivity: ConnectivityType;
  connectivityKitCount: number;
  hasInfrastructure: boolean;
  hoursAdequation: number;
  hoursAssembly: number;
  modelingPricingMode: "automatic" | "manual";
  /** Valor final conjunto, incluindo BDI e impostos. */
  manualModelingSimulationFinalValue: number;
  extraItems: ExtraItem[];
}

export const createDefaultBridge = (): BridgeSpan => ({
  id: crypto.randomUUID(),
  name: "",
  structuralSection: "",
  typology: "Manual",
  beamCount: 0,
  spanLength: 0,
  spanCount: 1,
  sensorCount: 6,
  sensorPriceMultiplier: 1,
  temperatureCount: 2,
  energySource: "Solar",
  solarKitCount: 1,
  commandBoxCount: 1,
  postCount: 1,
  extraCableDistance: 0,
  connectivity: "Completa",
  connectivityKitCount: 1,
  hasInfrastructure: false,
  hoursAdequation: 30,
  hoursAssembly: 10,
  modelingPricingMode: "automatic",
  manualModelingSimulationFinalValue: 0,
  extraItems: [],
});

export function inferBridgeTypology(section: string): BridgeTypology {
  const normalized = section.trim().toLocaleLowerCase("pt-BR");
  const hasBoxGirder = normalized.includes("caixão") || normalized.includes("caixao");
  const hasIGirder = normalized.includes("viga i");
  if (normalized.includes("passarela")) return "Passarela";
  if (hasIGirder && hasBoxGirder) {
    return "Viga I + Caixão";
  }
  if (hasBoxGirder) return "Caixão";
  if (
    (normalized.includes("laje") || normalized.includes("seção") || normalized.includes("secao")) &&
    (normalized.includes("duas vias") || normalized.includes("duas pistas"))
  ) {
    return "Laje - duas vias";
  }
  if (normalized.includes("laje") || normalized.includes("seção única") || normalized.includes("secao unica")) {
    return "Laje - seção única";
  }
  if (hasIGirder) return "Viga I";
  if (normalized.includes("retangular")) return "Viga retangular";
  if (/\bviga(?:s)?\s+t\b/.test(normalized) || /\bse[cç][aã]o\s+t\b/.test(normalized)) return "Viga T";
  return normalized ? "Outra" : "Manual";
}

export function isBeamTypology(typology: BridgeTypology): boolean {
  return typology === "Viga I" || typology === "Viga retangular" || typology === "Viga T";
}

/** Quantitativo padrão de sensores de temperatura por vão, conforme a revisão EPR. */
export function calculateAutomaticTemperatureCount(
  typology: BridgeTypology,
  spanCount: number
): number | null {
  const spans = Math.max(1, Number(spanCount) || 1);
  if (typology === "Caixão") return spans * 4;
  if (
    isBeamTypology(typology) ||
    typology === "Laje - seção única" ||
    typology === "Laje - duas vias" ||
    typology === "Passarela"
  ) return spans * 2;
  return null;
}

export function calculateAutomaticSensorCount(
  typology: BridgeTypology,
  spanCount: number,
  beamCount: number
): number | null {
  const spans = Math.max(0, Number(spanCount) || 0);
  if (isBeamTypology(typology)) {
    const beams = Math.max(0, Number(beamCount) || 0);
    return beams > 0 ? spans * beams * 2 : 0;
  }
  if (typology === "Caixão") return spans * 6;
  if (typology === "Laje - seção única") return spans * 6;
  if (typology === "Laje - duas vias") return spans * 12;
  if (typology === "Passarela") return spans * 4;
  return null;
}

const EPR_PENDING_REVIEW = new Set(["071", "103", "122", "127"]);
const LEGACY_EPR_REFERENCE_LABEL = "Proposta EPR 15/09/2026";
const EPR_CONFIRMED_QUANTITIES: Record<string, { sensorCount: number; temperatureCount: number }> = {
  "105": { sensorCount: 16, temperatureCount: 8 },
  "116": { sensorCount: 18, temperatureCount: 12 },
};

function inventoryNumber(value?: string): string | null {
  const digits = String(value ?? "").match(/\d+/)?.[0];
  return digits ? digits.padStart(3, "0").slice(-3) : null;
}

function usesEprReference(bridge: Partial<BridgeSpan>): boolean {
  return bridge.quantityReference === EPR_REFERENCE_LABEL ||
    bridge.quantityReference === LEGACY_EPR_REFERENCE_LABEL;
}

export function applyEprReferenceQuantities(bridge: BridgeSpan): BridgeSpan {
  const number = inventoryNumber(bridge.inventoryCode);
  const reference = number ? eprReferenceQuantities[number] : undefined;
  if (!reference) return bridge;
  return {
    ...bridge,
    referenceSensorCount: reference.structural,
    referenceTemperatureCount: reference.temperature,
    quantityReference: EPR_REFERENCE_LABEL,
  };
}

export function isEprInventory(bridges: Array<Partial<BridgeSpan>>): boolean {
  const codes = bridges.map((bridge) => inventoryNumber(bridge.inventoryCode)).filter(Boolean) as string[];
  return new Set(codes).size === 130 && codes.every((code) => Boolean(eprReferenceQuantities[code]));
}

/** Aplica somente as decisões individuais já confirmadas no relatório EPR. */
function applyConfirmedEprFacts(bridge: BridgeSpan): BridgeSpan {
  if (!usesEprReference(bridge)) return bridge;
  const number = inventoryNumber(bridge.inventoryCode);
  if (number === "105") return { ...bridge, spanCount: 4, beamCount: 2, typology: "Viga I" };
  if (number === "116") return { ...bridge, spanCount: 3, typology: "Caixão" };
  if (number === "122") return { ...bridge, spanCount: 1, typology: "Laje - duas vias" };
  if (number === "127") return { ...bridge, spanCount: 3, typology: "Caixão" };
  return bridge;
}

/** Um conjunto de conectividade atende até 10 sensores e, no máximo, um vão. */
export function supportSetCount(sensorCount: number, spanCount = 1): number {
  const sensors = Math.max(0, Number(sensorCount) || 0);
  if (sensors === 0) return 0;
  const spans = Math.max(1, Number(spanCount) || 1);
  return Math.max(Math.ceil(sensors / SENSORS_PER_CONNECTIVITY_SET), spans);
}

/** Um conjunto de energia atende até 20 sensores e, no máximo, dois vãos. */
export function energySetCount(sensorCount: number, spanCount = 1): number {
  const sensors = Math.max(0, Number(sensorCount) || 0);
  if (sensors === 0) return 0;
  const spans = Math.max(1, Number(spanCount) || 1);
  return Math.max(Math.ceil(sensors / SENSORS_PER_ENERGY_SET), Math.ceil(spans / 2));
}

/** Recalcula somente conectividade e energia, sem alterar os sensores da OAE. */
export function applySupportSetRule(bridge: BridgeSpan): BridgeSpan {
  const totalSensors = Math.max(0, Number(bridge.sensorCount) || 0) +
    Math.max(0, Number(bridge.temperatureCount) || 0);
  const connectivitySets = supportSetCount(totalSensors, bridge.spanCount);
  const energySets = energySetCount(totalSensors, bridge.spanCount);
  return {
    ...bridge,
    connectivityKitCount: connectivitySets,
    solarKitCount: energySets,
    commandBoxCount: energySets,
    postCount: energySets,
  };
}

/** Aplica o padrão estrutural e dimensiona cada apoio separadamente. */
export function applyBridgeTemplate(bridge: BridgeSpan): BridgeSpan {
  const source = applyConfirmedEprFacts(bridge);
  const automaticCount = calculateAutomaticSensorCount(
    source.typology,
    source.spanCount,
    source.beamCount
  );
  const referenceSensorCount = Math.max(0, Number(source.referenceSensorCount) || 0);
  const manualSensorCount = Math.max(0, Number(source.sensorCount) || 0);
  const number = inventoryNumber(source.inventoryCode);
  const hasEprReference = usesEprReference(source);
  const confirmedQuantities = hasEprReference && number ? EPR_CONFIRMED_QUANTITIES[number] : undefined;
  const sensorCount = confirmedQuantities?.sensorCount ?? (hasEprReference
    ? number === "019"
      ? Math.max(referenceSensorCount, manualSensorCount)
      : Math.max(referenceSensorCount, manualSensorCount, automaticCount ?? 0)
    : automaticCount ?? manualSensorCount);
  const automaticTemperatureCount = calculateAutomaticTemperatureCount(source.typology, source.spanCount);
  const referenceTemperatureCount = Math.max(0, Number(source.referenceTemperatureCount) || 0);
  const manualTemperatureCount = Math.max(0, Number(source.temperatureCount) || 0);
  const temperatureCount = confirmedQuantities?.temperatureCount ?? (hasEprReference
    ? Math.max(referenceTemperatureCount, manualTemperatureCount, automaticTemperatureCount ?? 0)
    : automaticTemperatureCount ?? manualTemperatureCount);
  const templated = applySupportSetRule({
    ...source,
    sensorCount,
    temperatureCount,
    sensorPriceMultiplier: source.typology === "Caixão" ? 2 : 1,
  });
  return templated;
}

export function bridgeNeedsReview(bridge: BridgeSpan): boolean {
  const number = inventoryNumber(bridge.inventoryCode);
  if (usesEprReference(bridge) && number && EPR_PENDING_REVIEW.has(number)) return true;
  if (bridge.typology === "Outra" || bridge.typology === "Viga I + Caixão") return true;
  if (isBeamTypology(bridge.typology)) {
    return bridge.beamCount <= 0 || bridge.sensorCount <= 0 || bridge.temperatureCount <= 0;
  }
  return bridge.sensorCount <= 0 || bridge.temperatureCount <= 0;
}

export function normalizeBridge(
  raw: Partial<BridgeSpan>, commercialFactor = 1.5, useEprReference = false
): BridgeSpan {
  const legacyRaw = raw as Partial<BridgeSpan> & {
    sensorPlacements?: unknown; ifcModel?: unknown;
    manualModelingValue?: number; manualSimulationValue?: number;
  };
  const {
    sensorPlacements: _legacyPlacements, ifcModel: _legacyIfc,
    manualModelingValue: legacyModeling, manualSimulationValue: legacySimulation,
    ...bridgeRaw
  } = legacyRaw;
  void _legacyPlacements;
  void _legacyIfc;
  const defaults = createDefaultBridge();
  const structuralSection = raw.structuralSection ?? "";
  const inferredTypology = inferBridgeTypology(`${structuralSection} ${raw.name ?? ""}`);
  const typology = raw.typology === "Outra" && inferredTypology !== "Outra" && inferredTypology !== "Manual"
    ? inferredTypology
    : raw.typology ?? inferredTypology;
  const spanCount = Math.max(1, Number(raw.spanCount ?? defaults.spanCount) || 1);
  const sensorCount = Number(raw.sensorCount ?? defaults.sensorCount);
  const totalRawSensors = sensorCount + Number(raw.temperatureCount ?? defaults.temperatureCount);
  const defaultConnectivitySets = supportSetCount(totalRawSensors, spanCount);
  const defaultEnergySets = energySetCount(totalRawSensors, spanCount);
  const nonNegativeValue = (value: unknown) => Number.isFinite(Number(value))
    ? Math.max(0, Number(value)) : 0;
  const factor = Number.isFinite(commercialFactor) && commercialFactor > 0 ? commercialFactor : 1;
  // Os antigos campos eram valores-base separados; preserva o total comercial salvo.
  const manualFinalValue = raw.manualModelingSimulationFinalValue ??
    (nonNegativeValue(legacyModeling) + nonNegativeValue(legacySimulation)) * factor;
  let normalizedSource: BridgeSpan = {
    ...defaults,
    ...bridgeRaw,
    id: raw.id || defaults.id,
    structuralSection,
    typology,
    spanCount,
    beamCount: Number(raw.beamCount ?? 0),
    sensorCount,
    temperatureCount: Number(raw.temperatureCount ?? defaults.temperatureCount),
    sensorPriceMultiplier: Number(raw.sensorPriceMultiplier ?? (typology === "Caixão" ? 2 : 1)),
    connectivityKitCount: Number(raw.connectivityKitCount ?? defaultConnectivitySets),
    solarKitCount: Number(raw.solarKitCount ?? defaultEnergySets),
    commandBoxCount: Number(raw.commandBoxCount ?? raw.solarKitCount ?? defaultEnergySets),
    postCount: Number(raw.postCount ?? defaultEnergySets),
    hasInfrastructure: false,
    modelingPricingMode: raw.modelingPricingMode === "manual" ? "manual" : "automatic",
    manualModelingSimulationFinalValue: nonNegativeValue(manualFinalValue),
    extraItems: Array.isArray(raw.extraItems) ? raw.extraItems : [],
  };
  if (useEprReference || usesEprReference(raw)) {
    normalizedSource = applyEprReferenceQuantities(normalizedSource);
  }
  normalizedSource = applyConfirmedEprFacts(normalizedSource);
  const automaticSensorCount = calculateAutomaticSensorCount(
    normalizedSource.typology,
    normalizedSource.spanCount,
    normalizedSource.beamCount
  );
  const automaticTemperatureCount = calculateAutomaticTemperatureCount(
    normalizedSource.typology,
    normalizedSource.spanCount
  );
  const referenceSensorCount = Math.max(0, Number(normalizedSource.referenceSensorCount) || 0);
  const referenceTemperatureCount = Math.max(0, Number(normalizedSource.referenceTemperatureCount) || 0);
  const number = inventoryNumber(normalizedSource.inventoryCode);
  const hasEprReference = usesEprReference(normalizedSource);
  const confirmedQuantities = hasEprReference && number ? EPR_CONFIRMED_QUANTITIES[number] : undefined;
  const finalSensorCount = confirmedQuantities?.sensorCount ?? (hasEprReference
    ? number === "019"
      ? Math.max(referenceSensorCount, normalizedSource.sensorCount)
      : Math.max(referenceSensorCount, normalizedSource.sensorCount, automaticSensorCount ?? 0)
    : automaticSensorCount ?? normalizedSource.sensorCount);
  const finalTemperatureCount = confirmedQuantities?.temperatureCount ?? (hasEprReference
    ? Math.max(referenceTemperatureCount, normalizedSource.temperatureCount, automaticTemperatureCount ?? 0)
    : automaticTemperatureCount ?? normalizedSource.temperatureCount);
  return applySupportSetRule({
    ...normalizedSource,
    sensorCount: finalSensorCount,
    temperatureCount: finalTemperatureCount,
    sensorPriceMultiplier: normalizedSource.typology === "Caixão" ? 2 : 1,
  });
}

export function bridgeFromInventoryRow(row: unknown[], useEprReference = false): BridgeSpan | null {
  const code = String(row[1] ?? "").trim();
  const number = String(row[2] ?? "").trim();
  const displayName = String(row[8] ?? "").trim();
  const section = String(row[11] ?? "").trim();
  const totalLength = Number(row[12]) || 0;
  const spanCount = Math.max(1, Number(row[19]) || 1);
  if (!code && !number && !displayName) return null;

  const typology = inferBridgeTypology(`${section} ${displayName}`);
  const bridge: BridgeSpan = {
    ...createDefaultBridge(),
    inventoryCode: number || code,
    name: displayName && displayName !== "Ponte" ? `${number || code} — ${displayName}` : code || number,
    structuralSection: section,
    typology,
    spanLength: Math.round((totalLength / spanCount) * 1000) / 1000,
    spanCount,
    beamCount: 0,
    sensorCount: typology === "Caixão" ? spanCount * 6 : 0,
    sensorPriceMultiplier: typology === "Caixão" ? 2 : 1,
  };
  return applyBridgeTemplate(useEprReference ? applyEprReferenceQuantities(bridge) : bridge);
}
