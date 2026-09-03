# Finalizar o cadastro de composições no orçamento

O motor de cálculo por composições já existe (`src/data/compositions.ts`, `src/lib/budgetCalculations.ts`) e o editor de composições já foi criado (`src/components/CompositionEditor.tsx`), mas ele ainda não aparece em nenhuma tela: a aba de Componentes não o exibe, o estado não é salvo no banco e o orçamento continua usando as composições padrão. As colunas de Terceiros/Modelagem ainda existem no resumo e nas exportações (hoje sempre zeradas). Este plano fecha essas pontas.

## O que será feito

1. **Cadastro visível na aba Componentes**
   - Exibir o editor de composições abaixo do catálogo, com uma seção por grupo (Sensores, Infraestrutura, Energia, Conectividade, Caixa de Comando, Serviços).
   - Cada linha: componente, quantidade, base de multiplicação (fixo, por sensor, por estação, por vão, por metro, por kit solar, por kit de conexão, por hora) e condição (Solar/Rede, Completa/Parcial).
   - Botão para restaurar o padrão.

2. **Persistência por orçamento**
   - Guardar as composições junto do orçamento (novo campo JSON na tabela de orçamentos), carregando ao abrir e salvando junto com os demais dados.
   - Orçamentos antigos, sem o campo, continuam usando a composição padrão.

3. **Cálculo usando as composições cadastradas**
   - O resumo, o resumo detalhado e as exportações passam a usar a composição do orçamento aberto em vez do padrão fixo.

4. **Coluna Serviços e remoção de Terceiros**
   - Na tabela do orçamento: substituir a coluna "Modelagem" por "Serviços" (montagem, adequação de banco, modelagem e simulação — tudo que é serviço próprio).
   - Remover a coluna "Terceiros", o filtro "somente Terceiros" e as linhas/observações de terceiros no resumo detalhado, no Word e no PDF.

## Detalhes técnicos

- Nova coluna `compositions_data jsonb` em `budgets` (nullable), lida por `normalizeCompositions` no carregamento; sem migração de dados.
- `Index.tsx`: estado `compositions`, passado para `calculateBudgetSummary(...)` e para `ComponentCatalog`/`CompositionEditor`; incluído no payload de save/load.
- `BudgetSummary.tsx`: remover `thirdPartyOnly`, `bridgeThirdParty`, `globalThirdParty` e ajustar os `colSpan` da tabela; usar `bc.services`.
- `generateDocx.ts` / `generatePdf.ts`: remover blocos condicionais de `thirdPartyTotal`; em seguida remover os campos de compatibilidade `thirdPartyCost`/`thirdPartyTotal` de `budgetCalculations.ts`.
- Validar com typecheck e build ao final.
