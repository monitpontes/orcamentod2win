

## Plano: Multiplicar Modelagem e Engenharia pela quantidade de vãos

### Alteração

**`src/lib/budgetCalculations.ts`** — Na função `calculateBridgeCosts`, multiplicar o custo de modelagem e engenharia por `bridge.spanCount`:

```typescript
// Antes:
const modelingEngineering =
  getComponentPrice(components, "P01") +
  getComponentPrice(components, "P02") +
  getComponentPrice(components, "CN02") * bridge.hoursAdequation;

// Depois:
const modelingEngineering =
  (getComponentPrice(components, "P01") +
   getComponentPrice(components, "P02") +
   getComponentPrice(components, "CN02") * bridge.hoursAdequation) * bridge.spanCount;
```

### Arquivo modificado
- `src/lib/budgetCalculations.ts` — 1 linha alterada

