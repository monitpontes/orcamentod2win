

## Plano: Gerar proposta em DOCX ao invés de PDF

Substituir a exportação em PDF por uma exportação em DOCX (Word), seguindo o padrão da proposta comercial enviada. O DOCX será gerado no browser usando a biblioteca `docx` (docx-js).

### Estrutura do documento (baseada no template)

O DOCX gerado terá a mesma estrutura da proposta enviada:

1. **Capa** — Logo d2win, titulo "Proposta Comercial: Monitoramento Estrutural Continuo e Gemeos Digitais", data, revisao, responsavel, secao "Objeto" com lista das OAEs
2. **Justificativa e Objetivos** — Texto fixo extraido do template (secoes 2.1.1 a 2.1.4)
3. **Escopo Resumido** — Texto fixo (secoes 3.1, 3.2, 3.3)
4. **Premissas e Responsabilidades** — Texto fixo (secoes 4, 5)
5. **Investimentos** — Tabelas dinamicas com dados do orcamento (equipamentos por OAE, modelagem/engenharia, resumo CAPEX, acompanhamento mensal) com estilo navy header + branco texto
6. **Dados da Contratada** — d2win/SoraLab (texto fixo)
7. **Validade da Proposta** — 60 dias (texto fixo)
8. **De Acordo** — Linha para assinatura

Cada pagina tera header com logo d2win e footer "d2win - Digital Twins Solutions".

### Alteracoes

1. **Instalar dependencia**: `npm install docx file-saver` + `@types/file-saver`
2. **Criar `src/lib/generateDocx.ts`**: Novo arquivo que gera o DOCX multi-pagina usando `docx` (Document, Packer, Paragraph, Table, etc.), com:
   - Header/footer em todas as paginas (logo + texto)
   - Tabelas estilizadas (header azul navy #1a2744, texto branco)
   - Dados dinamicos do orcamento nas tabelas de investimento
   - Texto fixo das secoes do template
   - Download via `file-saver`
3. **Atualizar `src/components/BudgetSummary.tsx`**: Trocar import de `generateBudgetPdf` por `generateBudgetDocx`, alterar texto do botao de "Exportar PDF" para "Exportar Word"
4. **Logo**: Converter o base64 JPEG existente em `logoBase64.ts` para Buffer para uso no ImageRun do docx-js

### Arquivos modificados
- `package.json` — adicionar `docx` e `file-saver`
- `src/lib/generateDocx.ts` — novo arquivo (gerador DOCX completo)
- `src/components/BudgetSummary.tsx` — trocar chamada PDF por DOCX
- `src/lib/generatePdf.ts` — manter (pode ser removido depois se nao for mais necessario)

### Detalhes tecnicos
- `docx` (docx-js) roda 100% no browser, sem backend
- `Packer.toBlob()` gera o blob, `file-saver` faz o download
- Tabelas usarao `WidthType.DXA` para compatibilidade
- Logo sera convertido de base64 para Uint8Array para o ImageRun

