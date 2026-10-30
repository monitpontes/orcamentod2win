import JSZip from "jszip";
import { saveAs } from "file-saver";
import { BridgeSpan } from "@/data/bridgeConfig";
import {
  isProposalPlaceholder,
  normalizeProposalMetadata,
  ProposalMetadata,
  sanitizeFilename,
} from "@/lib/proposalData";

const TEMPLATE_PATH = "templates/PropostaTecnica_Modelo.docx";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface SensorQuantityRow {
  name: string;
  typology: string;
  spanCount: number;
  structuralSensors: number;
  temperatureSensors: number;
  totalSensors: number;
}

export function buildSensorQuantityRows(bridges: BridgeSpan[]): SensorQuantityRow[] {
  return bridges.map((bridge) => ({
    name: bridge.name || "OAE sem nome",
    typology: bridge.typology,
    spanCount: bridge.spanCount || 0,
    structuralSensors: bridge.sensorCount || 0,
    temperatureSensors: bridge.temperatureCount || 0,
    totalSensors: (bridge.sensorCount || 0) + (bridge.temperatureCount || 0),
  }));
}

function escapeXml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(".", ",");
}

function paragraphXml(text: string, bold = false): string {
  return `<w:p><w:pPr><w:spacing w:before="100" w:after="100"/></w:pPr><w:r><w:rPr>${bold ? "<w:b/>" : ""}<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function tableCellXml(text: string | number, width: number, header = false): string {
  const fill = header ? '<w:shd w:val="clear" w:color="auto" w:fill="1A2744"/>' : "";
  const textColor = header ? '<w:color w:val="FFFFFF"/>' : "";
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${fill}<w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:jc w:val="${header ? "center" : "left"}"/></w:pPr><w:r><w:rPr>${header ? "<w:b/>" : ""}${textColor}<w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p></w:tc>`;
}

export function buildSensorQuantitiesXml(bridges: BridgeSpan[]): string {
  const rows = buildSensorQuantityRows(bridges);
  const usesEprReference = bridges.some((bridge) => Boolean(bridge.quantityReference));
  const totals = rows.reduce(
    (sum, row) => ({
      spans: sum.spans + row.spanCount,
      structural: sum.structural + row.structuralSensors,
      temperature: sum.temperature + row.temperatureSensors,
      total: sum.total + row.totalSensors,
    }),
    { spans: 0, structural: 0, temperature: 0, total: 0 }
  );
  const widths = [3200, 1250, 850, 1250, 1250, 1000];
  const header = ["OAE", "Tipologia", "Vãos", "Estruturais", "Temperatura", "Total"]
    .map((text, index) => tableCellXml(text, widths[index], true))
    .join("");
  const bodyRows = rows.map((row) => `<w:tr>${[
    row.name,
    row.typology,
    formatNumber(row.spanCount),
    formatNumber(row.structuralSensors),
    formatNumber(row.temperatureSensors),
    formatNumber(row.totalSensors),
  ].map((text, index) => tableCellXml(text, widths[index])).join("")}</w:tr>`).join("");
  const totalRow = `<w:tr>${[
    "TOTAL",
    "—",
    formatNumber(totals.spans),
    formatNumber(totals.structural),
    formatNumber(totals.temperature),
    formatNumber(totals.total),
  ].map((text, index) => tableCellXml(text, widths[index])).join("")}</w:tr>`;

  return [
    paragraphXml("Quantitativos de sensores", true),
    paragraphXml(`O sistema contempla ${totals.total} sensores, sendo ${totals.structural} sensores estruturais e ${totals.temperature} sensores de temperatura. Os sensores de temperatura estão incluídos no quantitativo total.`),
    '<w:tbl><w:tblPr><w:tblW w:w="8800" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9D9D9"/><w:left w:val="single" w:sz="4" w:color="D9D9D9"/><w:bottom w:val="single" w:sz="4" w:color="D9D9D9"/><w:right w:val="single" w:sz="4" w:color="D9D9D9"/><w:insideH w:val="single" w:sz="4" w:color="D9D9D9"/><w:insideV w:val="single" w:sz="4" w:color="D9D9D9"/></w:tblBorders></w:tblPr>',
    `<w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("")}</w:tblGrid>`,
    `<w:tr><w:trPr><w:tblHeader/></w:trPr>${header}</w:tr>`,
    bodyRows,
    totalRow,
    "</w:tbl>",
    paragraphXml(
      "Nas vigas I, retangulares e T, considera-se um par de acelerômetros por viga e um sensor de temperatura em cada extremidade do vão. Nos caixões, considera-se um par de acelerômetros e um sensor de temperatura em cada face externa prevista, totalizando seis estruturais e quatro de temperatura por vão. Nas lajes, consideram-se três pares de acelerômetros nos terços do vão e um sensor de temperatura em cada extremidade, duplicando-se os estruturais quando houver duas vias separadas. Nas passarelas, consideram-se dois pares de acelerômetros e dois sensores de temperatura por seção monitorada." +
      (usesEprReference
        ? " Para as OAEs EPR, prevalece o maior quantitativo entre a proposta de referência e o recálculo, respeitadas as decisões individuais confirmadas."
        : "") +
      " A posição final será confirmada no projeto executivo."
    ),
  ].join("");
}

