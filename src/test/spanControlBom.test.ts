import { describe, expect, it } from "vitest";
import { createDefaultBridge } from "../data/bridgeConfig";
import { defaultComponents } from "../data/components";
import { defaultCompositions, normalizeCompositions } from "../data/compositions";
import { SPAN_CONTROL_BOM } from "../data/spanControlBom";
import { calculateBridgeCosts } from "../lib/budgetCalculations";

describe("controle e regulação por vão", () => {
  it("cadastra um relé completo e três step-downs por vão", () => {
    expect(SPAN_CONTROL_BOM.filter((item) => item.kind === "relay").map((item) => item.qtyPerSpan)).toEqual([1, 1, 1]);
    expect(SPAN_CONTROL_BOM.filter((item) => item.kind === "stepdown").map((item) => item.qtyPerSpan)).toEqual([1, 2]);
    for (const item of SPAN_CONTROL_BOM) {
      expect(defaultComponents.find((component) => component.id === item.componentId)?.unitPrice).toBe(item.unitPrice);
      expect(defaultCompositions.energy.find((line) => line.componentId === item.componentId)).toMatchObject({
        qty: item.qtyPerSpan,
        base: "vao",
      });
    }
  });

  it("multiplica os cinco itens pelo número de vãos no orçamento", () => {
    const bridge = { ...createDefaultBridge(), spanCount: 3 };
    const costs = calculateBridgeCosts(bridge, defaultComponents, defaultCompositions);
    const controlLines = costs.details.energy.filter((line) => line.componentId.startsWith("CV"));
    expect(controlLines).toHaveLength(SPAN_CONTROL_BOM.length);
    for (const item of SPAN_CONTROL_BOM) {
      expect(controlLines.find((line) => line.componentId === item.componentId)?.qty).toBe(item.qtyPerSpan * 3);
    }
    expect(controlLines.reduce((sum, line) => sum + line.total, 0)).toBeCloseTo(3 * 116.4, 8);
  });

  it("inclui a composição em orçamentos salvos sem duplicá-la", () => {
    const legacy = structuredClone(defaultCompositions);
    legacy.energy = legacy.energy.filter((line) => !line.componentId.startsWith("CV"));
    const migrated = normalizeCompositions(legacy);
    expect(migrated.energy.filter((line) => line.componentId.startsWith("CV"))).toHaveLength(SPAN_CONTROL_BOM.length);
    expect(normalizeCompositions(migrated).energy.filter((line) => line.componentId.startsWith("CV"))).toHaveLength(SPAN_CONTROL_BOM.length);
  });
});
