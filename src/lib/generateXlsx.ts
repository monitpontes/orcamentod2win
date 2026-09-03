import { defaultCompositions, baseMultiplier, conditionApplies } from "@/data/compositions";
import ExcelJS from "exceljs";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";

// Paleta VibMonitor
const NAVY = "FF1E3A5F";       // primary
const NAVY_DARK = "FF132840";
const ORANGE = "FFF97316";     // accent
const ORANGE_SOFT = "FFFFE8D6";
const GRAY_ROW = "FFF6F7F9";
const GRAY_BORDER = "FFD8DEE6";
const TEXT_DARK = "FF1F2937";
const MUTED = "FF6B7280";

interface Row {
  ponte: string;
  categoria: string;
  id: string;
  item: string;
  unidade: string;
  qty: number;
  unit: number;
  total: number;
}

const STATUS_OPTIONS = ["Pendente", "Cotado", "Comprado", "Em estoque", "Entregue", "N/A"];

const get = (components: ComponentItem[], id: string) =>
  components.find((c) => c.id === id);

function bridgeRows(bridge: BridgeSpan, components: ComponentItem[]): Row[] {
  const totalLength = bridge.spanLength * bridge.spanCount;
  const rows: Row[] = [];
  const pname = bridge.name || "OAE sem nome";

  const push = (categoria: string, id: string, qty: number) => {
    const c = get(components, id);
    if (!c || qty === 0) return;
    rows.push({
      ponte: pname,
      categoria,
      id,
      item: c.name,
      unidade: c.unit,
      qty: Math.round(qty * 1000) / 1000,
      unit: c.unitPrice,
      total: Math.round(c.unitPrice * qty * 100) / 100,
    });
  };

  push("Sensores", "S01", bridge.sensorCount);
  push("Sensores", "S02", bridge.sensorCount);
  push("Sensores", "S03", bridge.sensorCount);
  if (bridge.temperatureCount > 0) push("Sensores", "S04", bridge.temperatureCount);

  if (bridge.hasInfrastructure) {
    push("Infraestrutura", "INF01", totalLength / 3);
    push("Infraestrutura", "INF02", (totalLength + bridge.extraCableDistance) / 100);
    push("Infraestrutura", "INF03", bridge.spanCount);
    push("Infraestrutura", "INF04", bridge.sensorCount);
    push("Infraestrutura", "INF05", bridge.spanCount);
    push("Infraestrutura", "INF06", bridge.sensorCount);
  }

  defaultCompositions.energy
    .filter((line) => conditionApplies(line.condition, bridge))
    .forEach((line) => {
      const qty = (line.qty || 0) * baseMultiplier(line.base, bridge);
      if (qty > 0) push("Energia", line.componentId, qty);
    });

  const conId = bridge.connectivity === "Completa" ? "CON1" : "CON2";
  push("Conectividade", conId, bridge.connectivityKitCount || 1);

  const ccCount = bridge.solarKitCount || 1;
  push("Caixa de Comando", "CC01", ccCount);
  push("Caixa de Comando", "CC02", ccCount);
  push("Caixa de Comando", "CC03", ccCount);
  push("Caixa de Comando", "CC04", ccCount);
  push("Caixa de Comando", "CC05", bridge.hoursAssembly);
  if (bridge.energySource === "Rede") push("Caixa de Comando", "CC06", ccCount);

  push("Modelagem e Engenharia", "P01", bridge.spanCount);
  push("Modelagem e Engenharia", "P02", bridge.spanCount);
  push("Modelagem e Engenharia", "CN02", bridge.hoursAdequation);

  (bridge.extraItems || []).forEach((e) => {
    const c = get(components, e.componentId);
    push(c?.category || "Itens Adicionais", e.componentId, e.qty);
  });

  return rows;
}

