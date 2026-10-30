import { BridgeSpan } from "../data/bridgeConfig";

export type ModelingMode = BridgeSpan["modelingPricingMode"];

export function filterModelingBridges(
  bridges: BridgeSpan[], query: string, typology = "all", mode = "all"
): BridgeSpan[] {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  return bridges.filter((bridge) =>
    (typology === "all" || bridge.typology === typology) &&
    (mode === "all" || (bridge.modelingPricingMode || "automatic") === mode) &&
    (!normalized || [bridge.name, bridge.inventoryCode, bridge.structuralSection]
      .some((value) => String(value || "").toLocaleLowerCase("pt-BR").includes(normalized)))
  );
}

export function applyModelingPricingBatch(
  bridges: BridgeSpan[], ids: ReadonlySet<string>, mode: ModelingMode, finalValue: number
): BridgeSpan[] {
  if (mode === "manual" && (!Number.isFinite(finalValue) || finalValue < 0)) {
    throw new Error("Informe um valor final válido, maior ou igual a zero.");
  }
  return bridges.map((bridge) => ids.has(bridge.id)
    ? {
        ...bridge, modelingPricingMode: mode,
        ...(mode === "manual" ? { manualModelingSimulationFinalValue: finalValue } : {}),
      }
    : bridge);
}
