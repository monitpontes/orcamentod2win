import { useState } from "react";
import { ComponentItem, categories } from "@/data/components";
import { formatCurrency } from "@/lib/budgetCalculations";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package } from "lucide-react";

interface Props {
  components: ComponentItem[];
  onUpdate: (components: ComponentItem[]) => void;
}

export default function ComponentCatalog({ components, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = components.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePriceChange = (id: string, value: string) => {
    const numVal = parseFloat(value.replace(",", "."));
    if (isNaN(numVal)) return;
    onUpdate(
      components.map((c) => (c.id === id ? { ...c, unitPrice: numVal } : c))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-accent" />
        <h2 className="text-2xl font-heading font-bold text-foreground">
          Catálogo de Componentes
        </h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setActiveCategory(null)}
        >
          Todos
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-4 py-3 text-left font-heading font-semibold">Código</th>
              <th className="px-4 py-3 text-left font-heading font-semibold">Item</th>
              <th className="px-4 py-3 text-left font-heading font-semibold">Unidade</th>
              <th className="px-4 py-3 text-left font-heading font-semibold">Categoria</th>
              <th className="px-4 py-3 text-right font-heading font-semibold">Valor Unitário</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr
                key={item.id}
                className={`border-t transition-colors hover:bg-muted/50 ${
                  idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                }`}
              >
                <td className="px-4 py-3 font-heading font-medium text-accent">
                  {item.id}
                </td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Input
                    type="text"
                    defaultValue={item.unitPrice.toFixed(2)}
                    onBlur={(e) => handlePriceChange(item.id, e.target.value)}
                    className="w-32 text-right ml-auto font-heading text-sm h-8"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {components.length} itens • Clique nos valores para editar
      </p>
    </div>
  );
}
