import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  BorderStyle,
  WidthType,
  ShadingType,
  PageBreak,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";
import { BudgetSummary, formatCurrency } from "./budgetCalculations";
import { LOGO_D2WIN_BASE64 } from "./logoBase64";

// Colors
const NAVY = "1A2744";
const WHITE = "FFFFFF";
const LIGHT_BG = "F0F4F8";
const ACCENT = "0891B2";

function base64ToUint8Array(base64String: string): Uint8Array {
  const raw = base64String.replace(/^data:image\/\w+;base64,/, "");
  const binaryString = atob(raw);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const logoData = base64ToUint8Array(LOGO_D2WIN_BASE64);

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function navyHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: WHITE, font: "Arial", size: 16 })],
      }),
    ],
  });
}

function dataCell(text: string, width: number, opts?: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; shading?: string }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    shading: opts?.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 40, bottom: 40, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: opts?.align ?? AlignmentType.LEFT,
        children: [new TextRun({ text, bold: opts?.bold, font: "Arial", size: 16 })],
      }),
    ],
  });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    children: [new TextRun({ text, bold: true, color: NAVY, font: "Arial", size: 24 })],
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 20 })],
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}

function createHeader(): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            type: "jpg",
            data: logoData,
            transformation: { width: 80, height: 80 },
            altText: { title: "d2win", description: "Logo d2win", name: "logo" },
          }),
        ],
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1 } },
        children: [],
      }),
    ],
  });
}

function createFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 1 } },
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [
          new TextRun({ text: "d2win \u2014 Digital Twins Solutions", font: "Arial", size: 14, color: NAVY }),
        ],
      }),
    ],
  });
}

// ── Cover page ──
function buildCoverPage(summary: BudgetSummary, clientName?: string): Paragraph[] {
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const bridgeNames = summary.bridgeCosts.map((bc) => bc.bridgeName);

  const children: Paragraph[] = [
    emptyLine(),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          type: "jpg",
          data: logoData,
          transformation: { width: 200, height: 200 },
          altText: { title: "d2win", description: "Logo d2win", name: "logo-cover" },
        }),
      ],
    }),
    emptyLine(),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "PROPOSTA COMERCIAL",
          bold: true,
          font: "Arial",
          size: 36,
          color: NAVY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "Monitoramento Estrutural Cont\u00ednuo e G\u00eameos Digitais",
          font: "Arial",
          size: 24,
          color: NAVY,
        }),
      ],
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: dateStr, font: "Arial", size: 20, color: "666666" })],
    }),
    emptyLine(),
  ];

  if (clientName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Cliente: ", bold: true, font: "Arial", size: 22, color: NAVY }),
          new TextRun({ text: clientName, font: "Arial", size: 22 }),
        ],
      })
    );
  }

  children.push(emptyLine());
  children.push(
    sectionTitle("1. Objeto")
  );
  children.push(
    bodyText(
      "A presente proposta tem como objetivo a implanta\u00e7\u00e3o de sistema de monitoramento estrutural cont\u00ednuo, " +
      "com tecnologia de g\u00eameos digitais, nas seguintes Obras de Arte Especiais (OAEs):"
    )
  );

  bridgeNames.forEach((name) => {
    children.push(
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: name, font: "Arial", size: 20 })],
      })
    );
  });

  return children;
}