function extrasRows(extras: ExtraItem[], components: ComponentItem[]): Row[] {
  return extras
    .map((e) => {
      const c = get(components, e.componentId);
      if (!c) return null;
      return {
        ponte: "— Extras Globais —",
        categoria: c.category,
        id: e.componentId,
        item: c.name,
        unidade: c.unit,
        qty: e.qty,
        unit: c.unitPrice,
        total: Math.round(c.unitPrice * e.qty * 100) / 100,
      } as Row;
    })
    .filter((r): r is Row => r !== null);
}

// ---------- Estilos ----------
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: GRAY_BORDER } },
  left: { style: "thin", color: { argb: GRAY_BORDER } },
  bottom: { style: "thin", color: { argb: GRAY_BORDER } },
  right: { style: "thin", color: { argb: GRAY_BORDER } },
};

function styleTitleBlock(ws: ExcelJS.Worksheet, title: string, subtitle: string, colCount: number) {
  ws.mergeCells(1, 1, 1, colCount);
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font = { name: "Calibri", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  t.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, colCount);
  const s = ws.getCell(2, 1);
  s.value = subtitle;
  s.font = { name: "Calibri", size: 10, color: { argb: "FFFFFFFF" }, italic: true };
  s.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  s.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_DARK } };
  ws.getRow(2).height = 20;
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 26;
  row.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = thinBorder;
  });
}

function applyZebraAndBorders(
  ws: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  colCount: number
) {
  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    row.height = 18;
    const isAlt = (r - startRow) % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber > colCount) return;
      cell.border = thinBorder;
      cell.font = { name: "Calibri", size: 10, color: { argb: TEXT_DARK } };
      if (isAlt) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY_ROW } };
      }
    });
  }
}

