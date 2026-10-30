import { describe, expect, it } from "vitest";
import { applyBridgeTemplate, createDefaultBridge } from "../data/bridgeConfig";
import { defaultComponents } from "../data/components";
import { defaultCompositions } from "../data/compositions";
import { calculateBudgetSummary } from "../lib/budgetCalculations";
import {
  aggregateInternalLabor,
  buildProposalBridgeQuantities,
  normalizeProposalMetadata,
} from "../lib/proposalData";
import {
  buildSensorQuantitiesXml,
  buildSensorQuantityRows,
  populateTechnicalTemplateXml,
} from "../lib/generateTechnicalDocx";

describe("automação das propostas", () => {
  it("leva os quantitativos dimensionados no orçamento para as propostas", () => {
    const bridge = applyBridgeTemplate({
      ...createDefaultBridge(),
      id: "oae-1",
      name: "Ponte Teste",
      typology: "Viga I",
      spanCount: 2,
      spanLength: 40,
      beamCount: 5,
      temperatureCount: 2,
    });
    const summary = calculateBudgetSummary(
      [bridge],
      defaultComponents,
      0.3,
      0.2,
      3,
      [],
      defaultCompositions
    );

    const [quantity] = buildProposalBridgeQuantities([bridge], summary);

    expect(quantity).toMatchObject({
      name: "Ponte Teste",
      spanCount: 2,
      beamCount: 5,
      sensorCount: 20,
      temperatureCount: 4,
      totalSensorCount: 24,
      connectivityKitCount: 3,
      postCount: 2,
    });
    expect(quantity.internalLaborHours).toBeGreaterThan(0);
  });

  it("consolida a mão de obra sem alterar o valor total do orçamento", () => {
    const bridges = [
      { ...createDefaultBridge(), id: "1", name: "OAE 1", sensorCount: 5 },
      { ...createDefaultBridge(), id: "2", name: "OAE 2", sensorCount: 10 },
    ];
    const summary = calculateBudgetSummary(
      bridges,
      defaultComponents,
      0.3,
      0.2,
      3,
      [],
      defaultCompositions
    );
    const labor = aggregateInternalLabor(summary);

    expect(labor.some((line) => line.description === "Montagem e testes eletrônicos do sensor")).toBe(true);
    expect(labor.reduce((sum, line) => sum + line.cost, 0)).toBeCloseTo(summary.internalLaborTotal, 8);
  });

  it("destaca somente dados cadastrais ausentes com marcadores explícitos", () => {
    const missing = normalizeProposalMetadata();
    const complete = normalizeProposalMetadata({
      clientName: "Concessionária Exemplo",
      proposalName: "MON-001-2026",
    });

    expect(missing.clientName).toBe("[[NOME DA CONTRATANTE]]");
    expect(missing.proposalName).toBe("[[CÓDIGO / TÍTULO DA PROPOSTA]]");
    expect(complete.clientName).toBe("Concessionária Exemplo");
    expect(complete.proposalName).toBe("MON-001-2026");
  });

  it("mantém a proposta técnica focada nos sensores e sem quantitativos de mão de obra", () => {
    const bridge = {
      ...createDefaultBridge(),
      name: "Ponte Sensorizada",
      sensorCount: 10,
      temperatureCount: 2,
    };
    const [row] = buildSensorQuantityRows([bridge]);
    const xml = buildSensorQuantitiesXml([bridge]);

    expect(row.totalSensors).toBe(12);
    expect(xml).toContain("Quantitativos de sensores");
    expect(xml).toContain("sensores de temperatura");
    expect(xml.toLocaleLowerCase("pt-BR")).not.toContain("mão de obra");
  });

  it("substitui o quantitativo existente no novo modelo sem duplicar a tabela", () => {
    const bridge = {
      ...createDefaultBridge(),
      name: "Ponte Modelo",
      typology: "Caixão" as const,
      spanCount: 3,
      sensorCount: 18,
      temperatureCount: 12,
    };
    const templateXml = [
      "<w:document><w:body>",
      "<w:p><w:r><w:t>[[NOME DA CONTRATANTE]]</w:t></w:r></w:p>",
      "<w:p><w:r><w:t>[[QUANTIDADE DE OAEs]]</w:t></w:r></w:p>",
      "<w:p><w:r><w:t>Sensorização por Vão</w:t></w:r></w:p>",
      "<w:p><w:r><w:t>Quantitativos de sensores</w:t></w:r></w:p>",
      "<w:p><w:r><w:t>Resumo antigo com 3360 sensores</w:t></w:r></w:p>",
      "<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Tabela antiga</w:t></w:r></w:p></w:tc></w:tr></w:tbl>",
      "<w:p><w:r><w:t>Nas vigas I, regra antiga.</w:t></w:r></w:p>",
      "</w:body></w:document>",
    ].join("");

    const xml = populateTechnicalTemplateXml(templateXml, [bridge], {
      clientName: "Cliente Teste",
    });

    expect(xml.match(/Quantitativos de sensores/g)).toHaveLength(1);
    expect(xml.match(/<w:tbl>/g)).toHaveLength(1);
    expect(xml).not.toContain("Tabela antiga");
    expect(xml).not.toContain("3360 sensores");
    expect(xml).toContain("Cliente Teste");
    expect(xml).toContain("Ponte Modelo");
    expect(xml).toContain("30 sensores");
    expect(xml).not.toContain("Para as OAEs EPR");
    expect(xml).not.toContain("[[QUANTIDADE DE OAEs]]");
  });
});
