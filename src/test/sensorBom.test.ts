import { describe, expect, it } from "vitest";
import { SENSOR_BOM, SENSOR_BOM_UNIT_COST } from "../data/sensorBom";
import { SENSOR_PRODUCTION_ITEMS_BR } from "../data/sensorProduction";
import { defaultComponents } from "../data/components";
import { defaultCompositions, normalizeCompositions } from "../data/compositions";
import {
  calculateBridgeCosts,
  calculateBudgetSummary,
  calculateSensorMaterialUnitCost,
  calculateSensorSaleUnitPrice,
} from "../lib/budgetCalculations";
import { createDefaultBridge } from "../data/bridgeConfig";

const expectedSchematicQuantities: Record<string, number> = {
  "ESP32C3 Supermini": 1,
  "Acelerômetro ADXL345": 1,
  "Módulo SD": 1,
  "Display OLED": 1,
  "Chave liga/desliga": 1,
  "Micro switch": 2,
  "Conector P4 fêmea DC-005": 1,
  "Diodo 1N4001": 1,
  "Capacitor Eletrolítico 220uF": 1,
  "Capacitor 100nF": 2,
  "Capacitor 330nF": 1,
  LM7805: 1,
  "Capacitor 10uF": 4,
  "LM1117 3V3": 1,
  "Resistor 10k": 2,
  "Resistor 1k": 3,
  "Resistor 100R": 3,
  "LED RGB": 1,
  "Transistor BC817": 3,
};

describe("BOM do sensor acelerômetro", () => {
  it("contém todos os componentes e quantidades do esquema", () => {
    const productionItems = SENSOR_PRODUCTION_ITEMS_BR.filter(
      (item) => item.category === "Sensor Acelerômetro"
    );

    for (const [name, quantity] of Object.entries(expectedSchematicQuantities)) {
      expect(SENSOR_BOM.find((item) => item.name === name)?.qtyPerSensor).toBe(quantity);
      expect(productionItems.find((item) => item.name === name)?.qtyPerSensor).toBe(quantity);
    }
  });

  it("mantém o custo unitário calculado a partir da lista completa", () => {
    const calculated = SENSOR_BOM.reduce(
      (sum, item) => sum + item.qtyPerSensor * item.unitPrice,
      0
    );

    expect(SENSOR_BOM_UNIT_COST).toBeCloseTo(calculated, 8);
  });

  it("cadastra todos os itens como componentes editáveis da composição", () => {
    expect(defaultComponents.some((component) => component.id === "S01" || component.id === "S02")).toBe(false);
    for (const item of SENSOR_BOM) {
      expect(defaultComponents.find((component) => component.id === item.componentId)).toMatchObject({
        name: item.name,
        unitPrice: item.unitPrice,
        category: "Componentes do Sensor",
      });
      expect(defaultCompositions.sensors.find((line) => line.componentId === item.componentId)).toMatchObject({
        qty: item.qtyPerSensor,
        base: "sensor",
      });
    }
  });

  it("recalcula o custo unitário quando o preço de uma peça muda", () => {
    const changedId = "SA03";
    const changedComponents = defaultComponents.map((component) =>
      component.id === changedId ? { ...component, unitPrice: component.unitPrice + 100 } : component
    );
    const cost = (components: typeof defaultComponents) => defaultCompositions.sensors
      .filter((line) => line.base === "sensor")
      .reduce((total, line) => {
        const price = components.find((component) => component.id === line.componentId)?.unitPrice ?? 0;
        return total + line.qty * price;
      }, 0);

    expect(cost(changedComponents) - cost(defaultComponents)).toBeCloseTo(100, 8);
  });

  it("migra composições antigas sem duplicar os itens agregados", () => {
    const migrated = normalizeCompositions({
      ...defaultCompositions,
      sensors: [
        { componentId: "S01", qty: 1, base: "sensor" },
        { componentId: "S02", qty: 1, base: "sensor" },
        { componentId: "S03", qty: 1, base: "sensor" },
      ],
    });

    expect(migrated.sensors.some((line) => line.componentId === "S01" || line.componentId === "S02")).toBe(false);
    expect(migrated.sensors.filter((line) => line.componentId.startsWith("SA"))).toHaveLength(SENSOR_BOM.length);
  });

  it("inclui a composição de mão de obra ao abrir um orçamento antigo", () => {
    const { internalLabor: _removed, ...legacyCompositions } = defaultCompositions;
    const migrated = normalizeCompositions(legacyCompositions);

    expect(migrated.internalLabor.map((line) => line.componentId)).toEqual(
      expect.arrayContaining(["MOI01", "MOI02", "MOI03", "MOI04", "MOI05", "CC05", "CN02"])
    );
  });

  it("calcula o preço de venda pela margem de lucro sobre a venda", () => {
    const cost = calculateSensorMaterialUnitCost(defaultComponents, defaultCompositions);
    const salePrice = calculateSensorSaleUnitPrice(cost, {
      mode: "margin",
      marginPercent: 40,
      salePrice: 0,
    });

    expect(salePrice).toBeCloseTo(cost / 0.6, 8);
    expect((salePrice - cost) / salePrice).toBeCloseTo(0.4, 8);
  });

  it("aceita valor de venda direto e aplica o multiplicador da viga caixão", () => {
    const compositions = {
      ...structuredClone(defaultCompositions),
      sensorPricing: { mode: "salePrice" as const, marginPercent: 0, salePrice: 500 },
    };
    const standard = calculateBridgeCosts(
      { ...createDefaultBridge(), sensorCount: 2, temperatureCount: 0 },
      defaultComponents,
      compositions
    );
    const boxGirder = calculateBridgeCosts(
      { ...createDefaultBridge(), sensorCount: 2, temperatureCount: 0, sensorPriceMultiplier: 2 },
      defaultComponents,
      compositions
    );

    expect(standard.sensors).toBeCloseTo(1_000, 6);
    expect(boxGirder.sensors).toBeCloseTo(2_000, 6);
  });

  it("mantém margem zero ao migrar orçamentos sem configuração comercial", () => {
    const { sensorPricing: _pricing, ...legacy } = structuredClone(defaultCompositions);
    const normalized = normalizeCompositions(legacy);

    expect(normalized.sensorPricing).toEqual({
      mode: "margin",
      marginPercent: 0,
      salePrice: 0,
    });
  });

  it("separa custo real, gasto total e lucro estimado do orçamento", () => {
    const compositions = {
      ...structuredClone(defaultCompositions),
      sensorPricing: { mode: "margin" as const, marginPercent: 40, salePrice: 0 },
    };
    const bridge = { ...createDefaultBridge(), sensorCount: 5, temperatureCount: 1 };
    const summary = calculateBudgetSummary(
      [bridge],
      defaultComponents,
      0.3,
      0.2,
      3,
      [],
      compositions
    );

    expect(summary.bridgeCosts[0].sensorCost).toBeLessThan(summary.bridgeCosts[0].sensors);
    expect(summary.totalEstimatedCost).toBeCloseTo(summary.directCost + summary.taxValue, 8);
    expect(summary.estimatedProfit).toBeCloseTo(
      summary.proposalValue - summary.totalEstimatedCost,
      8
    );
    expect(summary.estimatedProfitMargin).toBeCloseTo(
      summary.estimatedProfit / summary.proposalValue,
      8
    );
  });
});
