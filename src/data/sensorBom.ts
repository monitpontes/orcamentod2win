// BOM (Bill of Materials) unitário do sensor — o que precisa ser comprado
// por cada sensor instalado. Preços de referência em BRL, alinhados ao
// catálogo de produção (src/data/sensorProduction.ts).

export interface SensorBomItem {
  name: string;
  unit: string;
  qtyPerSensor: number;
  unitPrice: number;
}

export const SENSOR_BOM: SensorBomItem[] = [
  { name: "ESP32C3 Supermini", unit: "Unid.", qtyPerSensor: 1, unitPrice: 29.41 },
  { name: "Acelerômetro ADXL345", unit: "Unid.", qtyPerSensor: 1, unitPrice: 20.61 },
  { name: "Módulo SD", unit: "Unid.", qtyPerSensor: 1, unitPrice: 6.89 },
  { name: "Display OLED", unit: "Unid.", qtyPerSensor: 1, unitPrice: 21.76 },
  { name: "Botão ON/OFF", unit: "Unid.", qtyPerSensor: 1, unitPrice: 0.8 },
  { name: "Switch", unit: "Unid.", qtyPerSensor: 2, unitPrice: 0.33 },
  { name: "Conector P4 Fêmea", unit: "Unid.", qtyPerSensor: 1, unitPrice: 0.57 },
  { name: "Diodo 1N4001", unit: "Unid.", qtyPerSensor: 1, unitPrice: 0.09 },
  { name: "Capacitor Eletrolítico 220uF", unit: "Unid.", qtyPerSensor: 2, unitPrice: 1.94 },
  { name: "Capacitor 100nF", unit: "Unid.", qtyPerSensor: 2, unitPrice: 0.1 },
  { name: "Capacitor 330nF", unit: "Unid.", qtyPerSensor: 1, unitPrice: 0.2 },
  { name: "LM7805", unit: "Unid.", qtyPerSensor: 1, unitPrice: 3.51 },
  { name: "Capacitor 10uF", unit: "Unid.", qtyPerSensor: 2, unitPrice: 0.72 },
  { name: "LM1117 3V3", unit: "Unid.", qtyPerSensor: 1, unitPrice: 1.89 },
  { name: "Resistor 10k", unit: "Unid.", qtyPerSensor: 4, unitPrice: 0.08 },
  { name: "Resistor 1k", unit: "Unid.", qtyPerSensor: 3, unitPrice: 0.07 },
  { name: "Resistor 100R", unit: "Unid.", qtyPerSensor: 3, unitPrice: 0.08 },
  { name: "Led RGB", unit: "Unid.", qtyPerSensor: 1, unitPrice: 0.11 },
];

export const SENSOR_BOM_UNIT_COST = SENSOR_BOM.reduce(
  (sum, i) => sum + i.qtyPerSensor * i.unitPrice,
  0
);
