import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BridgeConfig from "../components/BridgeConfig";
import { bridgeNeedsReview, bridgeReviewReasons, createDefaultBridge } from "../data/bridgeConfig";
import { defaultComponents } from "../data/components";
import { EPR_REFERENCE_LABEL } from "../data/eprReferenceQuantities";

describe("motivos de revisão das pontes", () => {
  it("explica todas as informações faltantes e as mostra na tabela e nos detalhes", () => {
    const bridge = {
      ...createDefaultBridge(), name: "Ponte A", typology: "Viga I" as const,
      beamCount: 0, sensorCount: 0, temperatureCount: 0,
    };
    const reasons = bridgeReviewReasons(bridge);
    expect(reasons).toHaveLength(3);
    expect(bridgeNeedsReview(bridge)).toBe(true);

    render(<BridgeConfig bridges={[bridge]} onUpdate={() => {}} components={defaultComponents} />);
    const list = screen.getByRole("list", { name: "Motivos de revisão de Ponte A" });
    expect(within(list).getByText(/quantidade de vigas por vão/i)).toBeInTheDocument();
    expect(within(list).getByText(/sensores estruturais/i)).toBeInTheDocument();
    expect(within(list).getByText(/sensores de temperatura/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Editar detalhes"));
    expect(screen.getByText("Revisão necessária")).toBeInTheDocument();
  });

  it("distingue a pendência EPR de uma tipologia manual já preenchida", () => {
    const manual = { ...createDefaultBridge(), typology: "Outra" as const, sensorCount: 8 };
    expect(bridgeReviewReasons(manual)).toEqual([]);
    expect(bridgeNeedsReview(manual)).toBe(false);

    const epr = {
      ...manual, inventoryCode: "OAE-122", quantityReference: EPR_REFERENCE_LABEL,
    };
    expect(bridgeReviewReasons(epr)).toEqual([
      "OAE 122: confirmar os quantitativos pendentes no comparativo EPR com o desenho.",
    ]);
  });
});
