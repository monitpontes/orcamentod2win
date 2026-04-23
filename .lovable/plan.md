

## Plano: Adicionar categoria "Infraestrutura de Terceiros" ao orçamento

### Contexto
O PDF anexado é um orçamento da **Construtora Unitecnica** para execução da infraestrutura física (postes, eletrodutos, cabos, fixação, conexões) da OAE Ponte Carvalho Pinto, no valor de **R$ 1.090.000,00**. Como a D2Win não executa instalação, esses serviços são contratados de terceiros e devem aparecer no orçamento como tal.

### Solução

#### 1. Nova categoria no catálogo (`src/data/components.ts`)
Adicionar categoria **"Infraestrutura de Terceiros"** com os 9 grupos do orçamento Unitecnica como itens unitários (cada um já com valor de pacote/vb consolidado):

| ID | Item | Unid. | Valor (R$) |
|---|---|---|---|
| TER01 | Serviços Preliminares (mobilização, sinalização, canteiro, plataforma) | vb | 556.183,62 |
| TER02 | Cabeamento (cabos flexíveis 2,5mm²) | vb | 73.341,00 |
| TER03 | Eletrodutos e Conduítes | vb | 128.420,91 |
| TER04 | Fixação e Abraçadeiras (eletrodutos e caixas) | vb | 26.858,25 |
| TER05 | Estrutura dos Postes (13 postes) | vb | 245.085,36 |
| TER06 | Fixação dos Postes na Estrutura | vb | 18.160,49 |
| TER07 | Caixas e Conduletes | vb | 14.735,26 |
| TER08 | Conexões Elétricas (Wago, terminais) | vb | 15.956,02 |
| TER09 | Materiais Complementares (graxa, fitas, abraçadeiras) | vb | 11.259,09 |

Adicionar `"Infraestrutura de Terceiros"` ao array `categories`.

Cada item terá `notes` indicando ser executado por terceiros (ex: "Serviço executado por terceiro contratado").

#### 2. Identificação visual de "Terceiros"
Tratar a categoria como qualquer outra do catálogo — pode ser adicionada via aba **Extras Globais** ou como item extra de uma OAE específica. Já funciona com a infraestrutura de itens extras existente.

Para deixar claro nos resumos que se trata de terceiros:
- **`DetailedSummary.tsx`**: na listagem de extras, exibir badge "Terceiros" ao lado do nome quando o item pertencer à categoria "Infraestrutura de Terceiros".
- **`BudgetSummary.tsx`**: idem, exibir o nome da categoria ao lado dos itens extras globais.

#### 3. Sem mudanças de cálculo
A lógica de `budgetCalculations.ts` já trata itens extras corretamente — eles entram em `extraItemsCost` (por ponte) ou `globalExtrasCost` (global), são somados ao subtotal, e recebem BDI/impostos/markup normalmente.

### Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `src/data/components.ts` | +9 itens TER01-TER09 e categoria "Infraestrutura de Terceiros" |
| `src/components/DetailedSummary.tsx` | Badge "Terceiros" nos itens dessa categoria |
| `src/components/BudgetSummary.tsx` | Mostrar categoria nos itens extras globais |

### Como usar
Após implementação, basta abrir uma OAE (ou a aba Extras Globais), adicionar o item TER (ex: "Serviços Preliminares") com quantidade 1 — o valor entra automaticamente no orçamento e aparece destacado como serviço de terceiros nos resumos.

