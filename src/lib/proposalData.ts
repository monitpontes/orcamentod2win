import { BridgeSpan } from "@/data/bridgeConfig";
import { BudgetSummary } from "@/lib/budgetCalculations";

export interface ProposalMetadata {
  clientName?: string;
  proposalName?: string;
  revision?: string;
  responsible?: string;
  monitoringMonths?: number;
  validityDays?: number;
}

export interface ProposalBridgeQuantity {
  bridgeId: string;
  name: string;
  inventoryCode: string;
  typology: string;
  spanCount: number;
  spanLength: number;
  beamCount: number;
  sensorCount: number;
  temperatureCount: number;
  totalSensorCount: number;
  energySource: string;
  energyKitCount: number;
  connectivity: string;
  connectivityKitCount: number;
  postCount: number;
  internalLaborHours: number;
}

export interface LaborQuantity {
  componentId: string;
  description: string;
  unit: string;
  hours: number;
  cost: number;
}

export function normalizeProposalMetadata(metadata: ProposalMetadata = {}): Required<ProposalMetadata> {
  return {
    clientName: metadata.clientName?.trim() || "[[NOME DA CONTRATANTE]]",
    proposalName: metadata.proposalName?.trim() || "[[CÓDIGO / TÍTULO DA PROPOSTA]]",
    revision: metadata.revision?.trim() || "1.0",
    responsible: metadata.responsible?.trim() || "João Casagrande",
    monitoringMonths: Math.max(1, metadata.monitoringMonths || 24),
    validityDays: Math.max(1, metadata.validityDays || 60),
  };
}

export function isProposalPlaceholder(value: string): boolean {
  return value.startsWith("[[") && value.endsWith("]]");
}

export function sanitizeFilename(value: string): string {
  return Array.from(value)
    .map((character) => character.charCodeAt(0) < 32 ? "-" : character)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[-_.]+|[-_.]+$/g, "")
    .slice(0, 80) || "OAE";
}

export function buildProposalBridgeQuantities(
  bridges: BridgeSpan[],
  summary: BudgetSummary
): ProposalBridgeQuantity[] {
  return bridges.map((bridge) => {
    const costs = summary.bridgeCosts.find((item) => item.bridgeId === bridge.id);
    const internalLaborHours = costs?.details.internalLabor.reduce(
      (total, line) => total + line.qty,
      0
    ) || 0;

    return {
      bridgeId: bridge.id,
      name: bridge.name || "OAE sem nome",
      inventoryCode: bridge.inventoryCode || "—",
      typology: bridge.typology,
      spanCount: bridge.spanCount || 0,
      spanLength: bridge.spanLength || 0,
      beamCount: bridge.beamCount || 0,
      sensorCount: bridge.sensorCount || 0,
      temperatureCount: bridge.temperatureCount || 0,
      totalSensorCount: (bridge.sensorCount || 0) + (bridge.temperatureCount || 0),
      energySource: bridge.energySource,
      energyKitCount: bridge.solarKitCount || 0,
      connectivity: bridge.connectivity,
      connectivityKitCount: bridge.connectivityKitCount || 0,
      postCount: bridge.postCount || 0,
      internalLaborHours,
    };
  });
}

export function aggregateInternalLabor(summary: BudgetSummary): LaborQuantity[] {
  const aggregate = new Map<string, LaborQuantity>();

  summary.bridgeCosts.forEach((bridge) => {
    bridge.details.internalLabor.forEach((line) => {
      const current = aggregate.get(line.componentId);
      if (current) {
        current.hours += line.qty;
        current.cost += line.total;
        return;
      }
      aggregate.set(line.componentId, {
        componentId: line.componentId,
        description: line.componentName,
        unit: line.unit,
        hours: line.qty,
        cost: line.total,
      });
    });
  });

  return Array.from(aggregate.values());
}
