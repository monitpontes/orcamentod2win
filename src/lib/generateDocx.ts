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

  const logoHeight = 45;
  const d2winW = Math.round(logoHeight * (103 / 100));
  const casagrandeW = Math.round(logoHeight * (249 / 85));

  return new Header({
    children: [
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4513, 4513],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 4513, type: WidthType.DXA },
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
                width: { size: 4513, type: WidthType.DXA },
                borders: noBorders,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
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
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 200, after: 240 },
      children: [
        new TextRun({
          text: "Proposta Comercial: Monitoramento Estrutural Cont\u00ednuo e G\u00eameos Digitais",
          bold: true,
          font: "Calibri",
          size: 32,
          color: NAVY,
        }),
      ],
    }),
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

  // OAE table - first row navy header (no text), then bridge names
  const oaeRows = bridgeNames.map((name) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: TW, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: name, font: "Calibri", size: 20, color: WHITE, bold: true })],
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

// ── Sections 2-5 (Padrão simplificado) ──
function buildFixedSections(): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // ───── 2. Justificativa e Objetivos do Projeto ─────
  elements.push(sectionHeading("2. Justificativa e Objetivos do Projeto:"));
  elements.push(bodyText(
    "A presente proposta foca na implementa\u00e7\u00e3o de um G\u00eameo Digital para a gest\u00e3o avan\u00e7ada e inteligente dos ativos estruturais. O objetivo central transcende o monitoramento pontual, estabelecendo uma ferramenta de an\u00e1lise cont\u00ednua para:"
  ));

  elements.push(subSubHeading("2.1.1 Detec\u00e7\u00e3o de Altera\u00e7\u00f5es Estruturais:"));
  elements.push(bodyText(
    "O sistema de G\u00eameo Digital possibilita a identifica\u00e7\u00e3o cont\u00ednua de varia\u00e7\u00f5es no comportamento estrutural ao longo do tempo, a partir da integra\u00e7\u00e3o de dados de monitoramento em tempo real com modelos digitais representativos da estrutura."
  ));
  elements.push(bodyText(
    "Essa abordagem permite detectar altera\u00e7\u00f5es progressivas de rigidez, mudan\u00e7as nos padr\u00f5es din\u00e2micos e desvios em rela\u00e7\u00e3o ao comportamento de refer\u00eancia (baseline), muitas vezes antes da manifesta\u00e7\u00e3o vis\u00edvel de danos, fornecendo subs\u00eddios objetivos para a\u00e7\u00f5es preventivas e acompanhamento da evolu\u00e7\u00e3o estrutural."
  ));

  elements.push(subSubHeading("2.1.2 An\u00e1lise de Cargas Especiais:"));
  elements.push(bodyText(
    "O monitoramento cont\u00ednuo viabiliza a identifica\u00e7\u00e3o e a an\u00e1lise do efeito da passagem de ve\u00edculos com cargas excepcionais sobre a estrutura, permitindo avaliar n\u00e3o apenas a resposta imediata \u00e0s solicita\u00e7\u00f5es, mas tamb\u00e9m o tempo de recupera\u00e7\u00e3o estrutural ap\u00f3s esses eventos."
  ));
  elements.push(bodyText(
    "Essa capacidade amplia o entendimento sobre o comportamento real da OAE sob condi\u00e7\u00f5es cr\u00edticas de carregamento, apoiando a verifica\u00e7\u00e3o de seguran\u00e7a operacional, a defini\u00e7\u00e3o de restri\u00e7\u00f5es de tr\u00e1fego quando necess\u00e1rio e a avalia\u00e7\u00e3o cumulativa dos impactos ao longo do ciclo de vida do ativo."
  ));

  elements.push(subSubHeading("2.1.3 Suporte \u00e0 Decis\u00e3o (Requalifica\u00e7\u00e3o de TB):"));
  elements.push(bodyText(
    "O G\u00eameo Digital atua como uma base t\u00e9cnica consolidada para a requalifica\u00e7\u00e3o de Trens-Tipo (TB) das obras, permitindo que decis\u00f5es sejam fundamentadas em dados reais de comportamento estrutural, e n\u00e3o apenas em hip\u00f3teses de projeto ou an\u00e1lises pontuais."
  ));
  elements.push(bodyText(
    "A integra\u00e7\u00e3o entre monitoramento, hist\u00f3rico de solicita\u00e7\u00f5es e modelos digitais possibilita avaliar a adequa\u00e7\u00e3o dos TB adotados, orientar revis\u00f5es de capacidade de carga, priorizar interven\u00e7\u00f5es e apoiar estrat\u00e9gias de manuten\u00e7\u00e3o e gest\u00e3o de ativos de forma mais eficiente, transparente e tecnicamente embasada."
  ));

  elements.push(subSubHeading("2.1.4 Inova\u00e7\u00e3o e Posicionamento Estrat\u00e9gico:"));
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

  // ───── 3. Escopo Resumido dos Serviços ─────
  elements.push(sectionHeading("3. Escopo Resumido dos Servi\u00e7os"));
  elements.push(bodyText(
    "A proposta de valor apresentada est\u00e1 fundamentada na transi\u00e7\u00e3o do modelo de manuten\u00e7\u00e3o reativo para uma abordagem preditiva, baseada em dados audit\u00e1veis e em an\u00e1lises estruturais avan\u00e7adas. Ao integrar medi\u00e7\u00f5es cont\u00ednuas, intelig\u00eancia anal\u00edtica e modelagem digital, a solu\u00e7\u00e3o permite identificar danos em est\u00e1gio inicial, otimizar interven\u00e7\u00f5es e maximizar a disponibilidade estrutural, resultando em ganhos operacionais, financeiros, de seguran\u00e7a e de governan\u00e7a."
  ));

  elements.push(subHeading("3.1 Sistema dos Sensores (SHM)"));
  [
    "Visita t\u00e9cnica inicial \u00e0 estrutura para avalia\u00e7\u00e3o de acessos, condi\u00e7\u00f5es de instala\u00e7\u00e3o, pontos cr\u00edticos e infraestrutura dispon\u00edvel.",
    "Elabora\u00e7\u00e3o do plano de sensoriza\u00e7\u00e3o, definindo n\u00famero e localiza\u00e7\u00e3o dos sensores por v\u00e3o, m\u00f3dulos eletr\u00f4nicos, alimenta\u00e7\u00e3o e conectividade.",
    "Disponibiliza\u00e7\u00e3o e configura\u00e7\u00e3o da instrumenta\u00e7\u00e3o de medi\u00e7\u00e3o, incluindo ajustes de firmware, filtros digitais e calibra\u00e7\u00e3o eletr\u00f4nica.",
    "Adequa\u00e7\u00e3o e configura\u00e7\u00e3o do banco de dados e plataforma digital (cole\u00e7\u00f5es, mapeamento de dispositivos, dashboards, usu\u00e1rios e rotinas de an\u00e1lise).",
  ].forEach((b) => elements.push(bullet(b)));

  elements.push(subHeading("3.2 Modelagem Digital e G\u00eameo Digital"));
  [
    "Elabora\u00e7\u00e3o de modelo independente em elementos finitos (MEF) da OAE em software especializado (SAP2000, CSI Bridge ou MIDAS), com base em projetos, inspe\u00e7\u00f5es especiais e ensaios dispon\u00edveis em parceria com a Casagrande Engenharia.",
    "Cria\u00e7\u00e3o do modelo digital da obra existente, integrando o MEF com as condi\u00e7\u00f5es reais de opera\u00e7\u00e3o (tr\u00e1fego, temperatura, vento, impactos etc.) em parceria com a Casagrande Engenharia.",
    "Execu\u00e7\u00e3o de prova de carga com caminh\u00f5es-teste, an\u00e1lise comparativa entre respostas medidas e previstas para calibra\u00e7\u00e3o do sistema fornecido pela contratada.",
    "Calibra\u00e7\u00e3o do modelo, ajustando progressivamente rigidez, in\u00e9rcia efetiva, condi\u00e7\u00f5es de contorno e par\u00e2metros estruturais a partir dos dados de OMA e SHM, de modo a alinhar o G\u00eameo Digital ao comportamento real da OAE ap\u00f3s a prova de carga.",
  ].forEach((b) => elements.push(bullet(b)));

  elements.push(subHeading("3.3 Opera\u00e7\u00e3o e Suporte ao Monitoramento"));
  [
    "Disponibiliza\u00e7\u00e3o de acesso \u00e0 plataforma de monitoramento com visualiza\u00e7\u00e3o de dados, indicadores de integridade e hist\u00f3rico.",
    "Acompanhamento t\u00e9cnico remoto para interpreta\u00e7\u00e3o dos resultados e suporte \u00e0 equipe da Concession\u00e1ria na an\u00e1lise dos alarmes e tend\u00eancias.",
    "Emiss\u00e3o de relat\u00f3rios peri\u00f3dicos de integridade estrutural, com recomenda\u00e7\u00f5es de manuten\u00e7\u00e3o preventiva e registro de eventos significativos (a ser detalhado em contrato, caso aplic\u00e1vel).",
  ].forEach((b) => elements.push(bullet(b)));

  // ───── 4. Premissas e Responsabilidades da Contratante ─────
  elements.push(sectionHeading("4. Premissas e Responsabilidades da Contratante"));
  [
    "Garantia de acesso \u00e0 estrutura (vigas e travessas, caix\u00e3o e face inferior) e das condi\u00e7\u00f5es de seguran\u00e7a necess\u00e1rias para instala\u00e7\u00e3o, testes, manuten\u00e7\u00e3o e opera\u00e7\u00e3o do sistema, abrangendo bloqueios de pista, autoriza\u00e7\u00f5es, escoltas e demais medidas operacionais aplic\u00e1veis.",
    "Disponibiliza\u00e7\u00e3o de equipe e infraestrutura necess\u00e1ria para instala\u00e7\u00e3o do painel solar, caixa de comando, incluindo o fornecimento e a implementa\u00e7\u00e3o dos postes, bem como as funda\u00e7\u00f5es de postes correspondentes.",
    "Disponibiliza\u00e7\u00e3o de equipe para execu\u00e7\u00e3o da instala\u00e7\u00e3o f\u00edsica de dutos, cabeamentos, sensores, dispositivos de medi\u00e7\u00e3o e equipamentos de comunica\u00e7\u00e3o (gateways, antenas, roteadores e afins) necess\u00e1rios \u00e0 execu\u00e7\u00e3o do objeto deste contrato, sob orienta\u00e7\u00e3o da contratada.",
    "Fornecimento dos pontos de energia, caso a estrutura possua rede el\u00e9trica.",
    "Garantia de que a estrutura possui cobertura de sinal de telefonia m\u00f3vel suficiente para a transmiss\u00e3o de dados do sistema de monitoramento.",
    "Fornecimento de documenta\u00e7\u00e3o estrutural e hist\u00f3rico da OAE, incluindo projetos executivos, memoriais de c\u00e1lculo, plantas estruturais, relat\u00f3rios de inspe\u00e7\u00e3o, registros de interven\u00e7\u00f5es, manuten\u00e7\u00f5es e cadastros geom\u00e9tricos.",
    "Presta\u00e7\u00e3o de apoio log\u00edstico em campo durante visitas t\u00e9cnicas, instala\u00e7\u00f5es, testes e valida\u00e7\u00f5es, incluindo autoriza\u00e7\u00f5es, desvios de tr\u00e1fego, ve\u00edculos, equipamentos e acompanhamento operacional necess\u00e1rios.",
    "Respons\u00e1vel pela realiza\u00e7\u00e3o da prova de carga, incluindo apoio no planejamento em conjunto com a contratada, contrata\u00e7\u00e3o, mobiliza\u00e7\u00e3o e atividades correlatas.",
    "Responsabilidade pela contrata\u00e7\u00e3o, disponibiliza\u00e7\u00e3o e log\u00edstica dos caminh\u00f5es, plataformas e equipamentos de acesso necess\u00e1rios \u00e0s atividades em campo.",
    "Comunica\u00e7\u00e3o de eventos relevantes que possam impactar os dados do sistema ou a integridade da estrutura, tais como obras, interven\u00e7\u00f5es programadas, acidentes, impactos, cargas excepcionais ou eventos ambientais extremos.",
    "Manuten\u00e7\u00e3o de canais de comunica\u00e7\u00e3o ativos com a equipe t\u00e9cnica respons\u00e1vel pelo monitoramento, incluindo aprova\u00e7\u00e3o de agendamentos, autoriza\u00e7\u00f5es de acesso e comunica\u00e7\u00e3o de altera\u00e7\u00f5es operacionais ou restri\u00e7\u00f5es internas.",
    "Garantia do atendimento \u00e0s normas internas, protocolos de seguran\u00e7a, restri\u00e7\u00f5es de hor\u00e1rio e exig\u00eancias de EPI aplic\u00e1veis \u00e0s atividades em \u00e1rea concessionada.",
    "Seguro dos equipamentos e da infraestrutura instalada, coberto pela ap\u00f3lice de seguros dos ativos da rodovia, com ado\u00e7\u00e3o das medidas antivandalismo compat\u00edveis com as condi\u00e7\u00f5es locais e os requisitos t\u00e9cnicos do sistema.",
  ].forEach((b) => elements.push(bullet(b)));
  elements.push(bodyText(
    "O atendimento \u00e0s responsabilidades acima \u00e9 fundamental para o cumprimento dos prazos, do cronograma e do desempenho esperado do sistema. Eventuais atrasos ou impactos decorrentes do n\u00e3o atendimento dessas responsabilidades n\u00e3o poder\u00e3o ser atribu\u00eddos \u00e0 contratada."
  ));

  // ───── 5. Responsabilidade da contratada ─────
  elements.push(sectionHeading("5. Responsabilidade da contratada:"));
  [
    "Fornecimento dos materiais de infraestrutura necess\u00e1rios \u00e0 conectividade do sistema, incluindo condu\u00edtes, caixas e fia\u00e7\u00e3o a ser ligada nos sensores;",
    "Elabora\u00e7\u00e3o dos projetos, especifica\u00e7\u00f5es t\u00e9cnicas e diretrizes para instala\u00e7\u00e3o, integra\u00e7\u00e3o e opera\u00e7\u00e3o do sistema.",
    "Presta\u00e7\u00e3o de suporte t\u00e9cnico durante as etapas de instala\u00e7\u00e3o, testes e valida\u00e7\u00e3o do sistema.",
    "Realiza\u00e7\u00e3o de acompanhamento mensal do sistema de monitoramento, como verifica\u00e7\u00e3o do funcionamento dos sensores, integridade dos dados e comunica\u00e7\u00e3o.",
    "Presta\u00e7\u00e3o de aux\u00edlio t\u00e9cnico \u00e0 contratante para navega\u00e7\u00e3o, utiliza\u00e7\u00e3o e interpreta\u00e7\u00e3o das informa\u00e7\u00f5es dispon\u00edveis no sistema de visualiza\u00e7\u00e3o e an\u00e1lise de dados (dashboard).",
  ].forEach((b) => elements.push(bullet(b)));

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
          ...(buildAnexo() as any[]),
        ] as any[],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Proposta_Comercial_${clientName || "OAE"}.docx`);
}
