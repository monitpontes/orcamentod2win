

## Plan: Header branco com logo no PDF

Alterar o cabeçalho do PDF para ter fundo branco (em vez de azul marinho), mantendo o logo legível. O texto do header passa a usar a cor primária (navy) em vez de branco. A faixa de destaque cyan permanece como separador.

### Alterações em `src/lib/generatePdf.ts`

1. **Header**: Trocar `doc.setFillColor(...PRIMARY)` por `doc.setFillColor(...WHITE)` no retângulo do header (ou remover o retângulo, já que o fundo da página já é branco)
2. **Texto do header**: Trocar `doc.setTextColor(...WHITE)` por `doc.setTextColor(...PRIMARY)` para "d2win", subtítulo e "PROPOSTA COMERCIAL"
3. **Data**: Também trocar para cor PRIMARY
4. Manter a faixa accent cyan como separador visual abaixo do header

Apenas 1 arquivo modificado, ~4 linhas alteradas.

