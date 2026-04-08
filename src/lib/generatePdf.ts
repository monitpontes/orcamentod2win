import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BudgetSummary, formatCurrency } from "./budgetCalculations";

const PRIMARY = [30, 58, 95]; // #1e3a5f
const ACCENT = [249, 115, 22]; // #f97316
const LIGHT_BG = [245, 247, 250];
const WHITE = [255, 255, 255];
const TEXT = [30, 41, 59];

export function generateBudgetPdf(summary: BudgetSummary, clientName?: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 0;

  // ── Header bar ──
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 38, "F");

  // Accent stripe
  doc.setFillColor(...ACCENT);
  doc.rect(0, 38, pageW, 2, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("VibMonitor", margin, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Monitoramento de Vibração em Pontes", margin, 26);

  doc.setFontSize(8);
  doc.text("PROPOSTA COMERCIAL", margin, 33);

  // Date on the right
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(8);
  doc.text(dateStr, pageW - margin, 33, { align: "right" });

  y = 48;

  // ── Client info ──
  if (clientName) {
    doc.setTextColor(...TEXT);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Cliente:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(clientName, margin + 18, y);
    y += 10;
  }

  // ── Bridge costs table ──
  if (summary.bridgeCosts.length > 0) {
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento por OAE", margin, y);
    y += 3;

    const tableHead = [
      ["OAE", "Sensores", "Infra", "Energia", "Conect.", "Cx. Comando", "Modelo/Eng.", "Total"],
    ];

    const tableBody = summary.bridgeCosts.map((bc) => [
      bc.bridgeName,
      formatCurrency(bc.sensors),
      formatCurrency(bc.infrastructure),
      formatCurrency(bc.energy),
      formatCurrency(bc.connectivity),
      formatCurrency(bc.commandBox),
      formatCurrency(bc.modelingEngineering),
      formatCurrency(bc.total),
    ]);

    // Subtotal row
    tableBody.push([
      "SUBTOTAL",
      "",
      "",
      "",
      "",
      "",
      "",
      formatCurrency(summary.subtotal),
    ]);

    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        textColor: TEXT as any,
      },
      headStyles: {
        fillColor: PRIMARY as any,
        textColor: WHITE as any,
        fontStyle: "bold",
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: LIGHT_BG as any,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 30 },
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right", fontStyle: "bold" },
      },
      didParseCell: (data) => {
        // Style subtotal row
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fillColor = PRIMARY as any;
          data.cell.styles.textColor = WHITE as any;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Financial summary ──
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Financeiro", margin, y);
  y += 3;

  const financialData = [
    ["Subtotal dos Equipamentos", formatCurrency(summary.subtotal)],
    [`BDI (${(summary.bdiRate * 100).toFixed(0)}%)`, formatCurrency(summary.bdiValue)],
    [`Impostos (${(summary.taxRate * 100).toFixed(0)}%)`, formatCurrency(summary.taxValue)],
  ];

  autoTable(doc, {
    startY: y,
    body: financialData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: TEXT as any,
    },
    alternateRowStyles: {
      fillColor: LIGHT_BG as any,
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: "bold" },
      1: { halign: "right", fontStyle: "bold" },
    },
    theme: "plain",
    tableLineColor: [220, 220, 220] as any,
    tableLineWidth: 0.2,
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // ── Proposal value highlight ──
  doc.setFillColor(...ACCENT);
  doc.roundedRect(margin, y, pageW - margin * 2, 18, 3, 3, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR DA PROPOSTA", margin + 6, y + 8);
  doc.setFontSize(16);
  doc.text(formatCurrency(summary.proposalValue), pageW - margin - 6, y + 12, {
    align: "right",
  });

  y += 24;

  // ── Monthly value ──
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(margin, y, pageW - margin * 2, 14, 3, 3, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("ACOMPANHAMENTO MENSAL", margin + 6, y + 9);
  doc.setFontSize(12);
  doc.text(formatCurrency(summary.monthlyAccompaniment) + " / mês", pageW - margin - 6, y + 9, {
    align: "right",
  });

  y += 22;

  // ── Notes ──
  doc.setTextColor(130, 130, 130);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("• Proposta válida por 30 dias a partir da data de emissão.", margin, y);
  doc.text("• Valores sujeitos a alteração conforme especificações finais do projeto.", margin, y + 4);
  doc.text("• O acompanhamento mensal inclui banco de dados, API e plano de conectividade.", margin, y + 8);

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFillColor(...PRIMARY);
  doc.rect(0, footerY - 4, pageW, 14, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.text("VibMonitor — Monitoramento de Vibração em Pontes", margin, footerY + 2);
  doc.text(`Gerado em ${dateStr}`, pageW - margin, footerY + 2, { align: "right" });

  // Save
  const fileName = clientName
    ? `Proposta_VibMonitor_${clientName.replace(/\s+/g, "_")}.pdf`
    : `Proposta_VibMonitor_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
