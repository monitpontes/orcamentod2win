import { describe, expect, it } from "vitest";
import { SENSOR_PROD_KEY } from "../data/sensorProduction";
import { migrateLegacyProductionRow } from "../lib/procurementMigration";

describe("migração da lista de compras antiga", () => {
  it("retira a produção padrão da soma uma vez, preservando os dados de compra", () => {
    const legacy = { bridge_key: SENSOR_PROD_KEY, in_scope: true, qty: 400, qty_bought: 12, amount_paid: 240 };
    expect(migrateLegacyProductionRow(legacy, true)).toEqual({ ...legacy, in_scope: false });
    expect(migrateLegacyProductionRow(legacy, false)).toBe(legacy);
  });

  it("mantém os materiais do orçamento e os itens personalizados", () => {
    const budgetRow = { bridge_key: "ponte-1", in_scope: true };
    const customRow = { bridge_key: "custom", in_scope: true };
    expect(migrateLegacyProductionRow(budgetRow, true)).toBe(budgetRow);
    expect(migrateLegacyProductionRow(customRow, true)).toBe(customRow);
  });
});
