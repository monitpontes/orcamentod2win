
## Objetivo

Transformar a aba **Lista de Compras** de uma lista por-ponte em um **sistema de controle de estoque e compras** centralizado, evitando duplicidade e perda de itens durante a execução. Componentes do sensor ficam globais (iguais para todas as pontes), com quantidade editável.

## Mudanças de estrutura

### 1. Agrupamento principal por **Categoria global** (não mais por ponte)
Nova hierarquia:

```
Sensores (componentes de produção)        ← global, qty editável
  └─ Placa, ESP32, ADXL345, ...
Caixa de Comando                          ← agregado de todas as pontes
Conectividade
Energia / Energia Solar
Infraestrutura
Modelagem e Engenharia                    ← serviços (mantidos por ponte como sub-rótulo)
Itens Adicionais / Custom
```

Cada linha mostra **quantidade total consolidada** (somada entre pontes) com **breakdown discreto** ("Carvalho Pinto: 13 + Outra: 5") em tooltip/expand.

Filtro existente "por ponte" vira **filtro secundário** que destaca contribuição de cada ponte sem quebrar o agrupamento global.

### 2. Sensores: itens globais com qty editável
- Componentes de produção do sensor (Placa, ESP32, ADXL345, microSD, caixa, resistores, etc.) deixam de escalar automaticamente com `sensor_count × qty_per_sensor`.
- Vira **qty livremente editável** pelo usuário (campo `qty` editável na tabela).
- O card "Nº de sensores" passa a ser **apenas referência informativa** (sugestão: "Sugerido: N sensores × qty/sensor = X") com botão "Aplicar sugestão" que preenche a qty.
- Taxa USD→BRL continua editável e segue recalculando `unit_price_ref` dos itens em USD.

### 3. Baseline = Carvalho Pinto Rev1
Criar arquivo `src/data/procurementBaseline.ts` com os preços/quantidades extraídos do orçamento `Motiva - Ponte Carvalho Pinto - Rev1`:

- Sensores S01/S02/S03 → R$ 357,27 / R$ 41,20 / R$ 200,00 (mas estes 3 são substituídos pela lista de produção detalhada — manter apenas como fallback caso a importação não tenha sido feita).
- Componentes de produção: usar preços BR (TecCI, Pisca Led, Casa da Robótica, etc.) como **padrão** ao importar.
- Botão renomeado: **"Importar componentes de produção (padrão Carvalho Pinto)"** — uma única ação, sem duas versões.
- Versão LCSC/Alibaba some da UI (mas o array fica no código caso necessário no futuro).

### 4. Coluna `qty` editável universalmente
Hoje só `unit_price_ref`, `amount_paid`, `purchase_status`, etc. são editáveis. Tornar `qty` editável em **todas** as linhas (não apenas custom). Edição manual é preservada no merge da `loadAndSync` (mesma lógica já aplicada a `unit_price_ref`).

### 5. Controle de estoque
Adicionar 2 colunas leves:
- **Em estoque** (numérico): quanto já existe disponível.
- **Saldo a comprar** = `qty - em_estoque - já_entregue` (calculado, com badge colorida: verde 0, vermelho > 0).

Card resumo no topo ganha:
- "Itens pendentes de compra: X" (com saldo > 0)
- "Aguardando entrega: Y" (comprados mas não entregues)
- "Valor pendente: R$ Z"

### 6. Visual / UX
- Toggle "Visão global / Visão por ponte" no topo (default: global).
- Linha colapsável por categoria (clicando no header esconde itens).
- Botão "Exportar Excel" da lista mantido (atualizar para nova estrutura global).

## Detalhes técnicos

### Banco
Adicionar colunas em `procurement_items`:
- `in_stock numeric DEFAULT 0`
- (não precisa de outra coluna; saldo é calculado)

Adicionar `bridge_key = '__global__'` como agrupamento canônico para itens de sensor (substitui `__sensor_production__`). Migrar dados existentes via UPDATE.

### Código
- `src/lib/materialsList.ts`: nova função `buildConsolidatedMaterials(bridges, components)` que soma quantidades por `component_id` mantendo `breakdown` por ponte.
- `src/hooks/useProcurement.ts`: refatorar `loadAndSync` para usar a lista consolidada; preservar `qty` editado manualmente (igual a `unit_price_ref` hoje).
- `src/components/ProcurementList.tsx`: substituir agrupamento por-ponte por agrupamento por-categoria; adicionar input editável para `qty` e `in_stock`; adicionar toggle de visão; renomear botão de importação.
- `src/data/procurementBaseline.ts`: novo arquivo com preços/qty referência do orçamento Carvalho Pinto Rev1.

### Comportamento de migração
Orçamentos existentes (com linhas por ponte): no próximo `loadAndSync`, o sistema **consolida** as linhas duplicadas por `component_id`, somando `qty`. Itens com `amount_paid > 0` ou `purchase_status != 'nao'` em múltiplas pontes ficam preservados como linhas separadas (não consolidadas) para não perder histórico de compras.

## Fora de escopo
- Múltiplos fornecedores/cotações por item (pode vir depois).
- Alertas de reposição automática.
- Integração com NFe/notas.