function replaceHighlightedPlaceholder(xml: string, token: string, value: string): string {
  const escapedToken = escapeRegExp(token);
  const runPattern = new RegExp(
    `(<w:r(?:\\s[^>]*)?>[\\s\\S]*?<w:t(?:\\s[^>]*)?>)${escapedToken}(</w:t>[\\s\\S]*?</w:r>)`,
    "g"
  );
  const replacedRuns = xml.replace(runPattern, (_match, before: string, after: string) => {
    const cleanedBefore = before
      .replace(/<w:highlight\s+w:val="yellow"\s*\/>/g, "")
      .replace(/<w:color\s+w:val="C00000"\s*\/>/g, "");
    return `${cleanedBefore}${escapeXml(value)}${after}`;
  });
  return replacedRuns.replace(new RegExp(escapedToken, "g"), escapeXml(value));
}

function removeParagraphContaining(xml: string, phrase: string): string {
  const escapedPhrase = escapeRegExp(phrase);
  return xml.replace(
    new RegExp(`<w:p(?=[^>]*>)(?:(?!<w:p[ >])[\\s\\S])*?${escapedPhrase}(?:(?!<w:p[ >])[\\s\\S])*?</w:p>`),
    ""
  );
}

function removeTemplateInstructions(xml: string): string {
  return [
    "MODELO EDITÁVEL - REVISE E SUBSTITUA TODOS OS CAMPOS DESTACADOS ANTES DO ENVIO",
    "Estrutura preservada da proposta de referência",
    "Campos variáveis destacados para substituição segura",
  ].reduce(removeParagraphContaining, xml);
}

function paragraphBoundsContaining(xml: string, phrase: string, startAt = 0) {
  const phraseIndex = xml.indexOf(phrase, startAt);
  if (phraseIndex < 0) return null;

  const paragraphPattern = /<w:p(?:\s[^>]*)?>/g;
  let paragraphStart = -1;
  let match: RegExpExecArray | null;
  while ((match = paragraphPattern.exec(xml)) && match.index < phraseIndex) {
    paragraphStart = match.index;
  }
  if (paragraphStart < 0) return null;

  const closingTag = "</w:p>";
  const paragraphEnd = xml.indexOf(closingTag, phraseIndex);
  if (paragraphEnd < 0) return null;
  return { start: paragraphStart, end: paragraphEnd + closingTag.length };
}

