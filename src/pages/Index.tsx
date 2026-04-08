import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultComponents, ComponentItem } from "@/data/components";
import { BridgeSpan, createDefaultBridge } from "@/data/bridgeConfig";
import { calculateBudgetSummary } from "@/lib/budgetCalculations";
import ComponentCatalog from "@/components/ComponentCatalog";
import BridgeConfig from "@/components/BridgeConfig";
import BudgetSummary from "@/components/BudgetSummary";
import { Activity } from "lucide-react";

export default function Index() {
  const [components, setComponents] = useState<ComponentItem[]>(defaultComponents);
  const [bridges, setBridges] = useState<BridgeSpan[]>([createDefaultBridge()]);
  const [clientName, setClientName] = useState("");
  const [bdiRate, setBdiRate] = useState(0.3);
  const [taxRate, setTaxRate] = useState(0.2);
  const [markup, setMarkup] = useState(3);

  const summary = useMemo(
    () => calculateBudgetSummary(bridges, components, bdiRate, taxRate, markup),
    [bridges, components, bdiRate, taxRate, markup]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
            <Activity className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold tracking-tight">
              VibMonitor
            </h1>
            <p className="text-xs text-primary-foreground/70">
              Sistema de Orçamentos — Monitoramento de Vibração em Pontes
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="budget" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="catalog" className="font-heading text-xs">
              Componentes
            </TabsTrigger>
            <TabsTrigger value="bridges" className="font-heading text-xs">
              Pontes
            </TabsTrigger>
            <TabsTrigger value="budget" className="font-heading text-xs">
              Orçamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <ComponentCatalog components={components} onUpdate={setComponents} />
          </TabsContent>

          <TabsContent value="bridges">
            <BridgeConfig bridges={bridges} onUpdate={setBridges} />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetSummary
              summary={summary}
              clientName={clientName}
              onBdiChange={setBdiRate}
              onTaxChange={setTaxRate}
              onMarkupChange={setMarkup}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
