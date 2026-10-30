import { describe, expect, it } from "vitest";
import {
  applyEprReferenceQuantities,
  applyBridgeTemplate,
  applySupportSetRule,
  bridgeFromInventoryRow,
  bridgeNeedsReview,
  calculateAutomaticTemperatureCount,
  createDefaultBridge,
  energySetCount,
  normalizeBridge,
  supportSetCount,
} from "../data/bridgeConfig";
import {
  calculateBridgeCosts,
  calculateBudgetSummary,
  calculateMonthlyAccompanimentPerSpan,
} from "../lib/budgetCalculations";
import { defaultComponents } from "../data/components";
import { defaultCompositions } from "../data/compositions";
import { eprReferenceQuantities } from "../data/eprReferenceQuantities";
import { buildBridgeMaterials } from "../lib/materialsList";

describe("automação de orçamento por tipologia", () => {
  it("mantém íntegro o piso revisado das 130 OAEs", () => {
    const quantities = Object.values(eprReferenceQuantities);
    expect(quantities).toHaveLength(130);
    expect(quantities.reduce((sum, item) => sum + item.structural, 0)).toBe(2_444);
    expect(quantities.reduce((sum, item) => sum + item.temperature, 0)).toBe(916);
  });

  it("dimensiona automaticamente os sensores de temperatura", () => {
    expect(calculateAutomaticTemperatureCount("Caixão", 8)).toBe(32);
    expect(calculateAutomaticTemperatureCount("Viga I + Caixão", 8)).toBeNull();
    expect(calculateAutomaticTemperatureCount("Passarela", 8)).toBe(16);
    expect(calculateAutomaticTemperatureCount("Viga I", 1)).toBe(2);
    expect(calculateAutomaticTemperatureCount("Viga I", 5)).toBe(10);
    expect(calculateAutomaticTemperatureCount("Viga retangular", 3)).toBe(6);
    expect(calculateAutomaticTemperatureCount("Viga T", 3)).toBe(6);
    expect(calculateAutomaticTemperatureCount("Laje - seção única", 3)).toBe(6);
    expect(calculateAutomaticTemperatureCount("Laje - duas vias", 3)).toBe(6);
    expect(calculateAutomaticTemperatureCount("Outra", 3)).toBeNull();
    expect(calculateAutomaticTemperatureCount("Manual", 10)).toBeNull();
  });

  it("calcula 2 sensores por viga em cada vão de Viga I", () => {
    const bridge = applyBridgeTemplate({
      ...createDefaultBridge(),
      typology: "Viga I",
      spanCount: 3,
      beamCount: 4,
    });

    expect(bridge.sensorCount).toBe(24);
    expect(bridge.temperatureCount).toBe(6);
    expect(bridge.sensorPriceMultiplier).toBe(1);
    expect(bridge.connectivityKitCount).toBe(3);
    expect(bridge.solarKitCount).toBe(2);
    expect(bridge.commandBoxCount).toBe(2);
    expect(bridge.postCount).toBe(2);
    expect(bridgeNeedsReview(bridge)).toBe(false);
  });

  it("calcula 6 sensores por vão de Caixão com preço dobrado", () => {
    const bridge = applyBridgeTemplate({
      ...createDefaultBridge(),
      typology: "Caixão",
      spanCount: 5,
    });
    expect(bridge.sensorCount).toBe(30);
    expect(bridge.temperatureCount).toBe(20);
    expect(bridge.sensorPriceMultiplier).toBe(2);
    expect(bridge.connectivityKitCount).toBe(5);
    expect(bridge.solarKitCount).toBe(3);
    expect(bridge.commandBoxCount).toBe(3);
    expect(bridge.postCount).toBe(3);
  });

  it("importa as colunas do inventário e deixa Viga I pendente pelo desenho", () => {
    const row = Array.from({ length: 20 }, () => "") as unknown[];
    row[1] = "OAE-001";
    row[2] = "001";
    row[8] = "Ponte";
    row[11] = "Viga I";
    row[12] = 90;
    row[19] = 3;

    const bridge = bridgeFromInventoryRow(row);

    expect(bridge).not.toBeNull();
    expect(bridge?.spanLength).toBe(30);
    expect(bridge?.spanCount).toBe(3);
    expect(bridge?.sensorCount).toBe(0);
    expect(bridge?.temperatureCount).toBe(6);
    expect(bridge && bridgeNeedsReview(bridge)).toBe(true);
  });

  it("reconhece passarela no inventário e calcula sensores por vão", () => {
    const row = Array.from({ length: 20 }, () => "") as unknown[];
    row[1] = "PAS-001";
    row[8] = "Passarela de pedestres";
    row[11] = "Estrutura metálica";
    row[12] = 30;
    row[19] = 2;

    const bridge = bridgeFromInventoryRow(row);

    expect(bridge?.typology).toBe("Passarela");
    expect(bridge?.sensorCount).toBe(8);
    expect(bridge?.temperatureCount).toBe(4);
  });

  it("recalcula sensores de temperatura em orçamentos já salvos", () => {
    expect(normalizeBridge({ typology: "Caixão", spanCount: 3, temperatureCount: 1 }).temperatureCount).toBe(12);
    expect(normalizeBridge({ typology: "Viga I", spanCount: 4, temperatureCount: 1 }).temperatureCount).toBe(8);
    expect(normalizeBridge({ name: "Passarela Central", typology: "Outra", temperatureCount: 1 }).typology).toBe("Passarela");
  });

  it("dimensiona lajes e passarelas conforme o relatório", () => {
    expect(applyBridgeTemplate({ ...createDefaultBridge(), typology: "Laje - seção única", spanCount: 3 }).sensorCount).toBe(18);
    expect(applyBridgeTemplate({ ...createDefaultBridge(), typology: "Laje - duas vias", spanCount: 3 }).sensorCount).toBe(36);
    expect(applyBridgeTemplate({ ...createDefaultBridge(), typology: "Passarela", spanCount: 3 }).sensorCount).toBe(12);
  });

  it("aplica somente as decisões individuais confirmadas da EPR", () => {
    const withReference = (bridge: ReturnType<typeof createDefaultBridge>) =>
      applyBridgeTemplate(applyEprReferenceQuantities(bridge));
    const oae105 = withReference({ ...createDefaultBridge(), inventoryCode: "105", spanCount: 3, typology: "Viga I" });
    const oae116 = withReference({ ...createDefaultBridge(), inventoryCode: "OAE116", spanCount: 2, typology: "Laje - duas vias" });
    const oae019 = withReference({ ...createDefaultBridge(), inventoryCode: "019", spanCount: 14, typology: "Passarela" });

    expect(oae105).toMatchObject({ spanCount: 4, beamCount: 2, sensorCount: 16, temperatureCount: 8 });
    expect(oae116).toMatchObject({ spanCount: 3, typology: "Caixão", sensorCount: 18, temperatureCount: 12 });
    expect(oae019.sensorCount).toBe(28);
    expect(oae019.temperatureCount).toBe(28);
  });

  it("corrige quantitativos antigos da OAE 116 ao reabrir o orçamento", () => {
    const oae116 = normalizeBridge({
      ...createDefaultBridge(),
      inventoryCode: "OAE116",
      typology: "Laje - duas vias",
      spanCount: 2,
      sensorCount: 36,
      temperatureCount: 4,
      quantityReference: "Proposta EPR 15/09/2026",
    });

    expect(oae116).toMatchObject({
      typology: "Caixão",
      spanCount: 3,
      sensorCount: 18,
      temperatureCount: 12,
    });
  });

  it("mantém o maior quantitativo entre a proposta EPR e a regra recalculada", () => {
    const withReference = (bridge: ReturnType<typeof createDefaultBridge>) =>
      applyBridgeTemplate(applyEprReferenceQuantities(bridge));
    const oae117 = withReference({ ...createDefaultBridge(), inventoryCode: "117", spanCount: 1, typology: "Passarela" });
    const oae123 = withReference({ ...createDefaultBridge(), inventoryCode: "123", spanCount: 1, typology: "Caixão" });
    const oae130 = withReference({ ...createDefaultBridge(), inventoryCode: "130", spanCount: 9, beamCount: 2, typology: "Viga I" });

    expect(oae117).toMatchObject({ sensorCount: 6, temperatureCount: 4 });
    expect(oae123).toMatchObject({ sensorCount: 12, temperatureCount: 4 });
    expect(oae130).toMatchObject({ sensorCount: 72, temperatureCount: 18 });
  });

  it("orça conservadoramente os aumentos recomendados para as OAEs 122 e 127", () => {
    const withReference = (bridge: ReturnType<typeof createDefaultBridge>) =>
      applyBridgeTemplate(applyEprReferenceQuantities(bridge));
    const oae122 = withReference({ ...createDefaultBridge(), inventoryCode: "122", typology: "Outra" });
    const oae127 = withReference({ ...createDefaultBridge(), inventoryCode: "127", typology: "Caixão" });

    expect(oae122).toMatchObject({ typology: "Laje - duas vias", spanCount: 1, sensorCount: 12, temperatureCount: 2 });
    expect(oae127).toMatchObject({ typology: "Caixão", spanCount: 3, sensorCount: 18, temperatureCount: 12 });
    expect(bridgeNeedsReview(oae122)).toBe(true);
    expect(bridgeNeedsReview(oae127)).toBe(true);
  });

  it("separa conectividade por 10 sensores e energia por 20 sensores", () => {
    expect(supportSetCount(0)).toBe(0);
    expect(supportSetCount(10)).toBe(1);
    expect(supportSetCount(11)).toBe(2);
    expect(energySetCount(0)).toBe(0);
    expect(energySetCount(20, 2)).toBe(1);
    expect(energySetCount(21, 2)).toBe(2);

    const bridge25Spans = applySupportSetRule({
      ...createDefaultBridge(),
      spanCount: 25,
      sensorCount: 250,
      temperatureCount: 0,
    });
    expect(bridge25Spans.connectivityKitCount).toBe(25);
    expect(bridge25Spans.solarKitCount).toBe(13);
    expect(bridge25Spans.commandBoxCount).toBe(13);
    expect(bridge25Spans.postCount).toBe(13);
  });

  it("libera outras tipologias depois do preenchimento manual", () => {
    const bridge = { ...createDefaultBridge(), typology: "Outra" as const, sensorCount: 0 };
    expect(bridgeNeedsReview(bridge)).toBe(true);
    expect(bridgeNeedsReview({ ...bridge, sensorCount: 8 })).toBe(false);
  });

  it("exclui infraestrutura do preço por ser responsabilidade do cliente", () => {
    const bridge = { ...createDefaultBridge(), hasInfrastructure: true };
    const costs = calculateBridgeCosts(bridge, defaultComponents, defaultCompositions);

    expect(createDefaultBridge().hasInfrastructure).toBe(false);
    expect(costs.infrastructure).toBe(0);
    expect(costs.details.infrastructure).toHaveLength(0);
  });

  it("calcula mão de obra interna por OAE, vão, sensor e horas informadas", () => {
    const bridge = {
      ...createDefaultBridge(),
      spanCount: 2,
      sensorCount: 10,
      hoursAssembly: 10,
      hoursAdequation: 30,
    };
    const costs = calculateBridgeCosts(bridge, defaultComponents, defaultCompositions);
    const totalHours = costs.details.internalLabor.reduce((sum, line) => sum + line.qty, 0);

    expect(totalHours).toBe(65);
    expect(costs.internalLabor).toBe(13_000);
    expect(costs.total).toBeGreaterThan(costs.equipmentTotal);
  });

  it("calcula acompanhamento mensal pela extensão de cada vão", () => {
    expect(calculateMonthlyAccompanimentPerSpan(40)).toBe(1_200);
    expect(calculateMonthlyAccompanimentPerSpan(50)).toBe(1_450);
    expect(calculateMonthlyAccompanimentPerSpan(40.5)).toBe(1_212.5);

    const summary = calculateBudgetSummary(
      [
        { ...createDefaultBridge(), id: "curta", spanLength: 30, spanCount: 2 },
        { ...createDefaultBridge(), id: "longa", spanLength: 50, spanCount: 1 },
      ],
      defaultComponents,
      0.3,
      0.2,
      3,
      [],
      defaultCompositions
    );

    expect(summary.monthlyAccompaniment).toBe(3_850);
  });

  it("inclui a caixa de comando no conjunto de energia", () => {
    const bridge = {
      ...createDefaultBridge(),
      energySource: "Solar" as const,
      solarKitCount: 2,
      commandBoxCount: 99,
    };
    const costs = calculateBridgeCosts(bridge, defaultComponents, defaultCompositions);
    const commandEnclosure = costs.details.energy.find((line) => line.componentId === "CC01");

    expect(commandEnclosure?.qty).toBe(2);
    expect(costs.commandBox).toBe(0);
    expect(costs.details.commandBox).toHaveLength(0);
  });

  it("permite excluir a mão de obra interna sem apagar a composição", () => {
    const bridge = createDefaultBridge();
    const enabled = calculateBridgeCosts(bridge, defaultComponents, defaultCompositions);
    const disabledCompositions = {
      ...structuredClone(defaultCompositions),
      includeInternalLabor: false,
    };
    const disabled = calculateBridgeCosts(bridge, defaultComponents, disabledCompositions);

    expect(enabled.internalLabor).toBeGreaterThan(0);
    expect(disabled.internalLabor).toBe(0);
    expect(disabled.details.internalLabor).toHaveLength(0);
    expect(disabled.total).toBeCloseTo(enabled.total - enabled.internalLabor, 8);
    expect(disabledCompositions.internalLabor).toHaveLength(defaultCompositions.internalLabor.length);
  });

  it("converte o valor final conjunto em valor-base sem multiplicar por vão", () => {
    const bridge = {
      ...createDefaultBridge(),
      spanCount: 5,
      modelingPricingMode: "manual" as const,
      manualModelingSimulationFinalValue: 3_375,
    };
    const costs = calculateBridgeCosts(bridge, defaultComponents, defaultCompositions);
    expect(costs.modeling).toBe(2_250);
    expect(costs.details.modeling.map((line) => line.qty)).toEqual([1]);
    expect(calculateBridgeCosts({ ...bridge, spanCount: 10 }, defaultComponents).modeling).toBe(2_250);
    expect(calculateBridgeCosts({ ...bridge, manualModelingSimulationFinalValue: 0 }, defaultComponents).modeling).toBe(0);
    expect(calculateBridgeCosts({ ...bridge, modelingPricingMode: "automatic" }, defaultComponents).modeling)
      .toBe(5 * (4_900 + 2_950));
    expect(applyBridgeTemplate(bridge).manualModelingSimulationFinalValue).toBe(3_375);
    for (const [bdi, tax] of [[0.3, 0.2], [0.1, 0.15], [0, 0]]) {
      const summary = calculateBudgetSummary([bridge], defaultComponents, bdi, tax);
      const withoutModeling = calculateBudgetSummary(
        [{ ...bridge, manualModelingSimulationFinalValue: 0 }], defaultComponents, bdi, tax
      );
      expect(summary.modelingTotal).toBeCloseTo(3_375 / (1 + bdi + tax), 8);
      expect(summary.proposalValue - withoutModeling.proposalValue).toBeCloseTo(3_375, 8);
      const modelingRows = buildBridgeMaterials(bridge, defaultComponents, defaultCompositions, 1 + bdi + tax)
        .filter((line) => line.category === "Modelagem e Engenharia");
      expect(modelingRows).toHaveLength(1);
      expect(modelingRows[0].total).toBeCloseTo(summary.modelingTotal, 8);
    }
  });

  it("mantém valores manuais ao carregar e usa automático em orçamentos antigos", () => {
    const saved = normalizeBridge({
      modelingPricingMode: "manual", manualModelingSimulationFinalValue: 3_375,
    });
    expect(saved.modelingPricingMode).toBe("manual");
    expect(saved.manualModelingSimulationFinalValue).toBe(3_375);
    expect(normalizeBridge({}).modelingPricingMode).toBe("automatic");
    expect(normalizeBridge({ manualModelingSimulationFinalValue: -100 }).manualModelingSimulationFinalValue).toBe(0);
  });

  it("migra os antigos valores-base separados sem alterar o preço final", () => {
    const legacy = {
      modelingPricingMode: "manual" as const, manualModelingValue: 1_500, manualSimulationValue: 750,
    };
    const migrated = normalizeBridge(legacy, 1.25);
    expect(migrated.manualModelingSimulationFinalValue).toBe(2_812.5);
    expect(calculateBridgeCosts(migrated, defaultComponents, defaultCompositions, 1.25).modeling).toBe(2_250);
    expect(migrated).not.toHaveProperty("manualModelingValue");
    expect(migrated).not.toHaveProperty("manualSimulationValue");
  });
});
