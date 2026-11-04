// Peças de uma estação meteorológica montada na placa genérica do esquema.
// O sensor externo SHT30 usa o barramento I²C; os resistores da placa não são montados.
export interface WeatherStationBomItem {
  componentId: string;
  name: string;
  qtyPerStation: number;
  unitPrice: number;
}

export const WEATHER_STATION_BOM: WeatherStationBomItem[] = [
  { componentId: "WM01", name: "Placa Genérica PCB", qtyPerStation: 1, unitPrice: 11.4 },
  { componentId: "WM02", name: "ESP32C3 Supermini", qtyPerStation: 1, unitPrice: 29.41 },
  { componentId: "WM03", name: "Sensor externo de temperatura e umidade SHT30 (I²C)", qtyPerStation: 1, unitPrice: 100 },
  { componentId: "WM04", name: "Módulo microSD", qtyPerStation: 1, unitPrice: 6.89 },
  { componentId: "WM05", name: "Cartão microSD", qtyPerStation: 1, unitPrice: 31.8 },
  { componentId: "WM06", name: "Conector P4 fêmea DC-005", qtyPerStation: 1, unitPrice: 0.57 },
  { componentId: "WM07", name: "Chave liga/desliga", qtyPerStation: 1, unitPrice: 0.8 },
  { componentId: "WM08", name: "Diodo 1N4001", qtyPerStation: 1, unitPrice: 0.09 },
  { componentId: "WM09", name: "LM7812", qtyPerStation: 1, unitPrice: 3.51 },
  { componentId: "WM10", name: "LM7805", qtyPerStation: 1, unitPrice: 3.51 },
  { componentId: "WM11", name: "LM1117 3V3", qtyPerStation: 1, unitPrice: 1.89 },
  { componentId: "WM12", name: "Capacitor eletrolítico 220uF", qtyPerStation: 4, unitPrice: 1.94 },
  { componentId: "WM13", name: "Capacitor 100nF", qtyPerStation: 6, unitPrice: 0.1 },
  { componentId: "WM14", name: "Capacitor 330nF", qtyPerStation: 2, unitPrice: 0.2 },
  { componentId: "WM15", name: "Capacitor 10uF", qtyPerStation: 2, unitPrice: 0.72 },
];
