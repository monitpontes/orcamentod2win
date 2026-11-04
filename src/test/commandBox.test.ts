import { describe, expect, it } from "vitest";
import { defaultComponents, mergeWithDefaultComponents } from "../data/components";
import { defaultCompositions, normalizeCompositions } from "../data/compositions";
import { createDefaultBridge } from "../data/bridgeConfig";
import { calculateBridgeCosts } from "../lib/budgetCalculations";

const expectedBox: Record<string, number> = {
  CC01: 1,
  PS02: 1,
  PS04: 1,
  CC07: 1,
  PS07: 2,
  CC08: 1,
};

describe("caixa de comando solar", () => {
  it("contém controladora, cooler com placa, duas baterias e equalizador JFA", () => {
    for (const [id, qty] of Object.entries(expectedBox)) {
      expect(defaultCompositions.energy.find((line) => line.componentId === id)?.qty).toBe(qty);
    }
    expect(defaultComponents.find((component) => component.id === "CC08")).toMatchObject({
      name: "Equalizador de baterias JFA",
      unitPrice: 140,
    });
    expect(defaultComponents.find((component) => component.id === "PS02")?.name).toContain("Epever");
    expect(defaultCompositions.energy.some((line) => ["PS08", "CC02", "CC03", "CC04"].includes(line.componentId))).toBe(false);
  });

  it("limpa a composição salva e calcula uma caixa por conjunto de energia", () => {
    const legacy = structuredClone(defaultCompositions);
    legacy.energy = legacy.energy.filter((line) => !["CC07", "CC08"].includes(line.componentId));
    legacy.energy.push(
      { componentId: "PS08", qty: 1, base: "kit_solar", condition: "solar" },
      { componentId: "CC02", qty: 1, base: "kit_solar" }
    );
    const migrated = normalizeCompositions(legacy);
    expect(migrated.energy.filter((line) => line.componentId === "CC01")).toHaveLength(1);
    expect(migrated.energy.some((line) => ["PS08", "CC02"].includes(line.componentId))).toBe(false);
    expect(migrated.energy.find((line) => line.componentId === "CC07")?.qty).toBe(1);
    expect(migrated.energy.find((line) => line.componentId === "CC08")?.qty).toBe(1);

    const costs = calculateBridgeCosts(
      { ...createDefaultBridge(), energySource: "Solar", solarKitCount: 2 },
      defaultComponents,
      migrated
    );
    expect(costs.details.energy.find((line) => line.componentId === "PS07")?.qty).toBe(4);
    expect(costs.details.energy.find((line) => line.componentId === "CC08")?.qty).toBe(2);
  });

  it("preserva preços salvos e remove os componentes antigos do catálogo", () => {
    const saved = [
      { id: "PS02", name: "Controlador MPPT 20A", category: "Energia Solar", unit: "Unid.", unitPrice: 650 },
      { id: "PS08", name: "Caixa de comando (conjunto solar)", category: "Energia Solar", unit: "Unid.", unitPrice: 334.33 },
    ];
    const merged = mergeWithDefaultComponents(saved);
    expect(merged.find((component) => component.id === "PS02")).toMatchObject({
      name: "Controladora Epever MPPT 20A",
      unitPrice: 650,
    });
    expect(merged.some((component) => component.id === "PS08")).toBe(false);
    expect(merged.some((component) => component.id === "CC08")).toBe(true);
  });
});
