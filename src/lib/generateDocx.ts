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
  VerticalAlign,
  TabStopType,
  TabStopPosition,
} from "docx";
import { saveAs } from "file-saver";
import { BudgetSummary, formatCurrency } from "./budgetCalculations";
import { LOGO_D2WIN_PNG, LOGO_SORALAB_PNG, LOGO_CASAGRANDE_PNG } from "./logosBase64";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";

const THIRD_PARTY_CATEGORY = "Infraestrutura de Terceiros";

// Colors
const NAVY = "1A2744";
const WHITE = "FFFFFF";

function base64ToUint8Array(base64String: string): Uint8Array {
  const raw = base64String.replace(/^data:image\/\w+;base64,/, "");
  const binaryString = atob(raw);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const logoD2winData = base64ToUint8Array(LOGO_D2WIN_PNG);
const logoSoralabData = base64ToUint8Array(LOGO_SORALAB_PNG);
const logoCasagrandeData = base64ToUint8Array(LOGO_CASAGRANDE_PNG);

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

// Table width for A4 with ~1" margins: 9026 DXA
const TW = 9026;

function navyHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: WHITE, font: "Calibri", size: 18 })],
      }),
    ],
  });
}

function dataCell(text: string, width: number, opts?: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    margins: { top: 40, bottom: 40, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: opts?.align ?? AlignmentType.LEFT,
        children: [new TextRun({ text, bold: opts?.bold, font: "Calibri", size: 18 })],
      }),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 24, color: NAVY })],
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 22, color: NAVY })],
  });
}

function subSubHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 20, color: NAVY })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: "Calibri", size: 20 })],
  });
}


function bodyText(text: string, opts?: { bold?: boolean; underline?: boolean }): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: "Calibri", size: 20, bold: opts?.bold, underline: opts?.underline ? {} : undefined })],
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function createHeader(): Header {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  // Original doc sizes (maintaining aspect ratios):
  // d2win: 103x100 → height 45, width 46
  // soralab: 111x94 → height 45, width 53  (but the text "SoraLab Digital Twins Solutions" appears below)
  // casagrande: 249x85 → height 45, width 132
  const logoHeight = 45;
  const d2winW = Math.round(logoHeight * (103 / 100));
  const soralabW = Math.round(logoHeight * (111 / 94));
  const casagrandeW = Math.round(logoHeight * (249 / 85));

  return new Header({
    children: [
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3009, 3009, 3008],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 3009, type: WidthType.DXA },
                borders: noBorders,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      new ImageRun({
                        type: "png",
                        data: logoD2winData,
                        transformation: { width: d2winW, height: logoHeight },
                        altText: { title: "d2win", description: "Logo d2win", name: "logo-d2win" },
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 3009, type: WidthType.DXA },
                borders: noBorders,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        type: "png",
                        data: logoCasagrandeData,
                        transformation: { width: casagrandeW, height: logoHeight },
                        altText: { title: "Casagrande", description: "Logo Casagrande", name: "logo-casagrande" },
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 3008, type: WidthType.DXA },
                borders: noBorders,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new ImageRun({
                        type: "png",
                        data: logoSoralabData,
                        transformation: { width: soralabW, height: logoHeight },
                        altText: { title: "SoraLab", description: "Logo SoraLab", name: "logo-soralab" },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
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
          new TextRun({ text: "d2win - Digital Twins Solutions", font: "Calibri", size: 16, color: NAVY }),
        ],
      }),
    ],
  });
}

// ── Number to words (Portuguese BRL) ──
function numberToWords(value: number): string {
  const units = ["", "um", "dois", "tr\u00eas", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function convert(n: number): string {
    if (n === 0) return "zero";
    if (n === 100) return "cem";

    let result = "";

    if (n >= 100) {
      result += hundreds[Math.floor(n / 100)];
      n %= 100;
      if (n > 0) result += " e ";
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) result += " e ";
    }

    if (n > 0 && n < 20) {
      result += units[n];
    }

    return result;
  }

  const intPart = Math.floor(value);
  const centsPart = Math.round((value - intPart) * 100);

  let text = "";

  if (intPart === 0 && centsPart === 0) return "zero reais";

  const billions = Math.floor(intPart / 1000000000);
  const millions = Math.floor((intPart % 1000000000) / 1000000);
  const thousands = Math.floor((intPart % 1000000) / 1000);
  const remainder = intPart % 1000;

  const parts: string[] = [];

  if (billions > 0) {
    parts.push(convert(billions) + (billions === 1 ? " bilh\u00e3o" : " bilh\u00f5es"));
  }
  if (millions > 0) {
    parts.push(convert(millions) + (millions === 1 ? " milh\u00e3o" : " milh\u00f5es"));
  }
  if (thousands > 0) {
    parts.push(convert(thousands) + " mil");
  }
  if (remainder > 0) {
    parts.push(convert(remainder));
  }

  if (parts.length === 0 && centsPart > 0) {
    text = "";
  } else {
    // Join with ", " except last with " e "
    if (parts.length === 1) {
      text = parts[0];
    } else if (parts.length === 2) {
      text = parts[0] + ", " + parts[1];
    } else {
      text = parts.slice(0, -1).join(", ") + " e " + parts[parts.length - 1];
    }
    text += (intPart === 1 ? " real" : " reais");
  }

  if (centsPart > 0) {
    const centsText = convert(centsPart) + (centsPart === 1 ? " centavo" : " centavos");
    text = text ? text + " e " + centsText : centsText;
  }

  // Capitalize first letter
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ── Cover page (Page 1) ──
function buildCoverPage(summary: BudgetSummary, clientName?: string): (Paragraph | Table)[] {
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const bridgeNames = summary.bridgeCosts.map((bc) => bc.bridgeName);

  const children: (Paragraph | Table)[] = [
    emptyLine(),
    emptyLine(),
    emptyLine(),
    emptyLine(),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Proposta Comercial: Monitoramento Estrutural Cont\u00ednuo e G\u00eameos Digitais",
          bold: true,
          font: "Calibri",
          size: 28,
          color: NAVY,
        }),
      ],
    }),
    emptyLine(),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "Data: ", bold: true, font: "Calibri", size: 20 }),
        new TextRun({ text: dateStr, font: "Calibri", size: 20 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "Revis\u00e3o: ", bold: true, font: "Calibri", size: 20 }),
        new TextRun({ text: "1.0", font: "Calibri", size: 20 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "Respons\u00e1vel: ", bold: true, font: "Calibri", size: 20 }),
        new TextRun({ text: clientName || "---", font: "Calibri", size: 20 }),
      ],
    }),
    emptyLine(),
  ];

  // 1. Objeto
  children.push(sectionHeading("1. Objeto"));
  children.push(
    bodyText(
      "A presente proposta comercial tem por objeto a realiza\u00e7\u00e3o de um Sistema de Monitoramento Estrutural Cont\u00ednuo (SHM) integrado a um G\u00eameo Digital para as OAEs:"
    )
  );

  // OAE table
  const oaeRows = bridgeNames.map((name, idx) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: TW, type: WidthType.DXA },
          borders: cellBorders,
          shading: idx === 0 ? { fill: NAVY, type: ShadingType.CLEAR } : undefined,
          margins: { top: 40, bottom: 40, left: 100, right: 100 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: name, font: "Calibri", size: 20, color: idx === 0 ? WHITE : undefined, bold: idx === 0 })],
            }),
          ],
        }),
      ],
    })
  );

  children.push(
    new Table({
      width: { size: TW, type: WidthType.DXA },
      columnWidths: [TW],
      rows: oaeRows,
    })
  );

  children.push(emptyLine());
  children.push(
    bodyText(
      "Incluindo sensoriza\u00e7\u00e3o, modelagem num\u00e9rica, cria\u00e7\u00e3o e calibra\u00e7\u00e3o do modelo digital, bem como suporte \u00e0 interpreta\u00e7\u00e3o dos dados de integridade estrutural."
    )
  );

  return children;
}

