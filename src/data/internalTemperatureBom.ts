import { WEATHER_STATION_BOM } from "./weatherStationBom";

// Um sensor interno por vão, montado em sua própria placa genérica.
// Reaproveita as demais peças da placa da estação, substituindo o SHT30 pela sonda NTC 10k.
export const INTERNAL_TEMPERATURE_BOM = WEATHER_STATION_BOM.map((part) => ({
  componentId: part.componentId.replace(/^WM/, "TI"),
  name: part.componentId === "WM03" ? "Sonda de temperatura interna NTC 10k" : part.name,
  qtyPerSpan: part.qtyPerStation,
  unitPrice: part.componentId === "WM03" ? 10 : part.unitPrice,
}));
