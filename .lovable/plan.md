

## Plano: Itens extras por ponte e globais + Aba de cálculos completa

### Problema atual
Novos componentes adicionados no catálogo não entram no cálculo porque o `budgetCalculations.ts` usa IDs fixos (S01, INF01, etc.). Não existe mecanismo para itens adicionais.

### Solução

#### 1. Modelo de dados — Itens extras

Adicionar campo `extraItems` na interface `BridgeSpan` para itens extras por ponte, e um estado `globalExtraItems` no `Index.tsx` para itens globais.

```typescript
// bridgeConfig.ts
export interface ExtraItem {
  componentId: string;  // referência ao catálogo
  qty: number;
}

export interface BridgeSpan {
  // ...campos existentes...
  extraItems: ExtraItem[];
}
```

#### 2. UI — Itens extras por ponte (`BridgeConfig.tsx`)
Dentro de cada card de ponte, adicionar uma seção "Itens Extras" com:
- Select para escolher componente do catálogo
- Input de quantidade
- Botão adicionar/remover
- Precisa receber `components` como prop

#### 3. UI — Itens extras globais (`Index.tsx`)
Adicionar na aba de Orçamento (ou numa seção dedicada) um painel "Custos Adicionais Globais" com a mesma mecânica de select + quantidade.

#### 4. Cálculos (`budgetCalculations.ts`)
- Na `calculateBridgeCosts`: somar itens extras da ponte ao total
- Na `calculateBudgetSummary`: receber `globalExtraItems` e somar ao subtotal

#### 5. Aba "Cálculos" — Visão completa (`DetailedSummary.tsx`)
Expandir o resumo detalhado para incluir:
- Itens extras de cada ponte (nova seção "Itens Adicionais")
- Itens extras globais (card separado)
- Totais parciais (equipamento, modelagem, extras ponte, extras globais)
- Subtotal, BDI, Impostos, **Valor da Proposta** — tudo visível para controle interno
- Mensalidade de acompanhamento

### Arquivos modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/data/bridgeConfig.ts` | Adicionar `ExtraItem` interface e `extraItems` ao `BridgeSpan` |
| `src/lib/budgetCalculations.ts` | Incluir extras de ponte e globais no cálculo |
| `src/components/BridgeConfig.tsx` | UI para adicionar itens extras por ponte |
| `src/components/DetailedSummary.tsx` | Exibir extras + totais completos (BDI, impostos, proposta) |
| `src/pages/Index.tsx` | Estado de `globalExtraItems`, passar props, UI de extras globais |

