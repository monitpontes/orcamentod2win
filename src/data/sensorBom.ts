// BOM (Bill of Materials) unitário do sensor — o que precisa ser comprado
// por cada sensor instalado. Preços de referência em BRL, alinhados ao
// catálogo de produção (src/data/sensorProduction.ts).

export interface SensorBomItem {
  componentId: string;
  name: string;
  unit: string;
  qtyPerSensor: number;
  unitPrice: number;
}

export const SENSOR_BOM: SensorBomItem[] = [
  { componentId: "SA01", name: "Placa PCB do sensor", unit: "Unid.", qtyPerSensor: 1, unitPrice: 11.7 },
  { componentId: "SA02", name: "ESP32C3 Supermini", unit: "Unid.", qtyPerSensor: 1, unitPrice: 29.41 },
  { componentId: "SA03", name: "Acelerômetro ADXL345", unit: "Unid.", qtyPerSensor: 1, unitPrice: 20.61 },
  { componentId: "SA04", name: "Módulo SD", unit: "Unid.", qtyPerSensor: 1, unitPrice: 6.89 },
  { componentId: "SA05", name: "Cartão microSD", unit: "Unid.", qtyPerSensor: 1, unitPrice: 31.8 },
  { componentId: "SA06", name: "Display OLED", unit: "Unid.", qtyPerSensor: 1, unitPrice: 21.76 },
  { componentId: "SA07", name: "Chave liga/desliga", unit: "Unid.", qtyPerSensor: 1, unitPrice: 0.8 },
  { componentId: "SA08", name: "Micro switch", unit: "Unid.", qtyPerSensor: 2, unitPrice: 0.33 },
  { componentId: "SA09", name: "Conector P4 fêmea DC-005", unit: "Unid.", qtyPerSensor: 1, unitPrice: 0.57 },
  { componentId: "SA10", name: "Diodo 1N4001", unit: "Unid.", qtyPerSensor: 1, unitPrice: 0.09 },
  { componentId: "SA11", name: "Capacitor Eletrolítico 220uF", unit: "Unid.", qtyPerSensor: 1, unitPrice: 1.94 },
  { componentId: "SA12", name: "Capacitor 100nF", unit: "Unid.", qtyPerSensor: 2, unitPrice: 0.1 },
  { componentId: "SA13", name: "Capacitor 330nF", unit: "Unid.", qtyPerSensor: 1, unitPrice: 0.2 },
  { componentId: "SA14", name: "LM7805", unit: "Unid.", qtyPerSensor: 1, unitPrice: 3.51 },
  { componentId: "SA15", name: "Capacitor 10uF", unit: "Unid.", qtyPerSensor: 4, unitPrice: 0.72 },
  { componentId: "SA16", name: "LM1117 3V3", unit: "Unid.", qtyPerSensor: 1, unitPrice: 1.89 },
  { componentId: "SA17", name: "Resistor 10k", unit: "Unid.", qtyPerSensor: 2, unitPrice: 0.08 },
  { componentId: "SA18", name: "Resistor 1k", unit: "Unid.", qtyPerSensor: 3, unitPrice: 0.07 },
  { componentId: "SA19", name: "Resistor 100R", unit: "Unid.", qtyPerSensor: 3, unitPrice: 0.08 },
  { componentId: "SA20", name: "LED RGB", unit: "Unid.", qtyPerSensor: 1, unitPrice: 0.11 },
  { componentId: "SA21", name: "Transistor BC817", unit: "Unid.", qtyPerSensor: 3, unitPrice: 0.26 },
];

export const SENSOR_BOM_UNIT_COST = SENSOR_BOM.reduce(
  (sum, i) => sum + i.qtyPerSensor * i.unitPrice,
  0
);
