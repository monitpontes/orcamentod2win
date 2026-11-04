import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Home from "../pages/Home";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { email: "usuario@empresa.com" }, signOut: vi.fn() }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => ({ order: async () => ({ data: [
    { id: "budget-1", name: "Ponte Central", client_name: "Entrevias", updated_at: "2026-11-04T10:00:00Z" },
  ], error: null }) }) }) },
}));

describe("página inicial", () => {
  it("oferece novo orçamento, lista salva e acesso direto aos recentes", async () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Seus orçamentos começam aqui" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Novo orçamento/i })).toHaveAttribute("href", "/orcamentos");
    expect(screen.getByRole("link", { name: /Abrir orçamento salvo/i })).toHaveAttribute("href", "/orcamentos?listar=1");
    expect(await screen.findByText("Ponte Central")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ponte Central/i })).toHaveAttribute("href", "/orcamentos?budget=budget-1");
  });
});
