## Detalhamento de Conectividade e Energia na seção 6.1 do Word

### Objetivo
Quebrar as linhas "Conectividade" e "Energia" da tabela 6.1 em sub-itens, mostrando o que de fato compõe cada valor (com quantidades reais agregadas das pontes).

### Nova estrutura da tabela 6.1

```text
Item                                              Quantidade        Valor
────────────────────────────────────────────────────────────────────────────
Sensores                                           N un.            R$ ...
  (já com texto de 2 sensores/viga acima)

Conectividade                                                       R$ ... (subtotal, negrito)
  Roteador                                         N un.            R$ ...
  Modem                                            N un.            R$ ...
  Chip de celular (apenas Conexão Completa)        N un.            R$ ...

Caixa de Comando                                   —                R$ ...

Energia                                                             R$ ... (subtotal, negrito)
  Kit Solar Completo (painel, MPPT, bateria...)    N un.            R$ ...   ← se houver Solar
  Kit Rede Elétrica                                N un.            R$ ...   ← se houver Rede

Infraestrutura (eletrodutos, cabos, caixas)        —                R$ ...

TOTAL                                                               R$ ... (negrito)
```

Os sub-itens aparecem indentados (prefixo "    ") e só são listados quando a quantidade > 0 (ex.: linha do Kit Solar some se nenhuma ponte usar Solar; linha do Chip some se todas forem "Parcial").

### Lógica de quantidades (agregada de todas as pontes)

**Conectividade** — `bridge.connectivityKitCount` por ponte:
- Roteadores = soma de `connectivityKitCount` (todas as pontes)
- Modems    = soma de `connectivityKitCount` (todas as pontes)
- Chips     = soma de `connectivityKitCount` apenas das pontes com `connectivity === "Completa"`

Valores (com markupFactor) calculados a partir dos preços dos componentes individuais (CN01 modem, CN03 roteador, CN04 chip), garantindo que a soma dos sub-itens bata com `connectivityValue` atual.

**Energia** — separado por fonte:
- Kits Solares = soma de `solarKitCount` das pontes com `energySource === "Solar"`
- Kits Rede   = nº de pontes com `energySource === "Rede"`

Valores: `SOL-KIT × nKitsSolar × markupFactor` e `REDE × nKitsRede × markupFactor`. Soma confere com `energyValue`.

### Texto descritivo (parágrafo curto antes ou após a tabela)

Adicionar 2 frases:
- "A **Conectividade** contempla, para cada ponto de comunicação, 1 roteador e 1 modem; nas conexões do tipo *Completa*, inclui também chip de celular para transmissão dos dados."
- "A **Energia** é fornecida via *Kit Solar Completo* (painel 435 W, controlador MPPT, bateria estacionária 200 Ah e acessórios) ou via *Kit Rede Elétrica* (alimentação a partir da rede existente da OAE), conforme a infraestrutura disponível em cada ponte."

### Arquivo modificado
- `src/lib/generateDocx.ts` — função `buildInvestmentSection` (linhas ~560-640): adicionar cálculos auxiliares (qtd e valor por sub-item), inserir as linhas-pai com subtotal em negrito e as sub-linhas indentadas (apenas quando qtd > 0), e adicionar o parágrafo descritivo.

### Sem mudanças
- `budgetCalculations.ts` (valores totais idênticos)
- Tela / PDF (alteração restrita ao Word)
