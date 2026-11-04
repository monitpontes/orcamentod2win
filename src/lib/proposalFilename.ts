export type ProposalKind = "TECNICA" | "COMERCIAL";

function filenamePart(value: string, fallback: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    .slice(0, 60).replace(/_+$/g, "") || fallback;
}

/** Nome legível e estável para os dois documentos de proposta. */
export function proposalFilename(
  clientName: string,
  roadName: string,
  proposalNumber: string,
  kind: ProposalKind,
  date = new Date()
): string {
  const datePart = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const digits = proposalNumber.replace(/\D/g, "");
  const numberPart = (digits || "1").slice(-6).padStart(3, "0");
  const proposalKind = kind === "TECNICA" ? "Proposta_Tecnica" : "Proposta_Comercial";
  const roadCode = roadName.match(/^\s*([a-z]{2})[\s_-]*(\d{2,4})\s*$/i);
  const roadPart = roadCode ? `${roadCode[1].toUpperCase()}${roadCode[2]}` : filenamePart(roadName, "RODOVIA");
  return `${datePart}_${numberPart}_${filenamePart(clientName, "CONCESSIONARIA")}_${roadPart}_${proposalKind}.docx`;
}

/** Aproveita siglas como SP160 ou BR-116 já presentes no orçamento salvo. */
export function inferRoadName(proposalName: string, bridges: Pick<BridgeSpan, "name" | "inventoryCode">[]): string {
  const text = [proposalName, ...bridges.flatMap((bridge) => [bridge.name, bridge.inventoryCode || ""])].join(" ").toUpperCase();
  const match = text.match(/(?:^|[^A-Z0-9])((?:BR|SP|RJ|MG|ES|PR|SC|RS|BA|GO|MT|MS|DF|PE|CE|PA|AM|TO)[\s_-]*\d{2,4})(?=$|[^A-Z0-9])/);
  return match ? match[1].replace(/[^A-Z0-9]/g, "") : "";
}
import type { BridgeSpan } from "@/data/bridgeConfig";