function insertSensorSection(xml: string, bridges: BridgeSpan[]): string {
  const marker = "Sensorização por Vão";
  const markerIndex = xml.indexOf(marker);
  if (markerIndex < 0) return xml;

  const existingStart = paragraphBoundsContaining(xml, "Quantitativos de sensores", markerIndex);
  const existingEnd = existingStart
    ? paragraphBoundsContaining(xml, "Nas vigas I", existingStart.end)
    : null;
  if (existingStart && existingEnd) {
    return `${xml.slice(0, existingStart.start)}${buildSensorQuantitiesXml(bridges)}${xml.slice(existingEnd.end)}`;
  }

  const markerParagraph = paragraphBoundsContaining(xml, marker);
  if (!markerParagraph) return xml;
  const insertionPoint = markerParagraph.end;
  return `${xml.slice(0, insertionPoint)}${buildSensorQuantitiesXml(bridges)}${xml.slice(insertionPoint)}`;
}

export function populateTechnicalTemplateXml(
  templateXml: string,
  bridges: BridgeSpan[],
  metadataInput: ProposalMetadata = {}
): string {
  const metadata = normalizeProposalMetadata(metadataInput);
  const date = new Date().toLocaleDateString("pt-BR");
  const monitoredSpans = bridges.reduce((sum, bridge) => sum + (bridge.spanCount || 0), 0);
  const replacements: Record<string, string> = {
    "[[NOME DA CONTRATANTE]]": metadata.clientName,
    "[[CÓDIGO DA PROPOSTA]]": metadata.proposalName,
    "[[DATA DA PROPOSTA]]": date,
    "[[REVISÃO]]": metadata.revision,
    "[[RESPONSÁVEL PELA PROPOSTA]]": metadata.responsible,
    "[[QUANTIDADE DE OAEs]]": String(bridges.length),
    "[[PRAZO DE MONITORAMENTO EM MESES]]": String(metadata.monitoringMonths),
    "[[QUANTIDADE DE VÃOS MONITORADOS POR OAE]]": `${monitoredSpans} vão(s) distribuído(s) nas OAEs cadastradas`,
    "[[SUBSTITUIR O CRONOGRAMA PELAS ETAPAS E PRAZOS DESTE CLIENTE]]": "O cronograma executivo será consolidado após a validação dos acessos, dos documentos estruturais e das condições de instalação de cada OAE.",
    "[[ARRANJOS E ILUSTRAÇÕES ESPECÍFICOS DAS OAEs]]": "Arranjos e ilustrações das OAEs",
    "[[SUBSTITUIR AS FIGURAS DE DISTRIBUIÇÃO PELOS DESENHOS DAS OAEs DESTE CLIENTE]]": "Os desenhos de distribuição serão emitidos no projeto executivo após a validação das estruturas.",
  };

  bridges.slice(0, 10).forEach((bridge, index) => {
    replacements[`[[RODOVIA / NOME DA OAE ${String(index + 1).padStart(2, "0")}]]`] = bridge.name || "OAE sem nome";
  });
  for (let index = bridges.length; index < 10; index += 1) {
    replacements[`[[RODOVIA / NOME DA OAE ${String(index + 1).padStart(2, "0")}]]`] = "OAE a definir";
  }

  let xml = insertSensorSection(templateXml, bridges);
  xml = removeTemplateInstructions(xml);
  Object.entries(replacements).forEach(([token, value]) => {
    xml = replaceHighlightedPlaceholder(xml, token, value);
  });
  return xml;
}

export async function generateTechnicalProposalDocx(
  bridges: BridgeSpan[],
  metadataInput: ProposalMetadata = {}
) {
  const metadata = normalizeProposalMetadata(metadataInput);
  const baseUrl = import.meta.env.BASE_URL || "/";
  const response = await fetch(`${baseUrl}${TEMPLATE_PATH}`);
  if (!response.ok) {
    throw new Error("Não foi possível carregar o modelo da proposta técnica.");
  }

  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error("O modelo da proposta técnica está inválido.");
  }

  const templateXml = await documentFile.async("string");
  zip.file("word/document.xml", populateTechnicalTemplateXml(templateXml, bridges, metadata));
  const blob = await zip.generateAsync({ type: "blob", mimeType: DOCX_MIME });
  const filenameClient = isProposalPlaceholder(metadata.clientName) ? "OAE" : metadata.clientName;
  saveAs(blob, `Proposta_Tecnica_${sanitizeFilename(filenameClient)}.docx`);
}
