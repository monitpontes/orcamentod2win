import { describe, expect, it } from "vitest";
import { createDefaultBridge, normalizeBridge } from "../data/bridgeConfig";
import { defaultComponents } from "../data/components";
import { defaultCompositions } from "../data/compositions";
import { buildPurchaseMaterialsList } from "../lib/materialsList";

describe("estações meteorológicas opcionais por ponte", () => {
  it("inicia novas pontes sem estação e mantém o sensor interno por vão", () => {
    const bridge = { ...createDefaultBridge(), spanCount: 2, temperatureCount: 4, sensorCount: 0 };
    expect(bridge.weatherStationCount).toBe(0);
    const rows = buildPurchaseMaterialsList([bridge], defaultComponents, [], defaultCompositions);
    expect(rows.some((row) => row.componentId.startsWith("WM"))).toBe(false);
    expect(rows.find((row) => row.componentId === "TI03")?.qty).toBe(2);
  });

  it("usa apenas a quantidade informada de estações, independentemente dos sensores de temperatura", () => {
    const bridge = { ...createDefaultBridge(), temperatureCount: 8, weatherStationCount: 1 };
    const rows = buildPurchaseMaterialsList([bridge], defaultComponents, [], defaultCompositions);
    expect(rows.find((row) => row.componentId === "WM03")?.qty).toBe(1);
    expect(rows.find((row) => row.componentId === "TI03")?.qty).toBe(bridge.spanCount);
  });

  it("preserva o escopo antigo ao abrir e respeita zero informado pelo cliente", () => {
    const legacy = normalizeBridge({ name: "Ponte antiga", typology: "Viga I", spanCount: 2, temperatureCount: 1 });
    expect(legacy.temperatureCount).toBe(4);
    expect(legacy.weatherStationCount).toBe(4);
    expect(normalizeBridge({ ...legacy, weatherStationCount: 0 }).weatherStationCount).toBe(0);
  });
});
