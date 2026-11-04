import { SENSOR_PROD_KEY } from "@/data/sensorProduction";

/** Desativa apenas a produção herdada, preservando linhas e andamento de compra. */
export function migrateLegacyProductionRow<T extends { bridge_key: string; in_scope: boolean }>(
  row: T,
  needsMigration: boolean
): T {
  return needsMigration && row.bridge_key === SENSOR_PROD_KEY && row.in_scope
    ? { ...row, in_scope: false }
    : row;
}