// ── Justificativa, Escopo, Premissas (texto fixo) ──
function buildFixedSections(): Paragraph[] {
  return [
    new Paragraph({ children: [new PageBreak()] }),

    sectionTitle("2. Justificativa e Objetivos"),

    new Paragraph({
      spacing: { before: 100, after: 60 },
      children: [new TextRun({ text: "2.1 Justificativa", bold: true, font: "Arial", size: 20, color: NAVY })],
    }),
    bodyText(
      "O monitoramento estrutural cont\u00ednuo de OAEs \u00e9 fundamental para garantir a seguran\u00e7a vi\u00e1ria, " +
      "preservar a integridade das estruturas e otimizar os custos de manuten\u00e7\u00e3o preventiva e corretiva."
    ),
    bodyText(
      "A utiliza\u00e7\u00e3o de g\u00eameos digitais permite a simula\u00e7\u00e3o e predi\u00e7\u00e3o do comportamento estrutural, " +
      "possibilitando a\u00e7\u00f5es antecipadas e baseadas em dados reais de campo."
    ),

    new Paragraph({
      spacing: { before: 100, after: 60 },
      children: [new TextRun({ text: "2.2 Objetivos", bold: true, font: "Arial", size: 20, color: NAVY })],
    }),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Monitorar vibra\u00e7\u00f5es e deslocamentos em tempo real", font: "Arial", size: 20 })],
    }),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Identificar anomalias estruturais precocemente", font: "Arial", size: 20 })],
    }),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Fornecer dados para tomada de decis\u00e3o em manuten\u00e7\u00e3o", font: "Arial", size: 20 })],
    }),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Construir modelo de g\u00eameo digital da estrutura", font: "Arial", size: 20 })],
    }),

    new Paragraph({ children: [new PageBreak()] }),

    sectionTitle("3. Escopo dos Servi\u00e7os"),

    new Paragraph({
      spacing: { before: 100, after: 60 },
      children: [new TextRun({ text: "3.1 Instrumenta\u00e7\u00e3o e Sensoriamento", bold: true, font: "Arial", size: 20, color: NAVY })],
    }),
    bodyText("Fornecimento e instala\u00e7\u00e3o de sensores de vibra\u00e7\u00e3o (aceler\u00f4metros triaxiais), " +
      "sensores de temperatura, infraestrutura de cabeamento e eletrodutos, " +
      "caixa de comando com sistema de aquisi\u00e7\u00e3o de dados e comunica\u00e7\u00e3o."),

    new Paragraph({
      spacing: { before: 100, after: 60 },
      children: [new TextRun({ text: "3.2 Conectividade e Transmiss\u00e3o de Dados", bold: true, font: "Arial", size: 20, color: NAVY })],
    }),
    bodyText("Sistema de transmiss\u00e3o de dados via rede celular (4G/5G) com plano de dados dedicado, " +
      "garantindo o envio cont\u00ednuo das medi\u00e7\u00f5es para a plataforma em nuvem."),

    new Paragraph({
      spacing: { before: 100, after: 60 },
      children: [new TextRun({ text: "3.3 Modelagem e Engenharia", bold: true, font: "Arial", size: 20, color: NAVY })],
    }),
    bodyText("Desenvolvimento do modelo de g\u00eameo digital da estrutura monitorada, " +
      "incluindo calibra\u00e7\u00e3o com dados de campo, an\u00e1lise modal e relat\u00f3rios de engenharia."),

    new Paragraph({ children: [new PageBreak()] }),

    sectionTitle("4. Premissas"),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Acesso liberado \u00e0s OAEs para instala\u00e7\u00e3o dos equipamentos", font: "Arial", size: 20 })],
    }),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Disponibilidade de energia el\u00e9trica no local (quando aplic\u00e1vel)", font: "Arial", size: 20 })],
    }),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Cobertura de rede celular para transmiss\u00e3o de dados", font: "Arial", size: 20 })],
    }),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Projeto estrutural da OAE disponibilizado pela contratante", font: "Arial", size: 20 })],
    }),

    sectionTitle("5. Responsabilidades da Contratante"),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Garantir acesso seguro \u00e0s estruturas", font: "Arial", size: 20 })],
    }),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Fornecer documenta\u00e7\u00e3o t\u00e9cnica das OAEs", font: "Arial", size: 20 })],
    }),
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: "Disponibilizar ponto de energia el\u00e9trica quando necess\u00e1rio", font: "Arial", size: 20 })],
    }),
  ];
}

