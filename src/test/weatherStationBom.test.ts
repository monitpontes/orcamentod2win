import { describe, expect, it } from "vitest";
import { defaultComponents, mergeWithDefaultComponents } from "../data/components";
import { defaultCompositions, normalizeCompositions } from "../data/compositions";
import { WEATHER_STATION_BOM } from "../data/weatherStationBom";
import { INTERNAL_TEMPERATURE_BOM } from "../data/internalTemperatureBom";
import { calculateBridgeCosts } from "../lib/budgetCalculations";
import { createDefaultBridge } from "../data/bridgeConfig";

describe("estação meteorológica na placa genérica", () => {
  it("cadastra as peças por estação, com temperatura externa I²C e sem resistores", () => {
    expect(WEATHER_STATION_BOM.find((part) => part.componentId === "WM03")).toMatchObject({
      name: "Sensor externo de temperatura e umidade SHT30 (I²C)", unitPrice: 100,
    });
    expect(WEATHER_STATION_BOM.some((part) => /resistor/i.test(part.name))).toBe(false);
    expect(defaultCompositions.sensors.some((line) => line.componentId === "S04")).toBe(false);
    for (const part of WEATHER_STATION_BOM) {
      expect(defaultComponents.find((component) => component.id === part.componentId)?.unitPrice).toBe(part.unitPrice);
      expect(defaultCompositions.sensors.find((line) => line.componentId === part.componentId)).toMatchObject({
        qty: part.qtyPerStation,
        base: "temperatura",
      });
    }
  });

  it("substitui o preço fechado antigo sem duplicar a estação no orçamento", () => {
    const compositions = normalizeCompositions({
      ...structuredClone(defaultCompositions),
      sensors: [
        ...defaultCompositions.sensors.filter((line) => !line.componentId.startsWith("WM") && !line.componentId.startsWith("TI")),
        { componentId: "S04", qty: 1, base: "temperatura" },
      ],
    });
    expect(compositions.sensors.some((line) => line.componentId === "S04")).toBe(false);
    expect(compositions.sensors.filter((line) => line.componentId.startsWith("WM"))).toHaveLength(WEATHER_STATION_BOM.length);
    expect(compositions.sensors.filter((line) => line.componentId.startsWith("TI"))).toHaveLength(INTERNAL_TEMPERATURE_BOM.length);

    const bridge = { ...createDefaultBridge(), sensorCount: 0, temperatureCount: 1, weatherStationCount: 1 };
    const costs = calculateBridgeCosts(bridge, defaultComponents, compositions);
    const expected = WEATHER_STATION_BOM.reduce((sum, part) => sum + part.qtyPerStation * part.unitPrice, 0) +
      INTERNAL_TEMPERATURE_BOM.reduce((sum, part) => sum + part.qtyPerSpan * part.unitPrice, 0);
    expect(costs.sensorCost).toBeCloseTo(expected, 8);
  });

  it("monta um sensor interno NTC 10k com placa própria por vão", () => {
    expect(INTERNAL_TEMPERATURE_BOM.find((part) => part.componentId === "TI03")).toMatchObject({
      name: "Sonda de temperatura interna NTC 10k", unitPrice: 10, qtyPerSpan: 1,
    });
    expect(INTERNAL_TEMPERATURE_BOM.find((part) => part.componentId === "TI01")?.name).toBe("Placa Genérica PCB");
    const bridge = { ...createDefaultBridge(), sensorCount: 0, temperatureCount: 1, weatherStationCount: 1, spanCount: 3 };
    const costs = calculateBridgeCosts(bridge, defaultComponents, defaultCompositions);
    const stationCost = WEATHER_STATION_BOM.reduce((sum, part) => sum + part.qtyPerStation * part.unitPrice, 0);
    const internalCost = INTERNAL_TEMPERATURE_BOM.reduce((sum, part) => sum + part.qtyPerSpan * part.unitPrice, 0);
    expect(costs.sensorCost).toBeCloseTo(stationCost + 3 * internalCost, 8);
  });

  it("atualiza o AHT10 salvo para SHT30 ao abrir um orçamento antigo", () => {
    const saved = defaultComponents.map((component) => component.id === "WM03"
      ? { ...component, name: "Sensor externo de temperatura e umidade AHT10 (I²C)", unitPrice: 11.25 }
      : component);
    expect(mergeWithDefaultComponents(saved).find((component) => component.id === "WM03")).toMatchObject({
      name: "Sensor externo de temperatura e umidade SHT30 (I²C)", unitPrice: 100,
    });
  });
});