// ── Sections 1-5 (Padrão Proposta Técnica) ──
function buildFixedSections(): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  elements.push(new Paragraph({ children: [new PageBreak()] }));

  // ───────────────────────── 1. ESCOPO DETALHADO ─────────────────────────
  elements.push(sectionHeading("1. Escopo Detalhado"));
  elements.push(bodyText(
    "A gest\u00e3o moderna de estruturas de infraestrutura exige m\u00e9todos capazes de identificar precocemente qualquer altera\u00e7\u00e3o no comportamento estrutural, reduzindo riscos, incertezas e custos operacionais. Nesse cen\u00e1rio, o avan\u00e7o tecnol\u00f3gico permite que pontes e viadutos deixem de depender exclusivamente de inspe\u00e7\u00f5es visuais peri\u00f3dicas para evoluir para um modelo cont\u00ednuo, sens\u00edvel e preventivo de acompanhamento. O presente documento descreve de forma detalhada o escopo t\u00e9cnico da solu\u00e7\u00e3o proposta, contemplando o monitoramento online e din\u00e2mico da estrutura, a integra\u00e7\u00e3o com modelos num\u00e9ricos e os mecanismos de diagn\u00f3stico cont\u00ednuo necess\u00e1rios para assegurar alta confiabilidade operacional ao longo de todo o ciclo de vida do ativo."
  ));

  // 1.1 Proposta de Valor
  elements.push(subHeading("1.1 Proposta de Valor"));
  elements.push(bodyText(
    "A proposta de valor apresentada est\u00e1 fundamentada na transi\u00e7\u00e3o do modelo de manuten\u00e7\u00e3o reativo para uma abordagem preditiva, baseada em dados audit\u00e1veis e em an\u00e1lises estruturais avan\u00e7adas. Ao integrar medi\u00e7\u00f5es cont\u00ednuas, intelig\u00eancia anal\u00edtica e modelagem digital, a solu\u00e7\u00e3o permite identificar danos em est\u00e1gio inicial, otimizar interven\u00e7\u00f5es e maximizar a disponibilidade estrutural, resultando em ganhos operacionais, financeiros, de seguran\u00e7a e de governan\u00e7a."
  ));

  elements.push(subSubHeading("1.1.1 A Evolu\u00e7\u00e3o da Manuten\u00e7\u00e3o Estrutural"));
  elements.push(bodyText(
    "A presente proposta tem como objetivo a implementa\u00e7\u00e3o de um Sistema de Monitoramento Estrutural Cont\u00ednuo (SHM) integrado a um G\u00eameo Digital, permitindo que a estrutura seja acompanhada em tempo real, com sensibilidade a altera\u00e7\u00f5es de rigidez, vibra\u00e7\u00e3o, frequ\u00eancia natural e manifesta\u00e7\u00f5es patol\u00f3gicas antes que sejam percept\u00edveis visualmente."
  ));
  elements.push(bodyText(
    "O SHM (Structural Health Monitoring) \u00e9 um sistema composto por sensores instalados na estrutura que medem continuamente seus par\u00e2metros f\u00edsicos, como acelera\u00e7\u00e3o, deforma\u00e7\u00e3o e frequ\u00eancia, para identificar mudan\u00e7as no comportamento din\u00e2mico. Diferentemente das inspe\u00e7\u00f5es tradicionais, que dependem de visitas peri\u00f3dicas e observa\u00e7\u00e3o visual, o SHM fornece dados cont\u00ednuos, permitindo detectar precocemente anomalias associadas ao surgimento de fissuras, perda de rigidez, deslocamentos anormais e outros sinais iniciais de deteriora\u00e7\u00e3o."
  ));
  elements.push(bodyText(
    "O G\u00eameo Digital, por sua vez, \u00e9 um modelo virtual da estrutura que replica seu comportamento real por meio de simula\u00e7\u00f5es e atualiza\u00e7\u00f5es constantes com os dados adquiridos pelos sensores. Ao integrar OMA, Modelos de Elementos Finitos (MEF) e algoritmos de an\u00e1lise, o G\u00eameo Digital consegue comparar o estado atual com o estado saud\u00e1vel da estrutura, prever a evolu\u00e7\u00e3o dos danos e simular cen\u00e1rios de interven\u00e7\u00e3o. Isso transforma o monitoramento em uma ferramenta de apoio estrat\u00e9gico, permitindo tomada de decis\u00e3o baseada em evid\u00eancias e planejamento de manuten\u00e7\u00e3o com ampla anteced\u00eancia."
  ));
  elements.push(bodyText(
    "Com essa integra\u00e7\u00e3o entre SHM e G\u00eameo Digital, a estrutura deixa de ser avaliada apenas de forma pontual e passa a ser acompanhada de maneira din\u00e2mica, cont\u00ednua e preditiva, aumentando significativamente a seguran\u00e7a, a confiabilidade operacional e a efici\u00eancia das a\u00e7\u00f5es de manuten\u00e7\u00e3o."
  ));
  elements.push(bodyText(
    "Essa solu\u00e7\u00e3o transforma o processo de manuten\u00e7\u00e3o do modelo reativo (interven\u00e7\u00e3o apenas ap\u00f3s danos vis\u00edveis) para o modelo preditivo, alinhado \u00e0s diretrizes mais modernas de preserva\u00e7\u00e3o estrutural e gest\u00e3o eficiente de ativos."
  ));
  elements.push(bodyText(
    "Segundo o Bridge Preservation Guide \u2013 FHWA, estrat\u00e9gias reativas (\u201cworst-first\u201d) s\u00e3o ineficientes, caras e incapazes de antecipar falhas, enquanto programas de preserva\u00e7\u00e3o estrutural suportados por monitoramento cont\u00ednuo reduzem custos anualizados, prolongam a vida \u00fatil e evitam interven\u00e7\u00f5es emergenciais de alto impacto."
  ));
  elements.push(bodyText("Al\u00e9m disso, a ado\u00e7\u00e3o de G\u00eameos Digitais representa um salto qualitativo na forma como concession\u00e1rias gerenciam pontes e viadutos, permitindo:"));
  [
    "gest\u00e3o baseada em dados audit\u00e1veis;",
    "maior seguran\u00e7a operacional;",
    "aumento de confiabilidade;",
    "alinhamento ao ESG;",
    "fortalecimento da governan\u00e7a e mitiga\u00e7\u00e3o de riscos.",
  ].forEach((b) => elements.push(bullet(b)));

  // 1.2 Justificativa e Objetivos
  elements.push(subHeading("1.2 Justificativa e Objetivos do Projeto"));
  elements.push(bodyText(
    "A presente proposta foca na implementa\u00e7\u00e3o de um G\u00eameo Digital para a gest\u00e3o avan\u00e7ada e inteligente dos ativos estruturais. O objetivo central transcende o monitoramento pontual, estabelecendo uma ferramenta de an\u00e1lise cont\u00ednua para:"
  ));

  elements.push(subSubHeading("1.2.1 Detec\u00e7\u00e3o de Altera\u00e7\u00f5es Estruturais"));
  elements.push(bodyText(
    "O sistema de G\u00eameo Digital possibilita a identifica\u00e7\u00e3o cont\u00ednua de varia\u00e7\u00f5es no comportamento estrutural ao longo do tempo, a partir da integra\u00e7\u00e3o de dados de monitoramento em tempo real com modelos digitais representativos da estrutura."
  ));
  elements.push(bodyText(
    "Essa abordagem permite detectar altera\u00e7\u00f5es progressivas de rigidez, mudan\u00e7as nos padr\u00f5es din\u00e2micos e desvios em rela\u00e7\u00e3o ao comportamento de refer\u00eancia (baseline), muitas vezes antes da manifesta\u00e7\u00e3o vis\u00edvel de danos, fornecendo subs\u00eddios objetivos para a\u00e7\u00f5es preventivas e acompanhamento da evolu\u00e7\u00e3o estrutural."
  ));

  elements.push(subSubHeading("1.2.2 An\u00e1lise de Cargas Especiais"));
  elements.push(bodyText(
    "O monitoramento cont\u00ednuo viabiliza a identifica\u00e7\u00e3o e a an\u00e1lise do efeito da passagem de ve\u00edculos com cargas excepcionais sobre a estrutura, permitindo avaliar n\u00e3o apenas a resposta imediata \u00e0s solicita\u00e7\u00f5es, mas tamb\u00e9m o tempo de recupera\u00e7\u00e3o estrutural ap\u00f3s esses eventos."
  ));
  elements.push(bodyText(
    "Essa capacidade amplia o entendimento sobre o comportamento real da OAE sob condi\u00e7\u00f5es cr\u00edticas de carregamento, apoiando a verifica\u00e7\u00e3o de seguran\u00e7a operacional, a defini\u00e7\u00e3o de restri\u00e7\u00f5es de tr\u00e1fego quando necess\u00e1rio e a avalia\u00e7\u00e3o cumulativa dos impactos ao longo do ciclo de vida do ativo."
  ));

  elements.push(subSubHeading("1.2.3 Suporte \u00e0 Decis\u00e3o (Requalifica\u00e7\u00e3o de TB)"));
  elements.push(bodyText(
    "O G\u00eameo Digital atua como uma base t\u00e9cnica consolidada para a requalifica\u00e7\u00e3o de Trens-Tipo (TB) das obras, permitindo que decis\u00f5es sejam fundamentadas em dados reais de comportamento estrutural, e n\u00e3o apenas em hip\u00f3teses de projeto ou an\u00e1lises pontuais."
  ));
  elements.push(bodyText(
    "A integra\u00e7\u00e3o entre monitoramento, hist\u00f3rico de solicita\u00e7\u00f5es e modelos digitais possibilita avaliar a adequa\u00e7\u00e3o dos TB adotados, orientar revis\u00f5es de capacidade de carga, priorizar interven\u00e7\u00f5es e apoiar estrat\u00e9gias de manuten\u00e7\u00e3o e gest\u00e3o de ativos de forma mais eficiente, transparente e tecnicamente embasada."
  ));

  elements.push(subSubHeading("1.2.4 Inova\u00e7\u00e3o e Posicionamento Estrat\u00e9gico"));
  elements.push(bodyText(
    "A implementa\u00e7\u00e3o deste projeto possui car\u00e1ter pioneiro ao aplicar, de forma integrada e operacional, o conceito de G\u00eameo Digital em Obras de Arte Especiais (OAEs) no contexto rodovi\u00e1rio brasileiro. Diferentemente de abordagens tradicionais baseadas em inspe\u00e7\u00f5es peri\u00f3dicas ou monitoramentos pontuais, o G\u00eameo Digital estabelece uma representa\u00e7\u00e3o din\u00e2mica da estrutura, continuamente alimentada por dados reais de comportamento ao longo do tempo."
  ));
  elements.push(bodyText(
    "Essa abordagem rompe com o modelo convencional de avalia\u00e7\u00e3o estrutural, que historicamente se apoia em an\u00e1lises est\u00e1ticas, campanhas isoladas de medi\u00e7\u00e3o ou interpreta\u00e7\u00f5es subjetivas de inspe\u00e7\u00e3o visual. O projeto introduz uma l\u00f3gica de gest\u00e3o baseada em evid\u00eancias, na qual a estrutura passa a ser acompanhada de forma cont\u00ednua, permitindo a identifica\u00e7\u00e3o de tend\u00eancias, desvios de comportamento e respostas estruturais a diferentes n\u00edveis de solicita\u00e7\u00e3o."
  ));
  elements.push(bodyText(
    "Do ponto de vista estrat\u00e9gico, o G\u00eameo Digital transforma o monitoramento em uma ferramenta ativa de gest\u00e3o do ativo. A contratante passa a dispor de uma base hist\u00f3rica estruturada de dados, capaz de subsidiar decis\u00f5es t\u00e9cnicas relacionadas \u00e0 opera\u00e7\u00e3o, manuten\u00e7\u00e3o, requalifica\u00e7\u00e3o de capacidade e planejamento de investimentos, reduzindo incertezas e aumentando a previsibilidade do desempenho estrutural ao longo do ciclo de vida da obra."
  ));
  elements.push(bodyText(
    "Al\u00e9m disso, a ado\u00e7\u00e3o desse conceito posiciona a contratante como refer\u00eancia nacional em inova\u00e7\u00e3o na gest\u00e3o de infraestrutura rodovi\u00e1ria, antecipando tend\u00eancias que v\u00eam sendo adotadas de forma crescente em mercados internacionais. O car\u00e1ter pioneiro da iniciativa fortalece o posicionamento institucional, demonstrando comprometimento com seguran\u00e7a, sustentabilidade, efici\u00eancia operacional e uso estrat\u00e9gico de tecnologia avan\u00e7ada na preserva\u00e7\u00e3o de seus ativos."
  ));

  // 1.3 Fundamentação Técnica
  elements.push(subHeading("1.3 Fundamenta\u00e7\u00e3o T\u00e9cnica"));
  elements.push(bodyText(
    "A An\u00e1lise Modal Operacional (OMA) permite extrair, em condi\u00e7\u00f5es reais de opera\u00e7\u00e3o, as frequ\u00eancias naturais e os modos de vibra\u00e7\u00e3o de uma estrutura. Esses par\u00e2metros din\u00e2micos s\u00e3o altamente sens\u00edveis a qualquer altera\u00e7\u00e3o na rigidez dos elementos estruturais, tornando-se excelentes indicadores de degrada\u00e7\u00e3o incipiente. Em pontes de m\u00faltiplas vigas, redu\u00e7\u00f5es sutis na rigidez das longarinas, transversinas ou aparelhos de apoio j\u00e1 se refletem de forma mensur\u00e1vel no comportamento modal, mesmo quando n\u00e3o h\u00e1 manifesta\u00e7\u00f5es vis\u00edveis."
  ));

  elements.push(subSubHeading("1.3.1 Sensibilidade das Frequ\u00eancias Naturais \u00e0 Varia\u00e7\u00e3o de Rigidez"));
  elements.push(bodyText(
    "A frequ\u00eancia natural de um modo de vibra\u00e7\u00e3o depende diretamente da rigidez (k) e da massa (m) da estrutura, obedecendo, de forma simplificada, \u00e0 rela\u00e7\u00e3o f \u221d \u221a(k/m)."
  ));
  elements.push(bodyText(
    "Assim, pequenas redu\u00e7\u00f5es de rigidez, frequentemente inferiores ao que seria necess\u00e1rio para gerar fissuras vis\u00edveis, produzem varia\u00e7\u00f5es detect\u00e1veis nas frequ\u00eancias naturais. Isso ocorre porque, ao iniciar a microfissura\u00e7\u00e3o, o concreto entra em regime de Est\u00e1dio II, reduzindo sua in\u00e9rcia efetiva \u00e0 flex\u00e3o muito antes que qualquer fissura possa ser percebida visualmente."
  ));

  elements.push(subSubHeading("1.3.2 Modos Verticais e Diagn\u00f3stico de Fissura\u00e7\u00e3o nas Vigas"));
  elements.push(bodyText("Os modos verticais (flex\u00e3o longitudinal e transversal) s\u00e3o governados pela rigidez das vigas e transversinas. S\u00e3o eles os mais sens\u00edveis \u00e0:"));
  [
    "in\u00edcio da fissura\u00e7\u00e3o;",
    "perda parcial de protens\u00e3o;",
    "degrada\u00e7\u00e3o da in\u00e9rcia efetiva;",
    "danos localizados no meio do v\u00e3o, onde os momentos fletores s\u00e3o m\u00e1ximos.",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(bodyText("A sensibilidade vertical \u00e9 o principal indicador estrutural para:"));
  [
    "identifica\u00e7\u00e3o precoce de dano;",
    "quantifica\u00e7\u00e3o aproximada da perda de rigidez;",
    "avalia\u00e7\u00e3o da continuidade da viga;",
    "calibra\u00e7\u00e3o do G\u00eameo Digital.",
  ].forEach((b) => elements.push(bullet(b)));

  elements.push(subSubHeading("1.3.3 Fissura\u00e7\u00e3o Inicial e Varia\u00e7\u00e3o do Comportamento Din\u00e2mico"));
  elements.push(bodyText("Durante o in\u00edcio da fissura\u00e7\u00e3o:"));
  [
    "o concreto passa para Est\u00e1dio II;",
    "a in\u00e9rcia efetiva da se\u00e7\u00e3o \u00e9 reduzida;",
    "os modos verticais apresentam queda de frequ\u00eancia;",
    "danos ainda invis\u00edveis (<0,15 mm) j\u00e1 produzem respostas din\u00e2micas mensur\u00e1veis.",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(bodyText(
    "Esse comportamento j\u00e1 \u00e9 bem documentado em normas de projeto (como a NBR 6118 para abertura de fissuras e in\u00e9rcia fissurada) e em estudos sobre integridade de pontes."
  ));

  elements.push(subSubHeading("1.3.4 Rela\u00e7\u00e3o entre Abertura de Fissura e Varia\u00e7\u00e3o de Frequ\u00eancia"));
  elements.push(bodyText(
    "A tabela abaixo consolida valores representativos obtidos em an\u00e1lises t\u00e9cnicas de estruturas de concreto protendido, relacionando abertura de fissura, perda de in\u00e9rcia e varia\u00e7\u00e3o nas frequ\u00eancias naturais:"
  ));

  const colWFiss = [2256, 2257, 2257, 2256];
  elements.push(new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: colWFiss,
    rows: [
      new TableRow({
        children: [
          navyHeaderCell("Abertura da Fissura", colWFiss[0]),
          navyHeaderCell("Redu\u00e7\u00e3o da Rigidez/In\u00e9rcia", colWFiss[1]),
          navyHeaderCell("Varia\u00e7\u00e3o de Frequ\u00eancia", colWFiss[2]),
          navyHeaderCell("Visibilidade", colWFiss[3]),
        ],
      }),
      new TableRow({ children: [
        dataCell("0,10 mm", colWFiss[0], { align: AlignmentType.CENTER, bold: true }),
        dataCell("~98%", colWFiss[1], { align: AlignmentType.CENTER }),
        dataCell("~4%", colWFiss[2], { align: AlignmentType.CENTER }),
        dataCell("Invis\u00edvel", colWFiss[3], { align: AlignmentType.CENTER }),
      ]}),
      new TableRow({ children: [
        dataCell("0,15 mm", colWFiss[0], { align: AlignmentType.CENTER, bold: true }),
        dataCell("~72%", colWFiss[1], { align: AlignmentType.CENTER }),
        dataCell("~8%", colWFiss[2], { align: AlignmentType.CENTER }),
        dataCell("Limiar humano", colWFiss[3], { align: AlignmentType.CENTER }),
      ]}),
      new TableRow({ children: [
        dataCell("0,40 mm", colWFiss[0], { align: AlignmentType.CENTER, bold: true }),
        dataCell("~60%", colWFiss[1], { align: AlignmentType.CENTER }),
        dataCell("~25%", colWFiss[2], { align: AlignmentType.CENTER }),
        dataCell("Vis\u00edvel", colWFiss[3], { align: AlignmentType.CENTER }),
      ]}),
    ],
  }));
  elements.push(emptyLine());
  elements.push(bodyText("Esses valores mostram que:"));
  [
    "fissuras de 0,10 mm, completamente invis\u00edveis, j\u00e1 produzem ~4% de redu\u00e7\u00e3o de frequ\u00eancia;",
    "fissuras de 0,15 mm, no limite da percep\u00e7\u00e3o humana, produzem ~8%;",
    "fissuras vis\u00edveis (\u22480,4 mm) provocam redu\u00e7\u00f5es muito mais significativas.",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(bodyText(
    "Portanto, a OMA detecta altera\u00e7\u00f5es estruturais meses antes de qualquer evid\u00eancia visual, refor\u00e7ando o car\u00e1ter preditivo do SHM."
  ));

  elements.push(subSubHeading("1.3.5 Integra\u00e7\u00e3o das Medi\u00e7\u00f5es ao Modelo de Elementos Finitos"));
  elements.push(bodyText("A integra\u00e7\u00e3o das medi\u00e7\u00f5es ao Modelo de Elementos Finitos (MEF) permite:"));
  [
    "comparar continuamente o estado atual com o estado saud\u00e1vel e identificar o tipo do dano;",
    "quantificar a perda de rigidez associada \u00e0s varia\u00e7\u00f5es modais;",
    "calibrar o G\u00eameo Digital progressivamente com base no comportamento real;",
    "prever a evolu\u00e7\u00e3o do dano com base nas tend\u00eancias observadas.",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(bodyText(
    "Com isso, o monitoramento se torna n\u00e3o apenas uma ferramenta de detec\u00e7\u00e3o, mas uma ferramenta de diagn\u00f3stico preditivo."
  ));

  // 1.4 Benefícios Centrais
  elements.push(subHeading("1.4 Benef\u00edcios Centrais da Solu\u00e7\u00e3o"));
  elements.push(bodyText(
    "A integra\u00e7\u00e3o entre o Sistema de Monitoramento Estrutural Cont\u00ednuo e o G\u00eameo Digital oferece ganhos diretos e mensur\u00e1veis para a opera\u00e7\u00e3o, manuten\u00e7\u00e3o e gest\u00e3o de ativos de infraestrutura. Ao permitir o acompanhamento permanente das condi\u00e7\u00f5es estruturais e a interpreta\u00e7\u00e3o inteligente dos dados obtidos por sensores, a solu\u00e7\u00e3o proporciona uma mudan\u00e7a significativa na forma como a integridade de pontes e viadutos \u00e9 avaliada ao longo do tempo."
  ));

  elements.push(subSubHeading("1.4.1 Detec\u00e7\u00e3o Precoce (6\u201324 meses de anteced\u00eancia)"));
  elements.push(bodyText(
    "Pesquisas mostram que altera\u00e7\u00f5es estruturais surgem nas frequ\u00eancias naturais muito antes do aparecimento visual. Mesmo fissuras extremamente finas j\u00e1 provocam varia\u00e7\u00f5es de 4\u20138% nas frequ\u00eancias naturais, mas s\u00e3o invis\u00edveis ou no limite da visibilidade humana. Na pr\u00e1tica, isso cria uma janela cr\u00edtica de 6\u201324 meses para interven\u00e7\u00e3o preventiva."
  ));

  elements.push(subSubHeading("1.4.2 Redu\u00e7\u00e3o dr\u00e1stica dos custos de manuten\u00e7\u00e3o"));
  elements.push(bodyText(
    "Interven\u00e7\u00f5es emergenciais custam entre 5 e 10 vezes mais do que interven\u00e7\u00f5es planejadas, devido a mobiliza\u00e7\u00e3o imediata, interrup\u00e7\u00e3o de tr\u00e1fego e reparos mais extensos. Ao identificar danos em est\u00e1gio inicial, \u00e9 poss\u00edvel atuar precocemente e reduzir drasticamente a necessidade de a\u00e7\u00f5es corretivas urgentes."
  ));

  elements.push(subSubHeading("1.4.3 Extens\u00e3o da vida \u00fatil da estrutura"));
  elements.push(bodyText(
    "A identifica\u00e7\u00e3o de danos ainda em fase inicial permite interven\u00e7\u00f5es localizadas e de baixo impacto, retardando o avan\u00e7o da deteriora\u00e7\u00e3o e adiando reabilita\u00e7\u00f5es complexas e caras. Isso aumenta o ciclo de vida \u00fatil dos elementos estruturais, preserva a capacidade resistente original e reduz custos anualizados de manuten\u00e7\u00e3o e substitui\u00e7\u00e3o."
  ));

  elements.push(subSubHeading("1.4.4 Seguran\u00e7a ampliada"));
  elements.push(bodyText("Identifica\u00e7\u00e3o antecipada de:"));
  [
    "fissura\u00e7\u00e3o invis\u00edvel;",
    "degrada\u00e7\u00e3o de apoios;",
    "delamina\u00e7\u00f5es internas;",
    "perda de protens\u00e3o;",
    "altera\u00e7\u00f5es em juntas e liga\u00e7\u00f5es.",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(bodyText(
    "O SHM fornece um Perfil de Integridade Estrutural em tempo real, transformando o gerenciamento do risco de uma estimativa visual para um diagn\u00f3stico baseado em dados quantitativos e objetivos."
  ));

  elements.push(subSubHeading("1.4.5 Informa\u00e7\u00e3o objetiva e cont\u00ednua para tomada de decis\u00e3o"));
  elements.push(bodyText("O monitoramento 24/7 oferece dados audit\u00e1veis, eliminando subjetividade e permitindo:"));
  [
    "planejamento assertivo de manuten\u00e7\u00e3o;",
    "defini\u00e7\u00e3o de prioridades baseada em risco;",
    "resposta r\u00e1pida p\u00f3s-eventos extremos;",
    "redu\u00e7\u00e3o de incertezas e aumento de confiabilidade operacional, bem como nos casos de cargas especiais.",
  ].forEach((b) => elements.push(bullet(b)));

  elements.push(subSubHeading("1.4.6 Requalifica\u00e7\u00e3o de Trens-Tipo"));
  elements.push(bodyText(
    "O G\u00eameo Digital atua como uma base t\u00e9cnica consolidada para a requalifica\u00e7\u00e3o de Trens-Tipo (TB) das obras, permitindo que decis\u00f5es sejam fundamentadas em dados reais de comportamento estrutural, e n\u00e3o apenas em hip\u00f3teses de projeto ou an\u00e1lises pontuais."
  ));
  [
    "Avaliar a adequa\u00e7\u00e3o dos TB adotados com base em dados reais de comportamento;",
    "Orientar revis\u00f5es de capacidade de carga de forma segura e tecnicamente embasada;",
    "Priorizar interven\u00e7\u00f5es com base no comportamento estrutural real, n\u00e3o apenas em hip\u00f3teses;",
    "Apoiar estrat\u00e9gias de manuten\u00e7\u00e3o e gest\u00e3o de ativos de forma mais eficiente e transparente.",
  ].forEach((b) => elements.push(bullet(b)));

  // 1.5 Sensorização por Vão
  elements.push(subHeading("1.5 Sensoriza\u00e7\u00e3o por V\u00e3o"));
  elements.push(bodyText(
    "Para uma caracteriza\u00e7\u00e3o completa da integridade estrutural, ser\u00e1 instalada uma rede de sensores distribu\u00edda estrategicamente ao longo de cada v\u00e3o. O tipo de medi\u00e7\u00e3o em cada ponto ser\u00e1 definido conforme a fun\u00e7\u00e3o estrutural e a utilidade espec\u00edfica de cada sensor. A distribui\u00e7\u00e3o dos sensores considerada nessa proposta foi definida com base nos relat\u00f3rios de inspe\u00e7\u00f5es rotineiras enviadas."
  ));

  elements.push(subSubHeading("1.5.1 Distribui\u00e7\u00e3o dos Sensores (a confirmar ap\u00f3s visita t\u00e9cnica)"));
  elements.push(bodyText("As quantidades de sensores, postes, caixas de comando e demais componentes consideradas est\u00e3o detalhadas nas se\u00e7\u00f5es de Investimentos (6.1) e no Anexo 1. Para loca\u00e7\u00e3o estimada ver Anexo 1."));

  elements.push(subSubHeading("1.5.2 Justificativa T\u00e9cnica da Distribui\u00e7\u00e3o"));
  elements.push(bodyText("Essa topologia permite:"));
  [
    "reconstru\u00e7\u00e3o das frequ\u00eancias naturais associadas ao modo vertical dominante;",
    "detec\u00e7\u00e3o de danos locais e globais;",
    "identifica\u00e7\u00e3o de assimetrias entre vigas;",
    "alta resolutividade para diagn\u00f3stico de patologias incipientes;",
    "robustez contra ru\u00eddos e redund\u00e2ncia estrutural;",
    "sensibilidade \u00e0s regi\u00f5es cr\u00edticas onde a estrutura mais se altera.",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(bodyText("Essa configura\u00e7\u00e3o \u00e9 compat\u00edvel com metodologias de SHM utilizadas mundialmente."));

  // 1.6 Benefícios Operacionais, Financeiros e de Segurança
  elements.push(subHeading("1.6 Benef\u00edcios Operacionais, Financeiros e de Seguran\u00e7a"));
  elements.push(subSubHeading("Operacionais"));
  [
    "Redu\u00e7\u00e3o significativa de reparos emergenciais;",
    "Planejamento inteligente e antecipado de manuten\u00e7\u00e3o;",
    "Acompanhamento da recupera\u00e7\u00e3o do ativo ap\u00f3s passagem de cargas especiais;",
    "Tempo de obra muito menor devido \u00e0 precis\u00e3o do diagn\u00f3stico;",
    "Resposta r\u00e1pida p\u00f3s-eventos extremos (enchentes, impactos).",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(subSubHeading("Financeiros"));
  [
    "Redu\u00e7\u00e3o de 5 a 10 vezes no custo de interven\u00e7\u00f5es emergenciais;",
    "Extens\u00e3o da vida \u00fatil dos elementos estruturais;",
    "Otimiza\u00e7\u00e3o do CAPEX e OPEX;",
    "Base t\u00e9cnica consolidada para requalifica\u00e7\u00e3o de Trens-Tipo;",
    "Maior previsibilidade de gastos.",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(subSubHeading("Estrat\u00e9gicos"));
  [
    "Melhoria dos indicadores regulat\u00f3rios;",
    "Redu\u00e7\u00e3o de risco estrutural da concess\u00e3o;",
    "Aumento da confiabilidade da infraestrutura;",
    "Alinhamento a pr\u00e1ticas modernas de gest\u00e3o de ativos;",
    "Melhor decis\u00e3o para requalifica\u00e7\u00e3o dos ativos.",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(subSubHeading("De Governan\u00e7a (ESG)"));
  [
    "Dados transparentes e audit\u00e1veis;",
    "Redu\u00e7\u00e3o da pegada de carbono (menos deslocamentos para inspe\u00e7\u00e3o);",
    "Menos descarte de materiais devido \u00e0 menor necessidade de reparo pesado;",
    "Seguran\u00e7a aprimorada para toda a comunidade vi\u00e1ria.",
  ].forEach((b) => elements.push(bullet(b)));

  // ───────────────────────── 2. METODOLOGIA ─────────────────────────
  elements.push(new Paragraph({ children: [new PageBreak()] }));
  elements.push(sectionHeading("2. Metodologia e Plano de Trabalho"));
  elements.push(bodyText(
    "A metodologia adotada para implementa\u00e7\u00e3o do sistema foi estruturada em duas grandes etapas, apresentadas de forma separada apenas para facilitar a compreens\u00e3o do processo como um todo. A primeira etapa refere-se ao sistema de sensoriza\u00e7\u00e3o em campo, incluindo instala\u00e7\u00e3o, configura\u00e7\u00e3o e valida\u00e7\u00e3o dos m\u00f3dulos de medi\u00e7\u00e3o."
  ));
  elements.push(bodyText(
    "A segunda etapa aborda a modelagem digital da estrutura, envolvendo cria\u00e7\u00e3o, calibra\u00e7\u00e3o e integra\u00e7\u00e3o do G\u00eameo Digital. Embora descritas individualmente, ambas as etapas podem ocorrer em paralelo, garantindo efici\u00eancia no cronograma e permitindo que os dados coletados em campo alimentem o modelo digital ainda durante sua constru\u00e7\u00e3o."
  ));

  elements.push(subHeading("2.1 Sistema dos Sensores"));
  elements.push(bodyText(
    "A implanta\u00e7\u00e3o do Sistema de Monitoramento Estrutural Cont\u00ednuo depende de uma estrat\u00e9gia de sensoriza\u00e7\u00e3o tecnicamente planejada, capaz de captar com precis\u00e3o as respostas din\u00e2micas da estrutura ao longo do tempo. Para garantir a confiabilidade dos dados e a sensibilidade necess\u00e1ria \u00e0 detec\u00e7\u00e3o precoce de anomalias, o processo de instrumenta\u00e7\u00e3o segue uma sequ\u00eancia estruturada que envolve avalia\u00e7\u00e3o em campo, planejamento t\u00e9cnico, prepara\u00e7\u00e3o e configura\u00e7\u00e3o dedicada da instrumenta\u00e7\u00e3o, configura\u00e7\u00e3o da infraestrutura digital e valida\u00e7\u00e3o operacional em condi\u00e7\u00f5es reais."
  ));

  elements.push(subSubHeading("2.1.1 Visita T\u00e9cnica Inicial"));
  elements.push(bodyText(
    "A primeira fase envolve uma visita t\u00e9cnica detalhada \u00e0 estrutura, na qual s\u00e3o avaliadas as condi\u00e7\u00f5es gerais do local, os acessos, os pontos apropriados de instala\u00e7\u00e3o e poss\u00edveis restri\u00e7\u00f5es operacionais. Durante essa etapa, s\u00e3o identificados os elementos estruturais de maior relev\u00e2ncia para a capta\u00e7\u00e3o da resposta din\u00e2mica, como vigas longitudinais, transversinas, laje e apoios. Tamb\u00e9m \u00e9 realizada a verifica\u00e7\u00e3o da disponibilidade de energia e conectividade, al\u00e9m de aspectos essenciais, como pot\u00eancia e alcance, para o funcionamento do sistema."
  ));
  elements.push(bodyText(
    "Esse levantamento inicial permite definir o arranjo de instrumenta\u00e7\u00e3o e orientar o posicionamento ideal dos sensores ao longo dos v\u00e3os, garantindo sensibilidade adequada ao comportamento da estrutura e um projeto personalizado do ativo monitorado."
  ));

  elements.push(subSubHeading("2.1.2 Planejamento da Sensoriza\u00e7\u00e3o"));
  elements.push(bodyText(
    "Com base nas informa\u00e7\u00f5es obtidas em campo e nos dados retirados do projeto do ativo, \u00e9 elaborado o planejamento da sensoriza\u00e7\u00e3o, determinando a distribui\u00e7\u00e3o dos sensores, m\u00f3dulos eletr\u00f4nicos, pontos de alimenta\u00e7\u00e3o de energia e conectividade. Essa defini\u00e7\u00e3o \u00e9 conduzida considerando a sensibilidade estrutural, a simetria dos modos de vibra\u00e7\u00e3o, a necessidade de redund\u00e2ncia e a localiza\u00e7\u00e3o de regi\u00f5es cr\u00edticas onde se concentram esfor\u00e7os estruturais relevantes."
  ));
  elements.push(bodyText(
    "Caso a visita t\u00e9cnica revele condi\u00e7\u00f5es estruturais diferentes das previstas, restri\u00e7\u00f5es operacionais, limita\u00e7\u00f5es de acesso ou necessidades espec\u00edficas do cliente, o plano de sensoriza\u00e7\u00e3o \u00e9 refinado antes da instala\u00e7\u00e3o definitiva."
  ));

  elements.push(subSubHeading("2.1.3 Prepara\u00e7\u00e3o e Configura\u00e7\u00e3o da Instrumenta\u00e7\u00e3o"));
  elements.push(bodyText(
    "Cada unidade \u00e9 configurada de forma personalizada para atender \u00e0s caracter\u00edsticas operacionais do ativo monitorado, considerando aspectos como faixa de medi\u00e7\u00e3o, sensibilidade, robustez e requisitos ambientais do ativo. Nessa fase, s\u00e3o ajustados os firmwares, calibram-se componentes eletr\u00f4nicos, definem-se filtros digitais apropriados e cada unidade \u00e9 preparada para operar dentro das condi\u00e7\u00f5es estruturais observadas. Os sensores possuem classifica\u00e7\u00e3o de prote\u00e7\u00e3o IP65, sendo adequados para instala\u00e7\u00e3o em ambientes externos e expostos."
  ));

  elements.push(subSubHeading("2.1.3.1 Transmiss\u00e3o de Dados"));
  elements.push(bodyText(
    "A arquitetura de transmiss\u00e3o de dados adotada neste sistema ocorre da seguinte maneira: os sensores se comunicam via Wi-Fi com o banco de dados diretamente para a nuvem por meio do protocolo de comunica\u00e7\u00e3o adotado na infraestrutura local. Em caso de indisponibilidade de conex\u00e3o, os dados ficam armazenados localmente nos sensores individualmente, via cart\u00e3o SD. Assim que a conex\u00e3o \u00e9 restabelecida, o envio dos dados armazenados \u00e9 feito."
  ));

  elements.push(subSubHeading("2.1.3.2 C\u00e2meras e Anem\u00f4metros: Car\u00e1ter de Pesquisa"));
  elements.push(bodyText(
    "A instala\u00e7\u00e3o de c\u00e2meras e anem\u00f4metros para correla\u00e7\u00e3o de eventos excepcionais com o comportamento estrutural est\u00e1 prevista nesta proposta em car\u00e1ter exclusivamente de pesquisa e desenvolvimento. Esses equipamentos n\u00e3o integram o portf\u00f3lio comercial da proponente no momento, sendo sua incorpora\u00e7\u00e3o condicionada a acordo espec\u00edfico entre as partes e sujeita a discuss\u00e3o sobre responsabilidades, fornecimento e custeio."
  ));

  elements.push(subSubHeading("2.1.4 Adequa\u00e7\u00e3o e Configura\u00e7\u00e3o do Sistema e Banco de Dados"));
  elements.push(bodyText(
    "Conclu\u00edda a prepara\u00e7\u00e3o da instrumenta\u00e7\u00e3o, o sistema passa pela etapa de adequa\u00e7\u00e3o e configura\u00e7\u00e3o, na qual toda a infraestrutura digital \u00e9 preparada para receber, armazenar e interpretar os dados provenientes dos sensores. Essa fase envolve a cria\u00e7\u00e3o das cole\u00e7\u00f5es espec\u00edficas no banco de dados, o mapeamento dos dispositivos, a defini\u00e7\u00e3o de campos, estruturas de armazenamento e protocolos de envio, bem como a parametriza\u00e7\u00e3o das rotinas de processamento e an\u00e1lise."
  ));
  elements.push(bodyText(
    "Os dados coletados durante o contrato ser\u00e3o armazenados na infraestrutura da contratada e permanecer\u00e3o sob sua guarda ap\u00f3s o encerramento do contrato. N\u00e3o est\u00e1 prevista, nesta proposta, a transfer\u00eancia ou disponibiliza\u00e7\u00e3o do hist\u00f3rico de dados coletados \u00e0 contratante ao fim do v\u00ednculo contratual."
  ));

  elements.push(subSubHeading("2.1.5 Instala\u00e7\u00e3o e Valida\u00e7\u00e3o em Campo"));
  elements.push(bodyText(
    "Ap\u00f3s a prepara\u00e7\u00e3o dos sensores e da plataforma digital, inicia-se a instala\u00e7\u00e3o f\u00edsica no ativo monitorado. Os dispositivos s\u00e3o fixados nas posi\u00e7\u00f5es definidas no plano de sensoriza\u00e7\u00e3o, seguindo crit\u00e9rios de estabilidade, orienta\u00e7\u00e3o e m\u00ednima interfer\u00eancia com a opera\u00e7\u00e3o da ponte. A equipe realiza verifica\u00e7\u00f5es completas de alimenta\u00e7\u00e3o, comunica\u00e7\u00e3o, capta\u00e7\u00e3o de sinais e sincroniza\u00e7\u00e3o entre m\u00f3dulos."
  ));
  elements.push(bodyText(
    "Ap\u00f3s isso, uma prova de carga din\u00e2mica \u00e9 realizada, os resultados s\u00e3o armazenados e assim os limites s\u00e3o estabelecidos. Em seguida, conduz-se a valida\u00e7\u00e3o em campo, onde os dados iniciais de acelera\u00e7\u00e3o e frequ\u00eancia s\u00e3o analisados para confirmar que o sistema est\u00e1 operando de acordo com as especifica\u00e7\u00f5es estabelecidas."
  ));

  elements.push(subHeading("2.2 Modelagem \u2013 Parceria Casagrande Engenharia"));
  elements.push(bodyText(
    "Ser\u00e1 elaborada uma modelagem independente da OAE em um software de elementos finitos como CSI SAP 2000, CSI Bridge ou MIDAS. Essa modelagem ser\u00e1 realizada seguindo padr\u00f5es normativos de carga e ser\u00e1 baseada no projeto da OAE existente, na inspe\u00e7\u00e3o especial e em todo e qualquer ensaio j\u00e1 realizado na OAE, de forma a gerar um modelo te\u00f3rico que conhe\u00e7a o hist\u00f3rico da OAE e represente seu funcionamento para diferentes casos de carga e condi\u00e7\u00f5es de contorno."
  ));

  elements.push(subHeading("2.3 Modelo BIM \u2013 Parceria Casagrande Engenharia"));
  elements.push(bodyText(
    "Ser\u00e1 desenvolvido, no software Revit, um modelo BIM da OAE existente, abrangendo todos os elementos estruturais como infraestrutura, mesoestrutura e superestrutura, com a incorpora\u00e7\u00e3o de informa\u00e7\u00f5es n\u00e3o gr\u00e1ficas essenciais \u00e0 an\u00e1lise da obra. As leituras dos dados de campo ser\u00e3o integradas diretamente ao modelo BIM, garantindo que este se mantenha continuamente compatibilizado com todas as informa\u00e7\u00f5es captadas pelos sensores e permitindo a identifica\u00e7\u00e3o preditiva de eventuais patologias antes de sua manifesta\u00e7\u00e3o efetiva."
  ));

  elements.push(subSubHeading("2.3.1 Cria\u00e7\u00e3o do modelo digital \u2013 Parceria Casagrande Engenharia"));
  elements.push(bodyText(
    "O modelo computacional independente da OAE ser\u00e1 utilizado como refer\u00eancia de um modelo digital da obra existente, de modo a equiparar a OAE \u00e0s condi\u00e7\u00f5es que a obra existente sofre, como temperatura, passagem de ve\u00edculos e pessoas, ventos, colis\u00f5es ou toda e qualquer interfer\u00eancia cab\u00edvel em norma."
  ));

  elements.push(subSubHeading("2.3.2 Prova de carga"));
  elements.push(bodyText(
    "A realiza\u00e7\u00e3o de carga din\u00e2mica se baseia na utiliza\u00e7\u00e3o de um caminh\u00e3o, com peso previamente determinado, a ser deslocado pela OAE, de forma que possa se realizar uma avalia\u00e7\u00e3o dos deslocamentos obtidos com os sensores na estrutura. A contrata\u00e7\u00e3o e log\u00edstica do caminh\u00e3o est\u00e3o a cargo da contratante."
  ));

  elements.push(subSubHeading("2.3.3 Calibra\u00e7\u00e3o do modelo"));
  elements.push(bodyText(
    "A etapa de calibra\u00e7\u00e3o consiste no ajuste progressivo do Modelo de Elementos Finitos e do G\u00eameo Digital a partir dos dados reais obtidos pelo sistema de monitoramento e pela An\u00e1lise Modal Operacional (OMA). Por meio da compara\u00e7\u00e3o entre as frequ\u00eancias naturais, modos de vibra\u00e7\u00e3o e demais par\u00e2metros din\u00e2micos medidos em campo e aqueles previstos pelo modelo te\u00f3rico, s\u00e3o refinados par\u00e2metros de rigidez, in\u00e9rcia efetiva, condi\u00e7\u00f5es de contorno e caracter\u00edsticas dos elementos estruturais."
  ));

  // ───────────────────────── 3. RESPONSABILIDADE DO CONTRATANTE ─────────────────────────
  elements.push(new Paragraph({ children: [new PageBreak()] }));
  elements.push(sectionHeading("3. Itens de Responsabilidade do Contratante"));
  elements.push(bodyText(
    "A correta implanta\u00e7\u00e3o e opera\u00e7\u00e3o do sistema de Monitoramento Estrutural Cont\u00ednuo (SHM) e do G\u00eameo Digital depende da colabora\u00e7\u00e3o direta do cliente em uma s\u00e9rie de aspectos operacionais, log\u00edsticos e informacionais."
  ));

  elements.push(subHeading("3.1 Acesso \u00e0 Estrutura e Condi\u00e7\u00f5es de Trabalho"));
  elements.push(bodyText(
    "O cliente deve assegurar acesso integral aos locais onde os sensores ser\u00e3o instalados, incluindo v\u00e3os, salas t\u00e9cnicas e \u00e1reas restritas quando aplic\u00e1vel. Isso inclui a emiss\u00e3o de autoriza\u00e7\u00f5es formais, organiza\u00e7\u00e3o de escoltas ou bloqueios de pista (quando necess\u00e1rio) e garantia de condi\u00e7\u00f5es adequadas de seguran\u00e7a para a equipe t\u00e9cnica, com montagem de plataforma de acesso ou caminh\u00f5es Munck que tenham bra\u00e7os que levem \u00e0 face inferior da viga."
  ));
  elements.push(bodyText(
    "O cliente \u00e9 respons\u00e1vel por comunicar previamente quaisquer restri\u00e7\u00f5es de hor\u00e1rio, normas operacionais internas, regras de circula\u00e7\u00e3o em \u00e1rea concessionada e protocolos espec\u00edficos de seguran\u00e7a ou EPI obrigat\u00f3rios."
  ));

  elements.push(subHeading("3.2 Disponibiliza\u00e7\u00e3o de Infraestrutura de Energia"));
  elements.push(bodyText(
    "A infraestrutura necess\u00e1ria para a alimenta\u00e7\u00e3o do sistema, como o poste para instala\u00e7\u00e3o da caixa de comando e do painel solar, ser\u00e1 de responsabilidade do contratante. Compete ainda ao contratante a aquisi\u00e7\u00e3o e instala\u00e7\u00e3o do poste destinado \u00e0 caixa de comando e ao painel solar, bem como a pr\u00f3pria instala\u00e7\u00e3o da caixa de comando e do painel solar no local definido pelo projeto."
  ));

  elements.push(subHeading("3.3 Fornecimento de Documenta\u00e7\u00e3o Estrutural e Hist\u00f3ricos"));
  elements.push(bodyText("O cliente deve fornecer todos os documentos t\u00e9cnicos dispon\u00edveis sobre a estrutura, tais como:"));
  [
    "projetos executivos de constru\u00e7\u00e3o e memoriais de c\u00e1lculo;",
    "plantas estruturais;",
    "relat\u00f3rios de inspe\u00e7\u00e3o anteriores;",
    "registros de interven\u00e7\u00f5es, refor\u00e7os e reparos;",
    "hist\u00f3rico de manuten\u00e7\u00e3o, patologias e monitoramentos anteriores;",
    "cadastros geom\u00e9tricos.",
  ].forEach((b) => elements.push(bullet(b)));

  elements.push(subHeading("3.4 Apoio Operacional e Log\u00edstico"));
  elements.push(bodyText(
    "Durante as fases de visita t\u00e9cnica, instala\u00e7\u00e3o, testes e valida\u00e7\u00e3o, o cliente deve disponibilizar suporte log\u00edstico para a equipe, facilitando acesso, deslocamento interno, acompanhamento operacional e fornecimento de informa\u00e7\u00f5es necess\u00e1rias ao andamento das atividades."
  ));
  elements.push(bodyText(
    "A execu\u00e7\u00e3o das atividades de instala\u00e7\u00e3o f\u00edsica dos sensores e da infraestrutura associada ser\u00e1 realizada pela contratante, sob supervis\u00e3o t\u00e9cnica e orienta\u00e7\u00e3o da contratada. O fornecimento e a instala\u00e7\u00e3o de c\u00e2meras e da infraestrutura associada ser\u00e3o de responsabilidade do contratante. A responsabilidade pela realiza\u00e7\u00e3o da prova de carga, incluindo mobiliza\u00e7\u00e3o e atividades correlatas, caber\u00e1 \u00e0 contratante."
  ));

  elements.push(subHeading("3.5 Comunica\u00e7\u00e3o de Eventos e Altera\u00e7\u00f5es na Estrutura"));
  elements.push(bodyText("Durante a opera\u00e7\u00e3o cont\u00ednua do sistema, o cliente \u00e9 respons\u00e1vel por comunicar \u00e0 equipe de monitoramento qualquer evento que possa impactar os dados coletados ou a integridade da estrutura, tais como:"));
  [
    "interven\u00e7\u00f5es programadas;",
    "obras de manuten\u00e7\u00e3o;",
    "substitui\u00e7\u00f5es de elementos estruturais;",
    "incid\u00eancia de cargas excepcionais;",
    "impactos, acidentes ou eventos ambientais extremos.",
  ].forEach((b) => elements.push(bullet(b)));

  elements.push(subHeading("3.6 Manuten\u00e7\u00e3o de Canais de Comunica\u00e7\u00e3o e Autoriza\u00e7\u00e3o de Atividades"));
  elements.push(bodyText(
    "O cliente deve manter canais de comunica\u00e7\u00e3o ativos com a equipe respons\u00e1vel pelo monitoramento, aprovando agendamentos, autoriza\u00e7\u00f5es de acesso e ajustes operacionais. Essa responsabilidade abrange tamb\u00e9m a comunica\u00e7\u00e3o sobre mudan\u00e7as internas que possam impactar o funcionamento do sistema."
  ));

  elements.push(subHeading("3.7 Seguro da Infraestrutura"));
  elements.push(bodyText(
    "O projeto ser\u00e1 realizado com a ado\u00e7\u00e3o das medidas antivandalismo necess\u00e1rias, compat\u00edveis com as condi\u00e7\u00f5es dos locais de instala\u00e7\u00e3o e os requisitos do sistema. A responsabilidade pelo seguro dos equipamentos e da infraestrutura instalados ser\u00e1 da contratante, estando estes cobertos pela ap\u00f3lice de seguros dos ativos da rodovia."
  ));

  // ───────────────────────── 4. RESPONSABILIDADE DA CONTRATADA ─────────────────────────
  elements.push(new Paragraph({ children: [new PageBreak()] }));
  elements.push(sectionHeading("4. Itens de Responsabilidade da Contratada"));

  elements.push(subHeading("4.1 Fornecimento de Materiais"));
  elements.push(bodyText(
    "A contratada ser\u00e1 respons\u00e1vel pelo fornecimento dos elementos de infraestrutura necess\u00e1rios \u00e0 alimenta\u00e7\u00e3o el\u00e9trica do sistema de monitoramento, incluindo condu\u00edtes, caixas e a fia\u00e7\u00e3o a ser interligada aos sensores, pain\u00e9is, roteadores e demais dispositivos associados. Al\u00e9m disso, a contratada ser\u00e1 respons\u00e1vel pelo fornecimento dos sensores, roteadores Wi-Fi, painel solar e caixa de comando necess\u00e1rios ao pleno funcionamento do sistema."
  ));

  elements.push(subHeading("4.2 Projetos, Especifica\u00e7\u00f5es T\u00e9cnicas e Diretrizes de Instala\u00e7\u00e3o"));
  elements.push(bodyText(
    "A contratada ser\u00e1 respons\u00e1vel pela elabora\u00e7\u00e3o dos projetos, especifica\u00e7\u00f5es t\u00e9cnicas, orienta\u00e7\u00f5es e diretrizes necess\u00e1rias para a correta instala\u00e7\u00e3o, integra\u00e7\u00e3o e opera\u00e7\u00e3o da infraestrutura de energia e conectividade."
  ));

  elements.push(subHeading("4.3 Suporte T\u00e9cnico e Acompanhamento"));
  elements.push(bodyText(
    "A contratada prestar\u00e1 suporte t\u00e9cnico durante as etapas de instala\u00e7\u00e3o, testes e valida\u00e7\u00e3o do sistema, incluindo esclarecimento de d\u00favidas, orienta\u00e7\u00f5es operacionais e acompanhamento t\u00e9cnico das atividades."
  ));

  elements.push(subHeading("4.4 Acompanhamento Mensal"));
  elements.push(bodyText(
    "A contratada realizar\u00e1 o acompanhamento mensal do sistema de monitoramento, incluindo a verifica\u00e7\u00e3o do funcionamento dos sensores, an\u00e1lise preliminar da integridade dos dados adquiridos, avalia\u00e7\u00e3o do desempenho da comunica\u00e7\u00e3o e identifica\u00e7\u00e3o de eventuais anomalias operacionais. O contrato inicial prev\u00ea um per\u00edodo de monitoramento de 24 (vinte e quatro) meses, contados a partir da data de entrada em opera\u00e7\u00e3o do sistema."
  ));

  elements.push(subHeading("4.5 Aux\u00edlio na Navega\u00e7\u00e3o do Sistema (Dashboard)"));
  elements.push(bodyText(
    "A contratada prestar\u00e1 aux\u00edlio t\u00e9cnico \u00e0 contratante para a correta navega\u00e7\u00e3o e utiliza\u00e7\u00e3o do sistema de visualiza\u00e7\u00e3o e an\u00e1lise de dados (dashboard), incluindo orienta\u00e7\u00f5es sobre interpreta\u00e7\u00e3o das informa\u00e7\u00f5es apresentadas, acesso \u00e0s funcionalidades dispon\u00edveis e esclarecimento de d\u00favidas relacionadas ao uso da plataforma."
  ));

  // ───────────────────────── 5. CRONOGRAMA ─────────────────────────
  elements.push(sectionHeading("5. Cronograma"));
  elements.push(bodyText("A combinar com mobiliza\u00e7\u00e3o imediata."));

  return elements;
}

// ── Anexo 1 ──
function buildAnexo(): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  elements.push(new Paragraph({ children: [new PageBreak()] }));
  elements.push(sectionHeading("Anexo 1 \u2013 Distribui\u00e7\u00e3o dos Equipamentos"));
  elements.push(bodyText(
    "A loca\u00e7\u00e3o estimada de sensores, postes, caixa de comando, painel solar e roteador Wi-Fi por v\u00e3o segue o padr\u00e3o ilustrado abaixo. As posi\u00e7\u00f5es finais ser\u00e3o confirmadas ap\u00f3s a visita t\u00e9cnica."
  ));
  elements.push(emptyLine());
  elements.push(bodyText("Refer\u00eancia de orienta\u00e7\u00f5es: LESTE \u2013 NORTE \u2013 SUL \u2013 OESTE.", { bold: true }));
  elements.push(emptyLine());
  elements.push(bodyText("Componentes por v\u00e3o (refer\u00eancia):"));
  [
    "Painel solar e caixa de comando \u2013 posicionados em poste pr\u00f3ximo \u00e0 estrutura;",
    "Conjunto de sensores \u2013 4 de frequ\u00eancia e 4 de temperatura por v\u00e3o (refer\u00eancia);",
    "Roteador Wi-Fi \u2013 instalado pr\u00f3ximo \u00e0 caixa de comando.",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(emptyLine());
  elements.push(bodyText("Figura 01 \u2013 Distribui\u00e7\u00e3o esquem\u00e1tica dos equipamentos (a confirmar em campo)."));
  return elements;
}


// ── Section 6 - Investimentos ──
function buildInvestmentSection(
  summary: BudgetSummary,
  bridges: BridgeSpan[] = [],
  components: ComponentItem[] = []
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // Fator de markup: aplica BDI + impostos nos valores exibidos ao cliente
  const markupFactor = 1 + summary.bdiRate + summary.taxRate;
  const priceOf = (id: string) => components.find((c) => c.id === id)?.unitPrice ?? 0;

  elements.push(new Paragraph({ children: [new PageBreak()] }));
  elements.push(sectionHeading("6. Investimentos"));

  // 6.1 Equipamentos (já com BDI + impostos embutidos)
  elements.push(subHeading("6.1 Equipamentos:"));

  // Quantidades agregadas
  const totalSensors = bridges.reduce((s, b) => s + (b.sensorCount || 0), 0);
  const totalSpans = bridges.reduce((s, b) => s + (b.spanCount || 0), 0);

  // Valores por categoria (com BDI + impostos)
  const sensorsValue = summary.bridgeCosts.reduce((s, bc) => s + bc.sensors, 0) * markupFactor;
  const connectivityValue = summary.bridgeCosts.reduce((s, bc) => s + bc.connectivity, 0) * markupFactor;
  const commandBoxValue = summary.bridgeCosts.reduce((s, bc) => s + bc.commandBox, 0) * markupFactor;
  const energyValue = summary.bridgeCosts.reduce((s, bc) => s + bc.energy, 0) * markupFactor;
  const infraValue = summary.bridgeCosts.reduce((s, bc) => s + bc.infrastructure, 0) * markupFactor;
  const totalEquipment = sensorsValue + connectivityValue + commandBoxValue + energyValue + infraValue;

  // Sub-itens de Conectividade (kits Completa / Parcial)
  const completaKits = bridges
    .filter((b) => b.connectivity === "Completa")
    .reduce((s, b) => s + (b.connectivityKitCount || 0), 0);
  const parcialKits = bridges
    .filter((b) => b.connectivity === "Parcial")
    .reduce((s, b) => s + (b.connectivityKitCount || 0), 0);
  const completaValue = priceOf("CON1") * completaKits * markupFactor;
  const parcialValue = priceOf("CON2") * parcialKits * markupFactor;

  // Sub-itens de Energia (Solar / Rede)
  const solarKits = bridges
    .filter((b) => b.energySource === "Solar")
    .reduce((s, b) => s + (b.solarKitCount || 1), 0);
  const redeKits = bridges.filter((b) => b.energySource === "Rede").length;
  const solarValue = priceOf("SOL-KIT") * solarKits * markupFactor;
  const redeValue = priceOf("REDE") * redeKits * markupFactor;

  elements.push(bodyText(
    `Considera-se a instala\u00e7\u00e3o de 2 sensores por viga, sendo 1 sensor principal e 1 sensor de backup, garantindo a continuidade do monitoramento em caso de falha do sensor principal. Total de ${totalSensors} sensores distribu\u00eddos em ${totalSpans} v\u00e3o(s).`
  ));
  elements.push(emptyLine());
  elements.push(bodyText(
    "A Conectividade contempla, para cada ponto de comunica\u00e7\u00e3o, kit composto por roteador e modem; nas conex\u00f5es do tipo Completa, inclui tamb\u00e9m chip de celular para transmiss\u00e3o dos dados via rede m\u00f3vel."
  ));
  elements.push(bodyText(
    "A Energia \u00e9 fornecida via Kit Solar Completo (painel fotovoltaico 435 W, controlador MPPT 20 A, bateria estacion\u00e1ria 200 Ah, conectores e acess\u00f3rios) ou via Kit Rede El\u00e9trica (alimenta\u00e7\u00e3o a partir da rede existente da OAE, com conversor AC/DC), conforme a infraestrutura dispon\u00edvel em cada ponte."
  ));
  elements.push(emptyLine());

  const rows: TableRow[] = [
    new TableRow({
      children: [
        navyHeaderCell("Item", 3760),
        navyHeaderCell("Quantidade", 1880),
        navyHeaderCell("Valor", 3386),
      ],
    }),
    new TableRow({
      children: [
        dataCell("Sensores", 3760),
        dataCell(`${totalSensors} un.`, 1880, { align: AlignmentType.CENTER }),
        dataCell(formatCurrency(sensorsValue), 3386, { align: AlignmentType.RIGHT }),
      ],
    }),
    // Conectividade (subtotal + sub-itens)
    new TableRow({
      children: [
        dataCell("Conectividade", 3760, { bold: true }),
        dataCell("\u2014", 1880, { align: AlignmentType.CENTER }),
        dataCell(formatCurrency(connectivityValue), 3386, { align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
  ];

  if (completaKits > 0) {
    rows.push(new TableRow({
      children: [
        dataCell("    Kit Conex\u00e3o Completa (roteador + modem + chip)", 3760),
        dataCell(`${completaKits} un.`, 1880, { align: AlignmentType.CENTER }),
        dataCell(formatCurrency(completaValue), 3386, { align: AlignmentType.RIGHT }),
      ],
    }));
  }
  if (parcialKits > 0) {
    rows.push(new TableRow({
      children: [
        dataCell("    Kit Conex\u00e3o Parcial (roteador + modem)", 3760),
        dataCell(`${parcialKits} un.`, 1880, { align: AlignmentType.CENTER }),
        dataCell(formatCurrency(parcialValue), 3386, { align: AlignmentType.RIGHT }),
      ],
    }));
  }

  rows.push(new TableRow({
    children: [
      dataCell("Caixa de Comando", 3760),
      dataCell("\u2014", 1880, { align: AlignmentType.CENTER }),
      dataCell(formatCurrency(commandBoxValue), 3386, { align: AlignmentType.RIGHT }),
    ],
  }));

  // Energia (subtotal + sub-itens)
  rows.push(new TableRow({
    children: [
      dataCell("Energia", 3760, { bold: true }),
      dataCell("\u2014", 1880, { align: AlignmentType.CENTER }),
      dataCell(formatCurrency(energyValue), 3386, { align: AlignmentType.RIGHT, bold: true }),
    ],
  }));
  if (solarKits > 0) {
    rows.push(new TableRow({
      children: [
        dataCell("    Kit Solar Completo (painel 435 W, MPPT, bateria 200 Ah)", 3760),
        dataCell(`${solarKits} un.`, 1880, { align: AlignmentType.CENTER }),
        dataCell(formatCurrency(solarValue), 3386, { align: AlignmentType.RIGHT }),
      ],
    }));
  }
  if (redeKits > 0) {
    rows.push(new TableRow({
      children: [
        dataCell("    Kit Rede El\u00e9trica (alimenta\u00e7\u00e3o pela rede + conversor AC/DC)", 3760),
        dataCell(`${redeKits} un.`, 1880, { align: AlignmentType.CENTER }),
        dataCell(formatCurrency(redeValue), 3386, { align: AlignmentType.RIGHT }),
      ],
    }));
  }

  rows.push(new TableRow({
    children: [
      dataCell("Infraestrutura (eletrodutos, cabos, caixas)", 3760),
      dataCell("\u2014", 1880, { align: AlignmentType.CENTER }),
      dataCell(formatCurrency(infraValue), 3386, { align: AlignmentType.RIGHT }),
    ],
  }));
  rows.push(new TableRow({
    children: [
      dataCell("TOTAL", 3760, { bold: true }),
      dataCell("", 1880),
      dataCell(formatCurrency(totalEquipment), 3386, { align: AlignmentType.RIGHT, bold: true }),
    ],
  }));

  elements.push(
    new Table({
      width: { size: TW, type: WidthType.DXA },
      columnWidths: [3760, 1880, 3386],
      rows,
    })
  );

  elements.push(emptyLine());
  elements.push(bodyText(
    `Valor de equipamentos: ${formatCurrency(totalEquipment)} (${numberToWords(totalEquipment)});`,
    { bold: true }
  ));

  // 6.2 Engenharia e Modelagem
  elements.push(subHeading("6.2 Engenharia e Modelagem:"));

  const totalModeling = summary.bridgeCosts.reduce((sum, bc) => sum + bc.modelingEngineering, 0) * markupFactor;

  elements.push(
    new Table({
      width: { size: TW, type: WidthType.DXA },
      columnWidths: [4513, 4513],
      rows: [
        new TableRow({
          children: [
            navyHeaderCell("", 4513),
            navyHeaderCell("Custos Modelagem, Simula\u00e7\u00e3o e Adequa\u00e7\u00e3o de Banco de Dados", 4513),
          ],
        }),
        new TableRow({
          children: [
            dataCell("TOTAL", 4513, { bold: true }),
            dataCell(formatCurrency(totalModeling), 4513, { align: AlignmentType.RIGHT, bold: true }),
          ],
        }),
      ],
    })
  );

  elements.push(emptyLine());
  elements.push(bodyText(
    `Valor para Modelagem BIM, OMA, MEF e adequa\u00e7\u00e3o de banco dados: ${formatCurrency(totalModeling)} (${numberToWords(totalModeling)});`,
    { bold: true }
  ));

  // 6.3 Resumo
  elements.push(subHeading("6.3 Resumo"));

  // 6.3.1 Pacote CAPEX
  elements.push(new Paragraph({
    spacing: { before: 150, after: 80 },
    children: [new TextRun({ text: "6.3.1 Pacote CAPEX:", bold: true, font: "Calibri", size: 20, color: NAVY })],
  }));

  const proposalValue = summary.proposalValue;
  const colW = [2256, 2257, 2257, 2256];

  elements.push(
    new Table({
      width: { size: TW, type: WidthType.DXA },
      columnWidths: colW,
      rows: [
        new TableRow({
          children: [
            navyHeaderCell("", colW[0]),
            navyHeaderCell("Sensores, Conectividade e Infra", colW[1]),
            navyHeaderCell("Custos Modelagem, Simula\u00e7\u00e3o e Adequa\u00e7\u00e3o de Banco de Dados", colW[2]),
            navyHeaderCell("TOTAL GERAL", colW[3]),
          ],
        }),
        new TableRow({
          children: [
            dataCell("TOTAL", colW[0], { bold: true }),
            dataCell(formatCurrency(totalEquipment), colW[1], { align: AlignmentType.RIGHT }),
            dataCell(formatCurrency(totalModeling), colW[2], { align: AlignmentType.RIGHT }),
            dataCell(formatCurrency(proposalValue), colW[3], { align: AlignmentType.RIGHT, bold: true }),
          ],
        }),
      ],
    })
  );

  elements.push(emptyLine());
  if (summary.thirdPartyTotal > 0) {
    elements.push(bodyText(
      `Inclui ${formatCurrency(summary.thirdPartyTotal)} referentes a infraestrutura executada por terceiros, repassados como custo direto, sem incid\u00eancia de BDI ou impostos.`
    ));
  }
  elements.push(bodyText(
    `Valor Total CAPEX: ${formatCurrency(proposalValue)} (${numberToWords(proposalValue)}).`,
    { bold: true }
  ));

  // 6.3.2 Acompanhamento Mensal
  elements.push(new Paragraph({
    spacing: { before: 150, after: 80 },
    children: [new TextRun({ text: "6.3.2 Acompanhamento Mensal:", bold: true, font: "Calibri", size: 20, color: NAVY })],
  }));

  elements.push(bodyText(
    `Valor Acompanhamento Mensal: ${formatCurrency(summary.monthlyAccompaniment)} (${numberToWords(summary.monthlyAccompaniment)}).`,
    { bold: true }
  ));

  return elements;
}

// ── 6.4 Descrição dos Serviços de Terceiros ──
interface ThirdPartyLine {
  bridgeName: string;
  componentId: string;
  description: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

function collectThirdPartyLines(
  bridges: BridgeSpan[],
  globalExtraItems: ExtraItem[],
  components: ComponentItem[]
): ThirdPartyLine[] {
  const lines: ThirdPartyLine[] = [];

  const pushFrom = (extras: ExtraItem[] | undefined, bridgeName: string) => {
    if (!extras) return;
    extras.forEach((e) => {
      const comp = components.find((c) => c.id === e.componentId);
      if (!comp || comp.category !== THIRD_PARTY_CATEGORY) return;
      lines.push({
        bridgeName,
        componentId: comp.id,
        description: comp.name,
        unit: comp.unit,
        qty: e.qty,
        unitPrice: comp.unitPrice,
        total: comp.unitPrice * e.qty,
        notes: comp.notes,
      });
    });
  };

  bridges.forEach((b) => pushFrom(b.extraItems, b.name));
  pushFrom(globalExtraItems, "Global (todas as OAEs)");

  return lines;
}

function buildThirdPartySection(
  summary: BudgetSummary,
  bridges: BridgeSpan[],
  globalExtraItems: ExtraItem[],
  components: ComponentItem[]
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const lines = collectThirdPartyLines(bridges, globalExtraItems, components);

  if (lines.length === 0) return elements;

  elements.push(subHeading("6.4 Servi\u00e7os de Terceiros:"));

  elements.push(
    new Table({
      width: { size: TW, type: WidthType.DXA },
      columnWidths: [4513, 4513],
      rows: [
        new TableRow({
          children: [
            navyHeaderCell("", 4513),
            navyHeaderCell("Servi\u00e7os de Terceiros", 4513),
          ],
        }),
        new TableRow({
          children: [
            dataCell("TOTAL", 4513, { bold: true }),
            dataCell(formatCurrency(summary.thirdPartyTotal), 4513, { align: AlignmentType.RIGHT, bold: true }),
          ],
        }),
      ],
    })
  );

  elements.push(emptyLine());
  elements.push(bodyText(
    `Valor de servi\u00e7os de terceiros: ${formatCurrency(summary.thirdPartyTotal)} (${numberToWords(summary.thirdPartyTotal)});`,
    { bold: true }
  ));

  return elements;
}

// ── Sections 7-9 ──
function buildClosingSections(): Paragraph[] {
  const elements: Paragraph[] = [];

  elements.push(new Paragraph({ children: [new PageBreak()] }));

  // 7. Dados da Contratada
  elements.push(sectionHeading("7. Dados da Contratada:"));

  elements.push(subHeading("SORALAB"));
  elements.push(bodyText("Raz\u00e3o Social: SORALAB SENSORES LTDA"));
  elements.push(bodyText("CNPJ: 61.297.168/0001-03"));
  elements.push(bodyText("Endere\u00e7o: Rua do Passeio, 70 \u2013 10\u00ba andar \u2013 Centro \u2013 Rio de Janeiro"));
  elements.push(bodyText("CEP: 20021-290"));

  elements.push(subHeading("D2WIN"));
  elements.push(bodyText("Raz\u00e3o Social: D2WIN SERVICOS DE TECNOLOGIA S.A."));
  elements.push(bodyText("CNPJ: 61.678.357/0001-18"));
  elements.push(bodyText("Endere\u00e7o: Rua do Passeio, 70 \u2013 10\u00ba andar \u2013 Centro \u2013 Rio de Janeiro"));
  elements.push(bodyText("CEP: 20021-290"));

  elements.push(subHeading("CASAGRANDE ENGENHARIA:"));
  elements.push(bodyText("Raz\u00e3o Social: JLA Casagrande Servi\u00e7os e Consultoria de Engenharia Ltda."));
  elements.push(bodyText("CNPJ: 06.080.665/0002-10"));
  elements.push(bodyText("Endere\u00e7o: Rua do Passeio, 70 \u2013 10\u00ba andar \u2013 Centro \u2013 Rio de Janeiro"));
  elements.push(bodyText("CEP: 20021-290"));

  // 8. Validade
  elements.push(sectionHeading("8. Validade da Proposta"));
  elements.push(bodyText(
    "Esta proposta comercial \u00e9 v\u00e1lida por 60 dias corridos a contar da data de sua emiss\u00e3o. Ap\u00f3s esse per\u00edodo, valores, prazos e condi\u00e7\u00f5es poder\u00e3o ser revistos em fun\u00e7\u00e3o de varia\u00e7\u00f5es de custos, disponibilidade de equipamentos e altera\u00e7\u00f5es de escopo."
  ));

  // 9. De Acordo
  elements.push(sectionHeading("9. De Acordo"));

  elements.push(new Paragraph({ children: [new PageBreak()] }));

  elements.push(bodyText(
    'Os servi\u00e7os ser\u00e3o iniciados, ap\u00f3s a "AUTORIZA\u00c7\u00c3O FORMAL DO CLIENTE". Este evento ser\u00e1 caracterizado pela Autoriza\u00e7\u00e3o Formal de In\u00edcio dos Servi\u00e7os, que poder\u00e1 ser feita com a assinatura no "DE ACORDO", colocado no final desta Proposta ou por e-mail aprovando o in\u00edcio dos servi\u00e7os. Adicionalmente os prazos s\u00f3 poder\u00e3o ser computados com a disponibiliza\u00e7\u00e3o de todos os documentos t\u00e9cnicos requeridos. Estes eventos devem ser atendidos em conjunto, para efeito de Autoriza\u00e7\u00e3o Inicial dos Servi\u00e7os.'
  ));

  elements.push(emptyLine());
  elements.push(emptyLine());
  elements.push(emptyLine());
  elements.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [new TextRun({ text: "____________________________________________", font: "Calibri", size: 20 })],
    })
  );
  elements.push(bodyText("Assinatura do Respons\u00e1vel"));
  elements.push(emptyLine());
  elements.push(emptyLine());
  elements.push(
    new Paragraph({
      children: [new TextRun({ text: "____________________________________________", font: "Calibri", size: 20 })],
    })
  );
  elements.push(bodyText("Data de Aprova\u00e7\u00e3o"));

  return elements;
}

// ── Main export ──
export async function generateBudgetDocx(
  summary: BudgetSummary,
  clientName?: string,
  bridges: BridgeSpan[] = [],
  globalExtraItems: ExtraItem[] = [],
  components: ComponentItem[] = []
) {
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
          run: { font: "Calibri", size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: { default: createHeader() },
        footers: { default: createFooter() },
        children: [
          ...buildCoverPage(summary, clientName),
          ...buildFixedSections(),
          ...(buildInvestmentSection(summary, bridges, components) as any[]),
          ...(buildThirdPartySection(summary, bridges, globalExtraItems, components) as any[]),
          ...buildClosingSections(),
        ] as any[],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Proposta_Comercial_${clientName || "OAE"}.docx`);
}