function addStatusValidation(
  ws: ExcelJS.Worksheet,
  col: string,
  startRow: number,
  endRow: number
) {
  for (let r = startRow; r <= endRow; r++) {
    const cell = ws.getCell(`${col}${r}`);
    cell.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${STATUS_OPTIONS.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Status inválido",
      error: "Selecione um valor da lista.",
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    // conditional-ish coloring via per-cell formula not supported simply; use addConditionalFormatting below
  }
  ws.addConditionalFormatting({
    ref: `${col}${startRow}:${col}${endRow}`,
    rules: [
      { type: "containsText", operator: "containsText", text: "Pendente", priority: 1, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFE4B5" } }, font: { color: { argb: "FF8A5A00" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "Cotado", priority: 2, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFDDEBFF" } }, font: { color: { argb: "FF1E3A5F" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "Comprado", priority: 3, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: ORANGE_SOFT } }, font: { color: { argb: "FF9A3412" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "Em estoque", priority: 4, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFE6E0F8" } }, font: { color: { argb: "FF4C1D95" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "Entregue", priority: 5, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFD1FAE5" } }, font: { color: { argb: "FF065F46" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "N/A", priority: 6, style: { font: { color: { argb: MUTED }, italic: true } } },
    ],
  });
}

// ---------- Geração ----------
export async function generateMaterialsXlsx(
  bridges: BridgeSpan[],
  components: ComponentItem[],
  globalExtras: ExtraItem[],
  clientName?: string
) {
  const allRows: Row[] = [];
  bridges.forEach((b) => allRows.push(...bridgeRows(b, components)));
  allRows.push(...extrasRows(globalExtras, components));

  const wb = new ExcelJS.Workbook();
  wb.creator = "VibMonitor";
  wb.created = new Date();

  const dateStr = new Date().toLocaleDateString("pt-BR");
  const subtitle = `Cliente: ${clientName || "—"}   ·   Gerado em ${dateStr}   ·   Documento interno`;

  // ---------- Aba 1: Materiais ----------
  const ws = wb.addWorksheet("Materiais", {
    views: [{ state: "frozen", ySplit: 4 }],
    properties: { defaultRowHeight: 18 },
  });

  const headers = ["Ponte", "Categoria", "ID", "Item", "Unid.", "Qtd.", "Preço Unit. (R$)", "Total (R$)", "Status", "Observações"];
  const widths = [28, 22, 10, 46, 10, 10, 18, 18, 16, 32];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  styleTitleBlock(ws, "Lista de Materiais — Controle Interno", subtitle, headers.length);

  // Header row
  const headerRowIdx = 4;
  const headerRow = ws.getRow(headerRowIdx);
  headerRow.values = headers;
  styleHeader(headerRow);

  // Data
  let cursor = headerRowIdx + 1;
  const dataStart = cursor;
  allRows.forEach((r) => {
    const row = ws.getRow(cursor);
    row.values = [r.ponte, r.categoria, r.id, r.item, r.unidade, r.qty, r.unit, r.total, "", ""];
    cursor++;
  });
  const dataEnd = cursor - 1;

  applyZebraAndBorders(ws, dataStart, dataEnd, headers.length);

  // Formatos numéricos e alinhamentos
  for (let r = dataStart; r <= dataEnd; r++) {
    ws.getCell(r, 3).font = { name: "Consolas", size: 10, color: { argb: MUTED } };
    ws.getCell(r, 3).alignment = { horizontal: "center", vertical: "middle" };
    ws.getCell(r, 5).alignment = { horizontal: "center", vertical: "middle" };
    ws.getCell(r, 6).numFmt = "#,##0.###";
    ws.getCell(r, 6).alignment = { horizontal: "right", vertical: "middle" };
    ws.getCell(r, 7).numFmt = '"R$" #,##0.00';
    ws.getCell(r, 7).alignment = { horizontal: "right", vertical: "middle" };
    ws.getCell(r, 8).numFmt = '"R$" #,##0.00';
    ws.getCell(r, 8).alignment = { horizontal: "right", vertical: "middle" };
    ws.getCell(r, 8).font = { name: "Calibri", size: 10, bold: true, color: { argb: NAVY } };
    ws.getCell(r, 4).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  }

  // Linha de total
  const totalRow = ws.getRow(dataEnd + 1);
  totalRow.values = ["", "", "", "", "", "", "TOTAL GERAL", { formula: `SUM(H${dataStart}:H${dataEnd})` }, "", ""];
  totalRow.height = 24;
  totalRow.eachCell({ includeEmpty: true }, (cell, c) => {
    if (c > headers.length) return;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.border = thinBorder;
    cell.alignment = { vertical: "middle", horizontal: c >= 7 ? "right" : "center" };
  });
  ws.getCell(`H${dataEnd + 1}`).numFmt = '"R$" #,##0.00';

  // Status dropdown + cond. format
  addStatusValidation(ws, "I", dataStart, dataEnd);

  // Auto filter
  ws.autoFilter = {
    from: { row: headerRowIdx, column: 1 },
    to: { row: headerRowIdx, column: headers.length },
  };

  // ---------- Aba 2: Resumo por Item ----------
  const aggMap = new Map<string, { id: string; item: string; categoria: string; unidade: string; qty: number; unit: number; total: number }>();
  allRows.forEach((r) => {
    const existing = aggMap.get(r.id);
    if (existing) {
      existing.qty = Math.round((existing.qty + r.qty) * 1000) / 1000;
      existing.total = Math.round((existing.total + r.total) * 100) / 100;
    } else {
      aggMap.set(r.id, { id: r.id, item: r.item, categoria: r.categoria, unidade: r.unidade, qty: r.qty, unit: r.unit, total: r.total });
    }
  });
  const aggRows = Array.from(aggMap.values()).sort((a, b) =>
    a.categoria.localeCompare(b.categoria) || a.id.localeCompare(b.id)
  );

  const ws2 = wb.addWorksheet("Resumo por Item", {
    views: [{ state: "frozen", ySplit: 4 }],
  });
  const headers2 = ["Categoria", "ID", "Item", "Unid.", "Qtd. Total", "Preço Unit. (R$)", "Total (R$)", "Status", "Observações"];
  const widths2 = [22, 10, 46, 10, 12, 18, 18, 16, 32];
  widths2.forEach((w, i) => (ws2.getColumn(i + 1).width = w));

  styleTitleBlock(ws2, "Resumo Consolidado por Item", subtitle, headers2.length);
  const hr2 = ws2.getRow(4);
  hr2.values = headers2;
  styleHeader(hr2);

  let c2 = 5;
  const s2 = c2;
  aggRows.forEach((r) => {
    ws2.getRow(c2).values = [r.categoria, r.id, r.item, r.unidade, r.qty, r.unit, r.total, "", ""];
    c2++;
  });
  const e2 = c2 - 1;
  applyZebraAndBorders(ws2, s2, e2, headers2.length);

  for (let r = s2; r <= e2; r++) {
    ws2.getCell(r, 2).font = { name: "Consolas", size: 10, color: { argb: MUTED } };
    ws2.getCell(r, 2).alignment = { horizontal: "center", vertical: "middle" };
    ws2.getCell(r, 4).alignment = { horizontal: "center", vertical: "middle" };
    ws2.getCell(r, 5).numFmt = "#,##0.###";
    ws2.getCell(r, 5).alignment = { horizontal: "right", vertical: "middle" };
    ws2.getCell(r, 6).numFmt = '"R$" #,##0.00';
    ws2.getCell(r, 6).alignment = { horizontal: "right", vertical: "middle" };
    ws2.getCell(r, 7).numFmt = '"R$" #,##0.00';
    ws2.getCell(r, 7).alignment = { horizontal: "right", vertical: "middle" };
    ws2.getCell(r, 7).font = { name: "Calibri", size: 10, bold: true, color: { argb: NAVY } };
    ws2.getCell(r, 3).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  }

  const tr2 = ws2.getRow(e2 + 1);
  tr2.values = ["", "", "", "", "", "TOTAL", { formula: `SUM(G${s2}:G${e2})` }, "", ""];
  tr2.height = 24;
  tr2.eachCell({ includeEmpty: true }, (cell, c) => {
    if (c > headers2.length) return;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.border = thinBorder;
    cell.alignment = { vertical: "middle", horizontal: c >= 6 ? "right" : "center" };
  });
  ws2.getCell(`G${e2 + 1}`).numFmt = '"R$" #,##0.00';

  addStatusValidation(ws2, "H", s2, e2);
  ws2.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: headers2.length } };

  // ---------- Aba 3: Por Ponte ----------
  const ws3 = wb.addWorksheet("Por Ponte", { views: [{ state: "frozen", ySplit: 4 }] });
  const headers3 = ["Ponte", "Vãos", "Vão (m)", "Sensores", "Energia", "Conectividade", "Total (R$)"];
  const widths3 = [30, 10, 12, 12, 14, 16, 18];
  widths3.forEach((w, i) => (ws3.getColumn(i + 1).width = w));
  styleTitleBlock(ws3, "Totais por Ponte", subtitle, headers3.length);
  const hr3 = ws3.getRow(4);
  hr3.values = headers3;
  styleHeader(hr3);

  let c3 = 5;
  const s3 = c3;
  bridges.forEach((b) => {
    const rs = bridgeRows(b, components);
    const total = Math.round(rs.reduce((s, r) => s + r.total, 0) * 100) / 100;
    ws3.getRow(c3).values = [b.name || "OAE sem nome", b.spanCount, b.spanLength, b.sensorCount, b.energySource, b.connectivity, total];
    c3++;
  });
  const e3 = c3 - 1;
  applyZebraAndBorders(ws3, s3, e3, headers3.length);
  for (let r = s3; r <= e3; r++) {
    ws3.getCell(r, 7).numFmt = '"R$" #,##0.00';
    ws3.getCell(r, 7).font = { name: "Calibri", size: 10, bold: true, color: { argb: NAVY } };
    ws3.getCell(r, 7).alignment = { horizontal: "right", vertical: "middle" };
    [2, 3, 4, 5, 6].forEach((c) => (ws3.getCell(r, c).alignment = { horizontal: "center", vertical: "middle" }));
  }
  const tr3 = ws3.getRow(e3 + 1);
  tr3.values = ["TOTAL GERAL", "", "", "", "", "", { formula: `SUM(G${s3}:G${e3})` }];
  tr3.height = 24;
  tr3.eachCell({ includeEmpty: true }, (cell, c) => {
    if (c > headers3.length) return;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.border = thinBorder;
    cell.alignment = { vertical: "middle", horizontal: c === 7 ? "right" : "left", indent: c === 1 ? 1 : 0 };
  });
  ws3.getCell(`G${e3 + 1}`).numFmt = '"R$" #,##0.00';

  // ---------- Aba 4: Legenda ----------
  const wsL = wb.addWorksheet("Legenda Status");
  wsL.getColumn(1).width = 18;
  wsL.getColumn(2).width = 60;
  styleTitleBlock(wsL, "Legenda — Status de Compra", subtitle, 2);
  const hrL = wsL.getRow(4);
  hrL.values = ["Status", "Descrição"];
  styleHeader(hrL);
  const legend = [
    ["Pendente", "Item ainda não foi cotado ou processado."],
    ["Cotado", "Cotação realizada, aguardando aprovação para compra."],
    ["Comprado", "Pedido emitido / pagamento realizado."],
    ["Em estoque", "Material disponível em estoque interno."],
    ["Entregue", "Material entregue / instalado no local."],
    ["N/A", "Item não aplicável a este projeto."],
  ];
  legend.forEach((row, i) => {
    const r = wsL.getRow(5 + i);
    r.values = row;
    r.height = 22;
    r.eachCell((cell, c) => {
      cell.border = thinBorder;
      cell.alignment = { vertical: "middle", horizontal: c === 1 ? "center" : "left", indent: c === 2 ? 1 : 0, wrapText: true };
      cell.font = { name: "Calibri", size: 10, color: { argb: TEXT_DARK } };
    });
  });
  addStatusValidation(wsL, "A", 5, 4 + legend.length);

  // ---------- Aba 5: Lista de Compras ----------
  const wsC = wb.addWorksheet("Lista de Compras", {
    views: [{ state: "frozen", ySplit: 4 }],
  });
  const headersC = [
    "Ponte",
    "Categoria",
    "ID",
    "Item",
    "Unid.",
    "Qtd.",
    "Preço Unit. Ref. (R$)",
    "Total Ref. (R$)",
    "Comprado?",
    "Valor Pago (R$)",
    "Fornecedor / Local da Compra",
    "Data da Compra",
    "Entregue?",
    "Data de Entrega",
    "Observações",
  ];
  const widthsC = [26, 20, 10, 40, 8, 8, 18, 18, 13, 16, 32, 14, 12, 14, 32];
  widthsC.forEach((w, i) => (wsC.getColumn(i + 1).width = w));

  styleTitleBlock(
    wsC,
    "Lista de Compras — Controle de Aquisição",
    subtitle,
    headersC.length
  );
  const hrC = wsC.getRow(4);
  hrC.values = headersC;
  styleHeader(hrC);

  let cC = 5;
  const sC = cC;
  allRows.forEach((r) => {
    wsC.getRow(cC).values = [
      r.ponte,
      r.categoria,
      r.id,
      r.item,
      r.unidade,
      r.qty,
      r.unit,
      r.total,
      "Não",
      "",
      "",
      "",
      "Não",
      "",
      "",
    ];
    cC++;
  });
  const eC = cC - 1;
  applyZebraAndBorders(wsC, sC, eC, headersC.length);

  for (let r = sC; r <= eC; r++) {
    wsC.getCell(r, 3).font = { name: "Consolas", size: 10, color: { argb: MUTED } };
    wsC.getCell(r, 3).alignment = { horizontal: "center", vertical: "middle" };
    wsC.getCell(r, 5).alignment = { horizontal: "center", vertical: "middle" };
    wsC.getCell(r, 6).numFmt = "#,##0.###";
    wsC.getCell(r, 6).alignment = { horizontal: "right", vertical: "middle" };
    wsC.getCell(r, 7).numFmt = '"R$" #,##0.00';
    wsC.getCell(r, 7).alignment = { horizontal: "right", vertical: "middle" };
    wsC.getCell(r, 8).numFmt = '"R$" #,##0.00';
    wsC.getCell(r, 8).alignment = { horizontal: "right", vertical: "middle" };
    wsC.getCell(r, 8).font = { name: "Calibri", size: 10, bold: true, color: { argb: NAVY } };
    wsC.getCell(r, 4).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    wsC.getCell(r, 9).alignment = { horizontal: "center", vertical: "middle" };
    wsC.getCell(r, 10).numFmt = '"R$" #,##0.00';
    wsC.getCell(r, 10).alignment = { horizontal: "right", vertical: "middle" };
    wsC.getCell(r, 11).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    wsC.getCell(r, 12).numFmt = "dd/mm/yyyy";
    wsC.getCell(r, 12).alignment = { horizontal: "center", vertical: "middle" };
    wsC.getCell(r, 13).alignment = { horizontal: "center", vertical: "middle" };
    wsC.getCell(r, 14).numFmt = "dd/mm/yyyy";
    wsC.getCell(r, 14).alignment = { horizontal: "center", vertical: "middle" };
  }

  // Validação Sim/Não para Comprado? e Entregue?
  const yesNoValidate = (col: string) => {
    for (let r = sC; r <= eC; r++) {
      wsC.getCell(`${col}${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Sim,Não,Parcial"'],
      };
    }
    wsC.addConditionalFormatting({
      ref: `${col}${sC}:${col}${eC}`,
      rules: [
        {
          type: "containsText",
          operator: "containsText",
          text: "Sim",
          priority: 1,
          style: {
            fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFD1FAE5" } },
            font: { color: { argb: "FF065F46" }, bold: true },
          },
        },
        {
          type: "containsText",
          operator: "containsText",
          text: "Não",
          priority: 2,
          style: {
            fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFE4B5" } },
            font: { color: { argb: "FF8A5A00" }, bold: true },
          },
        },
        {
          type: "containsText",
          operator: "containsText",
          text: "Parcial",
          priority: 3,
          style: {
            fill: { type: "pattern", pattern: "solid", bgColor: { argb: ORANGE_SOFT } },
            font: { color: { argb: "FF9A3412" }, bold: true },
          },
        },
      ],
    });
  };
  yesNoValidate("I");
  yesNoValidate("M");

  // Linha de totais
  const trC = wsC.getRow(eC + 1);
  trC.values = [
    "",
    "",
    "",
    "",
    "",
    "",
    "TOTAIS",
    { formula: `SUM(H${sC}:H${eC})` },
    "",
    { formula: `SUM(J${sC}:J${eC})` },
    "",
    "",
    "",
    "",
    "",
  ];
  trC.height = 24;
  trC.eachCell({ includeEmpty: true }, (cell, c) => {
    if (c > headersC.length) return;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.border = thinBorder;
    cell.alignment = { vertical: "middle", horizontal: c === 7 ? "right" : "center" };
  });
  wsC.getCell(`H${eC + 1}`).numFmt = '"R$" #,##0.00';
  wsC.getCell(`J${eC + 1}`).numFmt = '"R$" #,##0.00';

  // Coluna auxiliar: diferença (Pago - Ref) — destaca se Pago > 0 e diverge
  wsC.addConditionalFormatting({
    ref: `J${sC}:J${eC}`,
    rules: [
      {
        type: "expression",
        priority: 1,
        formulae: [`AND($J${sC}>0,$J${sC}<>$H${sC})`],
        style: {
          font: { color: { argb: "FF9A3412" }, bold: true },
        },
      },
    ],
  });

  wsC.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: headersC.length },
  };

  // ---------- Download ----------
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeClient = (clientName || "VibMonitor").replace(/[^a-zA-Z0-9-_]/g, "_");
  const dateFile = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Materiais_${safeClient}_${dateFile}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
