import { describe, expect, it } from "vitest";
import { createDefaultBridge } from "../data/bridgeConfig";
import { defaultComponents } from "../data/components";
import { defaultCompositions } from "../data/compositions";
import { buildPurchaseMaterialsList, GLOBAL_EXTRAS_KEY } from "../lib/materialsList";

describe("materiais da lista de compras por orçamento", () => {
  it("gera peças físicas conforme os quantitativos de cada ponte", () => {
    const first = { ...createDefaultBridge(), name: "Ponte A", spanCount: 2, sensorCount: 3, sensorPriceMultiplier: 2, temperatureCount: 1, weatherStationCount: 1 };
    const second = { ...createDefaultBridge(), name: "Ponte B", spanCount: 1, sensorCount: 1, temperatureCount: 0 };
    const rows = buildPurchaseMaterialsList([first, second], defaultComponents, [], defaultCompositions);

    expect(rows.find((row) => row.bridgeKey === first.id && row.componentId === "CV02")?.qty).toBe(2);
    expect(rows.find((row) => row.bridgeKey === first.id && row.componentId === "CV05")?.qty).toBe(4);
    expect(rows.find((row) => row.bridgeKey === second.id && row.componentId === "CV05")?.qty).toBe(2);
    expect(rows.find((row) => row.bridgeKey === first.id && row.componentId === "WM03")?.qty).toBe(1);
    expect(rows.find((row) => row.bridgeKey === first.id && row.componentId === "TI01")?.qty).toBe(2);
    expect(rows.find((row) => row.bridgeKey === first.id && row.componentId === "TI03")?.qty).toBe(2);
    expect(rows.find((row) => row.bridgeKey === second.id && row.componentId === "TI03")?.qty).toBe(1);
    expect(rows.find((row) => row.bridgeKey === first.id && row.componentId === "SA01")?.unitPrice).toBe(11.7);
    expect(rows.some((row) => row.bridgeKey === second.id && row.componentId === "WM03")).toBe(false);
    expect(rows.some((row) => ["Mão de Obra Interna", "Modelagem e Engenharia"].includes(row.category))).toBe(false);
  });

  it("inclui extras globais no mesmo orçamento", () => {
    const rows = buildPurchaseMaterialsList([], defaultComponents, [{ componentId: "PS03", qty: 3 }], defaultCompositions);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ bridgeKey: GLOBAL_EXTRAS_KEY, componentId: "PS03", qty: 3 });
  });

  it("soma a mesma peça quando aparece na composição e nos extras de uma ponte", () => {
    const bridge = createDefaultBridge();
    const original = buildPurchaseMaterialsList([bridge], defaultComponents, [], defaultCompositions)
      .find((row) => row.componentId === "CV02");
    expect(original).toBeDefined();
    bridge.extraItems = [{ componentId: "CV02", qty: 3 }];
    const rows = buildPurchaseMaterialsList([bridge], defaultComponents, [], defaultCompositions)
      .filter((row) => row.componentId === "CV02");
    expect(rows).toHaveLength(1);
    expect(rows[0].qty).toBe(original!.qty + 3);
    expect(rows[0].total).toBe(Math.round(rows[0].qty * rows[0].unitPrice * 100) / 100);
  });
});
