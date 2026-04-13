

## Plano: DOCX fiel ao template + Quantidade de kits solar/conectividade

### 1. Adicionar campos de quantidade de kits na configuracao de ponte

**`src/data/bridgeConfig.ts`** — Adicionar campos:
- `solarKitCount: number` (default: 1)
- `connectivityKitCount: number` (default: 1)

**`src/components/BridgeConfig.tsx`** — Adicionar inputs para "Qtd. Kit Solar" e "Qtd. Kit Conectividade" no grid de configuracao de cada ponte.

**`src/lib/budgetCalculations.ts`** — Multiplicar custo de energia por `bridge.solarKitCount` (quando Solar) e custo de conectividade por `bridge.connectivityKitCount`.

### 2. Reescrever DOCX para seguir layout identico ao template

**`src/lib/generateDocx.ts`** — Reescrita completa para replicar fielmente o documento enviado:

**Estrutura de secoes (texto identico ao template):**
- **Capa (pagina 1)**: Logo d2win + SoraLab no header, titulo "Proposta Comercial: Monitoramento Estrutural Continuo e Gemeos Digitais", Data/Revisao/Responsavel, secao "1. Objeto" com tabela de OAEs e texto introdutorio identico ao template
- **Paginas 2-3**: Secao "2. Justificativa e Objetivos" com subsecoes 2.1.1 a 2.1.4 — texto completo do template (Deteccao de Alteracoes, Analise de Cargas, Suporte a Decisao, Inovacao)
- **Paginas 3-4**: Secao "3. Escopo Resumido" com subsecoes 3.1, 3.2, 3.3 — texto completo do template
- **Paginas 4-5**: Secoes "4. Premissas" e "5. Responsabilidades da Contratada" — texto completo do template
- **Paginas 6-7**: Secao "6. Investimentos" — tabelas dinamicas no formato exato do template:
  - 6.1 Equipamentos: tabela 2 colunas (header navy, "Sensores, Conectividade e Infra" / TOTAL), texto descritivo por extenso
  - 6.2 Engenharia e Modelagem: tabela 2 colunas (header navy, "Custos Modelagem..." / TOTAL), texto descritivo por extenso
  - 6.3.1 Pacote CAPEX: tabela 4 colunas (vazio | Sensores/Conect/Infra | Custos Modelagem | TOTAL GERAL), texto descritivo por extenso
  - 6.3.2 Acompanhamento Mensal: texto com valor e extenso
- **Pagina 8**: Secoes 7 (Dados da Contratada com SORALAB, D2WIN, CASAGRANDE), 8 (Validade 60 dias), 9 (De Acordo)
- **Pagina 9**: Texto de autorizacao formal + campos de assinatura

**Header/Footer identicos ao template:**
- Header: logo d2win + SoraLab a esquerda (sem Casagrande, pois e do cliente)
- Footer: "d2win - Digital Twins Solutions" centralizado

**Estilo das tabelas:** Header navy (#1A2744) com texto branco bold, corpo com fundo branco, bordas finas — identico ao template.

### Arquivos modificados
- `src/data/bridgeConfig.ts` — 2 campos novos
- `src/components/BridgeConfig.tsx` — 2 inputs novos
- `src/lib/budgetCalculations.ts` — multiplicar por quantidade de kits
- `src/lib/generateDocx.ts` — reescrita completa para layout do template

