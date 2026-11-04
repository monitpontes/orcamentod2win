import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Index from "../pages/Index";

const { signOut, budgetRows } = vi.hoisted(() => ({
  signOut: vi.fn(),
  budgetRows: [{ id: "budget-1", name: "Entrevias", client_name: "Cliente", updated_at: "2026-11-04T10:00:00Z" }],
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "user-1" }, signOut }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => ({
    order: async () => ({ data: budgetRows }),
    eq: () => ({ single: async () => ({ data: {
      ...budgetRows[0], bridges_data: [], components_data: [], compositions_data: {},
      bdi_rate: 0.3, tax_rate: 0.2, markup: 3,
    }, error: null }) }),
  }) }) },
}));
vi.mock("@/components/BridgeConfig", () => ({ default: () => <div>Editor de pontes</div> }));
vi.mock("@/components/BudgetSummary", () => ({ default: () => <div>Resumo do orçamento</div> }));
vi.mock("@/components/DetailedSummary", () => ({ default: () => <div>Resumo detalhado</div> }));
vi.mock("@/components/ComponentCatalog", () => ({ default: () => <div>Catálogo</div> }));
vi.mock("@/components/CompositionEditor", () => ({ default: () => <div>Composições</div> }));
vi.mock("@/components/ProcurementList", () => ({ default: () => <div>Compras</div> }));

const renderBudget = (path = "/orcamentos") => render(<MemoryRouter initialEntries={[path]}><Index /></MemoryRouter>);

describe("navegação segura do orçamento", () => {
  beforeEach(() => signOut.mockClear());

  it("orienta o usuário de pontes ao orçamento e ao salvamento", async () => {
    await act(async () => { renderBudget(); });
    expect(screen.getByText("Editor de pontes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Conferir orçamento" }));
    expect(screen.getByText("Resumo do orçamento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar orçamento" })).toBeInTheDocument();
  });

  it("abre diretamente o orçamento escolhido na página inicial", async () => {
    renderBudget("/orcamentos?budget=budget-1");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Nome do orçamento" })).toHaveValue("Entrevias"));
    expect(screen.getByText("Resumo do orçamento")).toBeInTheDocument();
  });

  it("avisa sobre alterações e permite cancelar a troca de orçamento", async () => {
    renderBudget();
    fireEvent.change(screen.getByRole("textbox", { name: "Nome do orçamento" }), { target: { value: "Proposta em andamento" } });
    expect(screen.getAllByText("Alterações não salvas").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    fireEvent.click(await screen.findByRole("button", { name: /Novo Orçamento/i }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Descartar alterações não salvas?");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("textbox", { name: "Nome do orçamento" })).toHaveValue("Proposta em andamento");

    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    fireEvent.click(await screen.findByRole("button", { name: /Novo Orçamento/i }));
    fireEvent.click(screen.getByRole("button", { name: "Descartar alterações" }));
    expect(screen.getByRole("textbox", { name: "Nome do orçamento" })).toHaveValue("Novo Orçamento");
  });

  it("impede a saída acidental e confirma a exclusão de orçamento salvo", async () => {
    renderBudget();
    fireEvent.change(screen.getByRole("textbox", { name: "Nome do orçamento" }), { target: { value: "Mudança local" } });
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(signOut).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    fireEvent.click(screen.getByRole("button", { name: "Início" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Descartar alterações não salvas?");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    fireEvent.click(await screen.findByRole("button", { name: "Excluir orçamento Entrevias" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Entrevias será excluído permanentemente");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  });
});
