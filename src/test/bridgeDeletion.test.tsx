import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BridgeConfig from "../components/BridgeConfig";
import { createDefaultBridge } from "../data/bridgeConfig";
import { defaultComponents } from "../data/components";

function BridgeHarness() {
  const [bridges, setBridges] = useState([{ ...createDefaultBridge(), name: "Ponte Entrevias" }]);
  return <BridgeConfig bridges={bridges} onUpdate={setBridges} components={defaultComponents} />;
}

describe("exclusão de pontes", () => {
  it("exige confirmação e preserva a ponte ao cancelar", () => {
    render(<BridgeHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir Ponte Entrevias" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Excluir Ponte Entrevias?")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ponte Entrevias")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByDisplayValue("Ponte Entrevias")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Excluir Ponte Entrevias" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir ponte" }));
    expect(screen.queryByDisplayValue("Ponte Entrevias")).not.toBeInTheDocument();
  });

  it("usa a mesma confirmação nos detalhes da ponte", () => {
    render(<BridgeHarness />);
    fireEvent.click(screen.getByTitle("Editar detalhes"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir Ponte Entrevias" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("Detalhes — Ponte Entrevias")).toBeInTheDocument();
  });
});
