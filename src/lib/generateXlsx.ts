import * as XLSX from "xlsx";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";

interface Row {
  Ponte: string;
  Categoria: string;
  ID: string;
  Item: string;
  Unidade: string;
  Quantidade: number;
  "Preço Unit. (R$)": number;
  "Total (R$)": number;
}

const get = (components: ComponentItem[], id: string) =>
  components.find((c) => c.id === id);

function bridgeRows(bridge: BridgeSpan, components: ComponentItem[]): Row[] {
  const totalLength = bridge.spanLength * bridge.spanCount;
  const rows: Row[] = [];
  const pname = bridge.name || "OAE sem nome";

  const push = (category: string, id: string, qty: number) => {
    const c = get(components, id);
    if (!c || qty === 0) return;
    rows.push({
      Ponte: pname,
      Categoria: category,
      ID: id,
      Item: c.name,
      Unidade: c.unit,
      Quantidade: Math.round(qty * 1000) / 1000,
      "Preço Unit. (R$)": c.unitPrice,
      "Total (R$)": Math.round(c.unitPrice * qty * 100) / 100,
    });
  };

  // Sensores
  push("Sensores", "S01", bridge.sensorCount);
  push("Sensores", "S02", bridge.sensorCount);
  push("Sensores", "S03", bridge.sensorCount);
  if (bridge.temperatureCount > 0) push("Sensores", "S04", bridge.temperatureCount);

  // Infraestrutura
  if (bridge.hasInfrastructure) {
    push("Infraestrutura", "INF01", totalLength / 3);
    push("Infraestrutura", "INF02", (totalLength + bridge.extraCableDistance) / 100);
    push("Infraestrutura", "INF03", bridge.spanCount);
    push("Infraestrutura", "INF04", bridge.sensorCount);
    push("Infraestrutura", "INF05", bridge.spanCount);
    push("Infraestrutura", "INF06", bridge.sensorCount);
  }

  // Energia
  if (bridge.energySource === "Solar") {
    push("Energia", "SOL-KIT", bridge.solarKitCount || 1);
  } else {
    push("Energia", "REDE", 1);
  }

  // Conectividade
  const conId = bridge.connectivity === "Completa" ? "CON1" : "CON2";
  push("Conectividade", conId, bridge.connectivityKitCount || 1);

  // Caixa de Comando
  const ccCount = bridge.solarKitCount || 1;
  push("Caixa de Comando", "CC01", ccCount);
  push("Caixa de Comando", "CC02", ccCount);
  push("Caixa de Comando", "CC03", ccCount);
  push("Caixa de Comando", "CC04", ccCount);
  push("Caixa de Comando", "CC05", bridge.hoursAssembly);
  if (bridge.energySource === "Rede") push("Caixa de Comando", "CC06", ccCount);

  // Modelagem
  push("Modelagem e Engenharia", "P01", bridge.spanCount);
  push("Modelagem e Engenharia", "P02", bridge.spanCount);
  push("Modelagem e Engenharia", "CN02", bridge.hoursAdequation);

  // Extras
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
        Ponte: "— Extras Globais —",
        Categoria: c.category,
        ID: e.componentId,
        Item: c.name,
        Unidade: c.unit,
        Quantidade: e.qty,
        "Preço Unit. (R$)": c.unitPrice,
        "Total (R$)": Math.round(c.unitPrice * e.qty * 100) / 100,
      } as Row;
    })
    .filter((r): r is Row => r !== null);
}

export function generateMaterialsXlsx(
  bridges: BridgeSpan[],
  components: ComponentItem[],
  globalExtras: ExtraItem[],
  clientName?: string
) {
  const allRows: Row[] = [];
  bridges.forEach((b) => allRows.push(...bridgeRows(b, components)));
  allRows.push(...extrasRows(globalExtras, components));

  const wb = XLSX.utils.book_new();

  // Sheet 1: Consolidado
  const consolidated = XLSX.utils.json_to_sheet(allRows);
  consolidated["!cols"] = [
    { wch: 28 }, { wch: 24 }, { wch: 10 }, { wch: 48 },
    { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, consolidated, "Materiais");

  // Sheet 2: Resumo por item (somatório)
  const aggMap = new Map<string, Row>();
  allRows.forEach((r) => {
    const existing = aggMap.get(r.ID);
    if (existing) {
      existing.Quantidade = Math.round((existing.Quantidade + r.Quantidade) * 1000) / 1000;
      existing["Total (R$)"] = Math.round((existing["Total (R$)"] + r["Total (R$)"]) * 100) / 100;
    } else {
      aggMap.set(r.ID, { ...r, Ponte: "Total Geral" });
    }
  });
  const aggRows = Array.from(aggMap.values()).sort((a, b) =>
    a.Categoria.localeCompare(b.Categoria) || a.ID.localeCompare(b.ID)
  );
  const aggSheet = XLSX.utils.json_to_sheet(aggRows);
  aggSheet["!cols"] = consolidated["!cols"];
  XLSX.utils.book_append_sheet(wb, aggSheet, "Resumo por Item");

  // Sheet 3: Por ponte (totais)
  const perBridge = bridges.map((b) => {
    const rs = bridgeRows(b, components);
    return {
      Ponte: b.name || "OAE sem nome",
      Vãos: b.spanCount,
      "Vão (m)": b.spanLength,
      Sensores: b.sensorCount,
      Energia: b.energySource,
      Conectividade: b.connectivity,
      "Total (R$)": Math.round(rs.reduce((s, r) => s + r["Total (R$)"], 0) * 100) / 100,
    };
  });
  const bridgeSheet = XLSX.utils.json_to_sheet(perBridge);
  bridgeSheet["!cols"] = [
    { wch: 28 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 14 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, bridgeSheet, "Por Ponte");

  const date = new Date().toISOString().slice(0, 10);
  const safeClient = (clientName || "VibMonitor").replace(/[^a-zA-Z0-9-_]/g, "_");
  XLSX.writeFile(wb, `Materiais_${safeClient}_${date}.xlsx`);
}
