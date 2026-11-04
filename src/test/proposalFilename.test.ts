import { describe, expect, it } from "vitest";
import { inferRoadName, proposalFilename } from "../lib/proposalFilename";

const date = new Date(2026, 10, 4);

describe("nome dos arquivos de proposta", () => {
  it("usa data local, número, concessionária, rodovia e tipo", () => {
    expect(proposalFilename("Ecorodovias", "SP-160", "7", "TECNICA", date))
      .toBe("261104_007_ECORODOVIAS_SP160_Proposta_Tecnica.docx");
  });

  it("usa a rodovia mesmo quando o orçamento tem várias pontes", () => {
    expect(proposalFilename("Entrevias", "SP160", "001", "COMERCIAL", date))
      .toBe("261104_001_ENTREVIAS_SP160_Proposta_Comercial.docx");
  });

  it("sugere a rodovia a partir do orçamento salvo", () => {
    expect(inferRoadName("ECORODOVIAS_SP160", [{ name: "Ponte A" }, { name: "Ponte B" }])).toBe("SP160");
    expect(inferRoadName("Orçamento novo", [{ name: "Ponte BR-116", inventoryCode: "" }])).toBe("BR116");
  });
});
