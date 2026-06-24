
## Objetivo

Adicionar uma aba **"Lista de Compras"** dentro do app (não mais só no Excel) que permita, por orçamento, marcar cada material como comprado/entregue, registrar valor pago, fornecedor e datas — com persistência no Lovable Cloud.

## UX

Nova aba ao lado de "Resumo", "Orçamento", etc., chamada **Lista de Compras**.

Conteúdo:
- Cabeçalho com nome do cliente/orçamento e indicadores: total de itens, % comprado, % entregue, total pago vs. referência.
- Tabela agrupada por **Ponte → Categoria**, com colunas:
  - Item (ID + nome) · Qtd · Unid · Preço Ref · Total Ref
  - **Comprado?** (Não / Parcial / Sim) — select com cor
  - **Valor Pago (R$)** — input numérico, destaca em laranja se ≠ Total Ref
  - **Fornecedor / Local** — input texto
  - **Data da Compra** — date picker
  - **Entregue?** (Não / Parcial / Sim) — select com cor
  - **Data de Entrega** — date picker
  - **Observações** — input texto
- Filtros no topo: por ponte, por status de compra, por status de entrega, busca por item.
- Linha de totais ao final de cada ponte e total geral.
- Botão "Exportar Lista de Compras (Excel)" reaproveitando a aba já criada.

Salvamento automático com debounce (~600ms) por linha. Indicador "Salvando…/Salvo" no topo.

## Modelo de dados

Nova tabela `procurement_items` ligada ao `budget_id`. Cada linha representa um material rastreado dentro de um orçamento.

```text
procurement_items
├── id uuid pk
├── budget_id uuid fk → budgets.id (on delete cascade)
├── user_id uuid (RLS)
├── bridge_key text         -- identificador da ponte dentro do JSON (id ou índice)
├── bridge_name text
├── category text
├── component_id text       -- ex.: "S01", "INF02"
├── component_name text
├── unit text
├── qty numeric
├── unit_price_ref numeric
├── total_ref numeric
├── purchase_status text    -- 'nao' | 'parcial' | 'sim'
├── amount_paid numeric
├── supplier text
├── purchase_date date
├── delivery_status text    -- 'nao' | 'parcial' | 'sim'
├── delivery_date date
├── notes text
├── created_at, updated_at timestamptz
└── unique(budget_id, bridge_key, component_id)
```

RLS: usuário só vê/edita linhas de orçamentos que ele criou (via join com `budgets.user_id`, ou usando `user_id` redundante na linha — vamos com `user_id` redundante + policy direta para simplicidade).

## Sincronização orçamento ↔ lista

Ao abrir a aba, o app:
1. Gera a lista canônica de materiais do orçamento (mesma lógica que alimenta o Excel hoje, extraída para `src/lib/materialsList.ts`).
2. Busca as linhas salvas em `procurement_items` para o `budget_id`.
3. Faz um upsert/merge por `(bridge_key, component_id)`:
   - Itens novos no orçamento → criados com `purchase_status='nao'`.
   - Itens removidos do orçamento → marcados como "órfãos" (mostrados num grupo separado "Itens removidos do escopo") em vez de apagados, para preservar histórico de compras já feitas. Usuário pode arquivar manualmente.
4. Atualizações de quantidade/preço no orçamento refrescam `qty`, `unit_price_ref`, `total_ref` da linha existente, sem mexer nos campos de compra.

## Arquivos a criar/editar

**Novos:**
- `supabase/migrations/<ts>_procurement_items.sql` — tabela + grants + RLS + trigger `updated_at`.
- `src/lib/materialsList.ts` — extrai `buildMaterialsList(bridges, components, extras)` (hoje embutido em `generateXlsx.ts`).
- `src/hooks/useProcurement.ts` — carrega/sincroniza/salva linhas com debounce.
- `src/components/ProcurementList.tsx` — UI da aba (tabela, filtros, indicadores).

**Editados:**
- `src/pages/Index.tsx` (ou onde estão as tabs) — adicionar `<TabsTrigger value="procurement">Lista de Compras</TabsTrigger>` e `<TabsContent>`.
- `src/lib/generateXlsx.ts` — passa a consumir `buildMaterialsList` e, se houver dados de compra do hook, popular as colunas.

## Detalhes técnicos

- Persistência: `supabase.from('procurement_items').upsert(...)` com `onConflict: 'budget_id,bridge_key,component_id'`.
- Debounce com `useRef<Map<string, Timeout>>` por linha; flush no `beforeunload`.
- Cores reaproveitam os tokens do `index.css` (navy/orange/muted) — sem cores hardcoded.
- `bridge_key`: usar `bridge.id` se existir; caso contrário gerar `idx-${i}` consistente (vamos garantir `id` no `BridgeSpan`; se faltar, criar um ao montar o estado).
- Recalculo de % comprado/entregue: contagem de linhas por status e razão `amount_paid / total_ref` no agregado.

## Fora de escopo

- Histórico de alterações por linha.
- Anexar notas fiscais (pode virar próximo passo com Storage).
- Workflow de aprovação multi-usuário.
