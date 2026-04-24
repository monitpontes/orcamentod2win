## Plano: Itens "Infraestrutura de Terceiros" como repasse direto (sem BDI, Impostos ou Markup)

### Decisão confirmada
- **Escopo:** apenas itens da categoria `"Infraestrutura de Terceiros"`. Demais extras seguem com BDI/Impostos como hoje.
- **Markup:** **não aplicar** nos terceiros (custo puro de repasse).

### Mudanças

#### 1. `src/lib/budgetCalculations.ts`
- Adicionar constante `THIRD_PARTY_CATEGORY` e helpers `isThirdParty`, `calculateThirdPartyCost`.
- Modificar `calculateExtraItemsCost` para **ignorar** itens de terceiros.
- Em `BridgeCosts`: novo campo `thirdPartyCost`. O `extraItemsCost` passa a ser só não-terceiros e o `total` da ponte continua excluindo terceiros (porque terceiros saem de `extraItemsCost`).
- Em `BudgetSummary`: novo campo `thirdPartyTotal` (soma das pontes + globais).
- `grandSubtotal` continua sem terceiros (já que os helpers os filtram). `bdiValue`, `taxValue`, `markupValue` ficam inalterados em fórmula — mas naturalmente passam a não incidir sobre terceiros.
- `proposalValue = grandSubtotal + bdiValue + taxValue + thirdPartyTotal`.

#### 2. `src/components/DetailedSummary.tsx` — Resumo Financeiro
Adicionar, antes da linha "Valor da Proposta":
```
Infraestrutura de Terceiros (sem BDI/Impostos)   R$ XXX,XX
```
exibida apenas quando `summary.thirdPartyTotal > 0`. Texto explicativo curto abaixo do BDI/Impostos esclarecendo que terceiros não recebem encargos.

#### 3. `src/components/BudgetSummary.tsx` — aba Orçamento
- Coluna **Extras** por OAE: já reflete só extras não-terceiros (vem de `bc.extraItemsCost`). Adicionar nova coluna **Terceiros** (de `bc.thirdPartyCost`) ao lado, em modo normal, para visibilidade.
- Linha **Extras Globais** já mostra só não-terceiros. Adicionar linha **Terceiros (repasse)** quando `summary.thirdPartyTotal > 0` logo antes do card final.
- No card de **Valor da Proposta**, manter o valor (já inclui terceiros). O modo "Apenas Terceiros" continua funcionando como hoje.

#### 4. `src/lib/generateDocx.ts` — Pacote CAPEX (seção 6.3.1)
Logo antes da linha "Valor Total CAPEX:", quando `summary.thirdPartyTotal > 0`, adicionar parágrafo:
```
Inclui R$ XXX,XX referentes a infraestrutura executada por terceiros, repassados como custo direto, sem incidência de BDI ou impostos.
```
O valor da tabela CAPEX (`proposalValue`) já refletirá automaticamente o novo cálculo.

#### 5. `src/lib/generatePdf.ts`
Análogo ao docx: adicionar linha "Infraestrutura de Terceiros (sem BDI/Impostos)" no bloco "Resumo Financeiro" entre Impostos e o destaque do Valor da Proposta, quando aplicável.

### Arquivos modificados
- `src/lib/budgetCalculations.ts`
- `src/components/DetailedSummary.tsx`
- `src/components/BudgetSummary.tsx`
- `src/lib/generateDocx.ts`
- `src/lib/generatePdf.ts`

### Resultado esperado
Itens TER01–TER09 adicionados a uma OAE ou aos Extras Globais entram **integralmente** no Valor da Proposta como repasse, sem inflar BDI nem Impostos, e ficam claramente identificados nos resumos da tela e nas exportações.