// ── Investment tables ──
function buildInvestmentSection(summary: BudgetSummary): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [
    new Paragraph({ children: [new PageBreak()] }),
    sectionTitle("6. Investimentos"),
  ];

  // Table width for A4 with 1" margins: 11906 - 2880 = 9026
  const TW = 9026;

  if (summary.bridgeCosts.length > 0) {
    // Per-bridge table
    const colWidths = [1800, 1032, 1032, 1032, 1032, 1032, 1032, 1034];

    elements.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: "6.1 Detalhamento por OAE", bold: true, font: "Arial", size: 20, color: NAVY })],
      })
    );

    const headerRow = new TableRow({
      children: [
        navyHeaderCell("OAE", colWidths[0]),
        navyHeaderCell("Sensores", colWidths[1]),
        navyHeaderCell("Infra", colWidths[2]),
        navyHeaderCell("Energia", colWidths[3]),
        navyHeaderCell("Conect.", colWidths[4]),
        navyHeaderCell("Cx. Cmd.", colWidths[5]),
        navyHeaderCell("Modelo", colWidths[6]),
        navyHeaderCell("Total", colWidths[7]),
      ],
    });

    const dataRows = summary.bridgeCosts.map((bc, idx) => {
      const bg = idx % 2 === 0 ? undefined : LIGHT_BG;
      return new TableRow({
        children: [
          dataCell(bc.bridgeName, colWidths[0], { bold: true, shading: bg }),
          dataCell(formatCurrency(bc.sensors), colWidths[1], { align: AlignmentType.RIGHT, shading: bg }),
          dataCell(formatCurrency(bc.infrastructure), colWidths[2], { align: AlignmentType.RIGHT, shading: bg }),
          dataCell(formatCurrency(bc.energy), colWidths[3], { align: AlignmentType.RIGHT, shading: bg }),
          dataCell(formatCurrency(bc.connectivity), colWidths[4], { align: AlignmentType.RIGHT, shading: bg }),
          dataCell(formatCurrency(bc.commandBox), colWidths[5], { align: AlignmentType.RIGHT, shading: bg }),
          dataCell(formatCurrency(bc.modelingEngineering), colWidths[6], { align: AlignmentType.RIGHT, shading: bg }),
          dataCell(formatCurrency(bc.total), colWidths[7], { bold: true, align: AlignmentType.RIGHT, shading: bg }),
        ],
      });
    });

    // Subtotal row
    const subtotalRow = new TableRow({
      children: [
        new TableCell({
          width: { size: colWidths[0], type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: "SUBTOTAL", bold: true, color: WHITE, font: "Arial", size: 16 })] })],
        }),
        ...colWidths.slice(1, 7).map((w) =>
          new TableCell({
            width: { size: w, type: WidthType.DXA },
            borders: cellBorders,
            shading: { fill: NAVY, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [new Paragraph({ children: [] })],
          })
        ),
        new TableCell({
          width: { size: colWidths[7], type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: formatCurrency(summary.subtotal), bold: true, color: WHITE, font: "Arial", size: 16 })],
            }),
          ],
        }),
      ],
    });

    elements.push(
      new Table({
        width: { size: TW, type: WidthType.DXA },
        columnWidths: colWidths,
        rows: [headerRow, ...dataRows, subtotalRow],
      })
    );
  }

  // Financial summary table
  elements.push(
    new Paragraph({
      spacing: { before: 300, after: 80 },
      children: [new TextRun({ text: "6.2 Resumo Financeiro", bold: true, font: "Arial", size: 20, color: NAVY })],
    })
  );

  const finColWidths = [6000, 3026];
  const finRows = [
    ["Subtotal dos Equipamentos", formatCurrency(summary.subtotal)],
    [`BDI (${(summary.bdiRate * 100).toFixed(0)}%)`, formatCurrency(summary.bdiValue)],
    [`Impostos (${(summary.taxRate * 100).toFixed(0)}%)`, formatCurrency(summary.taxValue)],
  ];

  const finTableRows = finRows.map(([label, value], idx) =>
    new TableRow({
      children: [
        dataCell(label, finColWidths[0], { bold: true, shading: idx % 2 === 0 ? undefined : LIGHT_BG }),
        dataCell(value, finColWidths[1], { bold: true, align: AlignmentType.RIGHT, shading: idx % 2 === 0 ? undefined : LIGHT_BG }),
      ],
    })
  );

  elements.push(
    new Table({
      width: { size: TW, type: WidthType.DXA },
      columnWidths: finColWidths,
      rows: finTableRows,
    })
  );

  // Proposal value highlight
  elements.push(emptyLine());
  elements.push(
    new Table({
      width: { size: TW, type: WidthType.DXA },
      columnWidths: [5500, 3526],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 5500, type: WidthType.DXA },
              borders: noBorders,
              shading: { fill: ACCENT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "VALOR DA PROPOSTA", bold: true, color: WHITE, font: "Arial", size: 22 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 3526, type: WidthType.DXA },
              borders: noBorders,
              shading: { fill: ACCENT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: formatCurrency(summary.proposalValue), bold: true, color: WHITE, font: "Arial", size: 28 })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Monthly
  elements.push(emptyLine());
  elements.push(
    new Table({
      width: { size: TW, type: WidthType.DXA },
      columnWidths: [5500, 3526],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 5500, type: WidthType.DXA },
              borders: noBorders,
              shading: { fill: NAVY, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "ACOMPANHAMENTO MENSAL", bold: true, color: WHITE, font: "Arial", size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 3526, type: WidthType.DXA },
              borders: noBorders,
              shading: { fill: NAVY, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: `${formatCurrency(summary.monthlyAccompaniment)} / m\u00eas`, bold: true, color: WHITE, font: "Arial", size: 22 })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  return elements;
}

// ── Closing pages ──
function buildClosingPages(): Paragraph[] {
  return [
    new Paragraph({ children: [new PageBreak()] }),

    sectionTitle("7. Dados da Contratada"),
    bodyText("Raz\u00e3o Social: SoraLab Tecnologia Ltda (d2win)"),
    bodyText("Endere\u00e7o: Av. Brasil, 1234 \u2014 Centro, S\u00e3o Paulo/SP"),
    bodyText("CNPJ: XX.XXX.XXX/0001-XX"),
    bodyText("Contato: contato@d2win.com.br"),

    emptyLine(),
    sectionTitle("8. Validade da Proposta"),
    bodyText("Esta proposta \u00e9 v\u00e1lida por 60 (sessenta) dias corridos a partir da data de emiss\u00e3o."),

    emptyLine(),
    sectionTitle("9. De Acordo"),
    emptyLine(),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "________________________________________", font: "Arial", size: 20 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: "Contratante", font: "Arial", size: 18, color: "666666" })],
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "________________________________________", font: "Arial", size: 20 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: "d2win \u2014 Digital Twins Solutions", font: "Arial", size: 18, color: "666666" })],
    }),
  ];
}

export async function generateBudgetDocx(summary: BudgetSummary, clientName?: string) {
  const coverChildren = buildCoverPage(summary, clientName);
  const fixedSections = buildFixedSections();
  const investmentElements = buildInvestmentSection(summary);
  const closingPages = buildClosingPages();

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: { default: createHeader() },
        footers: { default: createFooter() },
        children: [
          ...coverChildren,
          ...fixedSections,
          ...investmentElements,
          ...closingPages,
        ] as (Paragraph | Table)[],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = clientName
    ? `Proposta_d2win_${clientName.replace(/\s+/g, "_")}.docx`
    : `Proposta_d2win_${new Date().toISOString().slice(0, 10)}.docx`;
  saveAs(blob, fileName);
}
