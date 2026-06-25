// Lista de componentes de produção dos sensores (Versão 1 — LCSC/Alibaba).
// Quantidades expressas por sensor. Total final = qty_per_sensor × nº de sensores.
// original_unit_price está na moeda de origem; itens em USD são convertidos via taxa USD→BRL.

export const SENSOR_PROD_KEY = "__sensor_production__";
export const SENSOR_PROD_LABEL = "Produção de Sensores";

export type Currency = "BRL" | "USD";

export interface SensorProductionItem {
  id: string; // estável, vira component_id = `PROD-${id}`
  name: string;
  supplier: string;
  category: string;
  unit: string;
  qtyPerSensor: number;
  currency: Currency;
  unitPrice: number; // na moeda de origem
}

export const SENSOR_PRODUCTION_ITEMS: SensorProductionItem[] = [
  // Placa
  { id: "placa", name: "Placa do sensor (PCB)", supplier: "JLCPCB", category: "Placa", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 4.54 },

  // Componentes eletrônicos LCSC (USD)
  { id: "botao-onoff", name: "Botão ON/OFF", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "USD", unitPrice: 0.1527 },
  { id: "switch", name: "Switch", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 2, currency: "USD", unitPrice: 0.0524 },
  { id: "transistor-bc817", name: "Transistor BC817", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 3, currency: "USD", unitPrice: 0.0122 },
  { id: "res-100", name: "Resistor 100Ω 0805", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 3, currency: "USD", unitPrice: 0.0012 },
  { id: "conector-p4", name: "Conector P4", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "USD", unitPrice: 0.1246 },
  { id: "display-oled", name: "Display OLED", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "USD", unitPrice: 1.5502 },
  { id: "diodo-1n4001", name: "Diodo 1N4001", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "USD", unitPrice: 0.0083 },
  { id: "led-rgb", name: "LED RGB", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "USD", unitPrice: 0.0163 },
  { id: "cap-220uf", name: "Capacitor 220uF", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 2, currency: "USD", unitPrice: 0.1122 },
  { id: "cap-100nf", name: "Capacitor 100nF 0805", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 3, currency: "USD", unitPrice: 0.0041 },
  { id: "cap-330nf", name: "Capacitor 330nF 0805", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "USD", unitPrice: 0.0162 },
  { id: "cap-10uf", name: "Capacitor 10uF 0805", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 2, currency: "USD", unitPrice: 0.0376 },
  { id: "lm7805", name: "Regulador LM7805 TO-263", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "USD", unitPrice: 0.1602 },
  { id: "lm1117", name: "Regulador LM1117 TO-252-3", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "USD", unitPrice: 0.3973 },
  { id: "res-1k", name: "Resistor 1kΩ 0805", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 3, currency: "USD", unitPrice: 0.0013 },
  { id: "res-10k", name: "Resistor 10kΩ 0805", supplier: "LCSC", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 2, currency: "USD", unitPrice: 0.0017 },

  // Alibaba (BRL conforme planilha)
  { id: "esp32c3", name: "ESP32-C3", supplier: "Alibaba", category: "Módulos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 20.63 },
  { id: "modulo-sd", name: "Módulo SD", supplier: "Alibaba", category: "Módulos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 2.49 },

  // Outros (BRL)
  { id: "adxl345", name: "Acelerômetro ADXL345", supplier: "Casa da Robótica / ML", category: "Módulos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 13.00 },
  { id: "microsd", name: "Cartão MicroSD", supplier: "—", category: "Módulos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 30.00 },
  { id: "caixa", name: "Caixa", supplier: "Mercado Livre", category: "Mecânica", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 5.65 },
  { id: "montagem", name: "Montagem (mão de obra)", supplier: "—", category: "Mão de Obra", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 15.00 },
];

// Versão 2 — Fornecedores brasileiros (tudo em BRL). Importável separadamente
// para permitir comparação lado a lado por componente.
export const SENSOR_PRODUCTION_ITEMS_BR: SensorProductionItem[] = [
  { id: "placa-br", name: "Placa do sensor (PCB)", supplier: "TecCI", category: "Placa", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 4.7617 },
  { id: "esp32c3-br", name: "ESP32-C3", supplier: "Pisca Led", category: "Módulos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 27.4511 },
  { id: "adxl345-br", name: "Acelerômetro ADXL345", supplier: "Casa da Robótica", category: "Módulos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 7.4223 },
  { id: "microsd-br", name: "Cartão MicroSD", supplier: "MasterDrive", category: "Módulos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 29.80 },
  { id: "modulo-sd-br", name: "Módulo SD", supplier: "Mercado Livre", category: "Módulos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 3.1944 },
  { id: "caixa-br", name: "Caixa", supplier: "Mercado Livre", category: "Mecânica", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 5.65 },
  { id: "botao-onoff-br", name: "Botão ON/OFF", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 1.90 },
  { id: "switch-br", name: "Switch", supplier: "Eletrogate", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 2, currency: "BRL", unitPrice: 0.40 },
  { id: "conector-p4-br", name: "Conector P4", supplier: "Eletrogate", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 0.3125 },
  { id: "res-100-br", name: "Resistor 100Ω 0805", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 3, currency: "BRL", unitPrice: 0.1216 },
  { id: "transistor-bc817-br", name: "Transistor BC817", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 3, currency: "BRL", unitPrice: 0.3072 },
  { id: "display-oled-br", name: "Display OLED", supplier: "Saravati", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 15.0023 },
  { id: "diodo-1n4001-br", name: "Diodo 1N4001", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 0.1472 },
  { id: "led-rgb-br", name: "LED RGB", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 0.75 },
  { id: "cap-220uf-br", name: "Capacitor 220uF", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 2, currency: "BRL", unitPrice: 1.1981 },
  { id: "cap-100nf-br", name: "Capacitor 100nF 0805", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 3, currency: "BRL", unitPrice: 0.1248 },
  { id: "cap-330nf-br", name: "Capacitor 330nF 0805", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 0.4828 },
  { id: "cap-10uf-br", name: "Capacitor 10uF 0805", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 2, currency: "BRL", unitPrice: 0.5454 },
  { id: "lm7805-br", name: "Regulador LM7805 TO-263", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 4.58 },
  { id: "lm1117-br", name: "Regulador LM1117 TO-252-3", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 1, currency: "BRL", unitPrice: 2.4192 },
  { id: "res-1k-br", name: "Resistor 1kΩ 0805", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 3, currency: "BRL", unitPrice: 0.0628 },
  { id: "res-10k-br", name: "Resistor 10kΩ 0805", supplier: "Mercado Livre", category: "Componentes Eletrônicos", unit: "Unid.", qtyPerSensor: 2, currency: "BRL", unitPrice: 0.0819 },
];
