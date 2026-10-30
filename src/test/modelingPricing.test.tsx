import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createDefaultBridge } from "../data/bridgeConfig";
import { defaultComponents } from "../data/components";
import { calculateBudgetSummary } from "../lib/budgetCalculations";
import { applyModelingPricingBatch, filterModelingBridges } from "../lib/modelingPricing";
import ModelingPricingEditor from "../components/ModelingPricingEditor";

function fixture() {
  return Array.from({ length: 130 }, (_, index) => ({
    ...createDefaultBridge(), id: String(index + 1), name: `Ponte ${String(index + 1).padStart(3, "0")}`,
  }));
}

function Harness() {
  const [bridges, setBridges] = useState(fixture);
  return <>
    <ModelingPricingEditor bridges={bridges} summary={calculateBudgetSummary(bridges, defaultComponents)} onChange={setBridges} />
    <output data-testid="manual-count">{bridges.filter((bridge) => bridge.modelingPricingMode === "manual").length}</output>
  </>;
}

describe("edição de preços para 130 pontes", () => {
  it("pagina a lista sem mostrar todas as pontes simultaneamente", () => {
    render(<Harness />);
    expect(screen.getAllByRole("row")).toHaveLength(16);
    expect(screen.queryByText("Ponte 016")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de preços" }));
    expect(screen.getByText("Ponte 016")).toBeInTheDocument();
    expect(screen.queryByText("Ponte 001")).not.toBeInTheDocument();
  });

  it("aplica preço final só às filtradas selecionadas e permite desfazer", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Buscar pontes na edição de preços"), { target: { value: "Ponte 00" } });
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todas as 9 filtradas" }));
    fireEvent.click(screen.getByRole("button", { name: "Editar selecionadas" }));
    expect(screen.getByRole("button", { name: "Aplicar em 9 pontes" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Modelagem e simulação — preço final por ponte (R$)"), { target: { value: "15000" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar em 9 pontes" }));
    expect(screen.getByTestId("manual-count")).toHaveTextContent("9");
    expect(screen.getByLabelText("Preço final de Ponte 001")).toHaveValue(15000);
    expect(screen.getAllByText(/10\.000,00/)).toHaveLength(9);
    fireEvent.click(screen.getByRole("button", { name: "Desfazer último lote" }));
    expect(screen.getByTestId("manual-count")).toHaveTextContent("0");
  });

  it("mantém seleção entre páginas", () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText("Selecionar Ponte 001"));
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de preços" }));
    fireEvent.click(screen.getByLabelText("Selecionar Ponte 016"));
    fireEvent.click(screen.getByRole("button", { name: "Editar selecionadas" }));
    fireEvent.change(screen.getByLabelText("Modelagem e simulação — preço final por ponte (R$)"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar em 2 pontes" }));
    expect(screen.getByTestId("manual-count")).toHaveTextContent("2");
    expect(screen.getByLabelText("Preço final de Ponte 016")).toHaveValue(0);
  });

  it("preserva dados de pontes não selecionadas e valores manuais ao voltar ao automático", () => {
    const bridges = fixture();
    const manual = applyModelingPricingBatch(bridges, new Set(["1"]), "manual", 15000);
    expect(manual[1]).toBe(bridges[1]);
    expect(manual[0].spanCount).toBe(bridges[0].spanCount);
    expect(filterModelingBridges(manual, "", "all", "manual")).toHaveLength(1);
    expect(applyModelingPricingBatch(manual, new Set(["1"]), "automatic", 0)[0].manualModelingSimulationFinalValue).toBe(15000);
    expect(() => applyModelingPricingBatch(bridges, new Set(["1"]), "manual", -1)).toThrow();
  });
});
