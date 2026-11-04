// Equipamentos de controle e regulação instalados em cada vão.
export interface SpanControlItem {
  componentId: string;
  name: string;
  qtyPerSpan: number;
  unitPrice: number;
  kind: "relay" | "stepdown";
}

export const SPAN_CONTROL_BOM: SpanControlItem[] = [
  { componentId: "CV01", name: "Placa genérica do módulo relé", qtyPerSpan: 1, unitPrice: 11.4, kind: "relay" },
  { componentId: "CV02", name: "Módulo relé 2 canais 3V3", qtyPerSpan: 1, unitPrice: 30, kind: "relay" },
  { componentId: "CV03", name: "Caixa PVC 154×110×70 mm do módulo relé", qtyPerSpan: 1, unitPrice: 30, kind: "relay" },
  { componentId: "CV04", name: "Regulador step-down do modem", qtyPerSpan: 1, unitPrice: 15, kind: "stepdown" },
  { componentId: "CV05", name: "Regulador step-down da linha de sensores", qtyPerSpan: 2, unitPrice: 15, kind: "stepdown" },
];
