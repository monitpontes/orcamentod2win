export interface ComponentItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  category: string;
  notes?: string;
}

export const defaultComponents: ComponentItem[] = [
  // Sensores
  { id: "S01", name: "Placa + Componentes do sensor", unit: "Unid.", unitPrice: 357.27, category: "Sensores" },
  { id: "S02", name: "Cartão de Memória para o sensor", unit: "Unid.", unitPrice: 41.20, category: "Sensores" },
  { id: "S03", name: "Valor da hora de produção do sensor", unit: "Unid.", unitPrice: 200.00, category: "Sensores" },
  { id: "S04", name: "Estação Meteorológica", unit: "Unid.", unitPrice: 200.00, category: "Sensores" },
  // Caixa de Comando
  { id: "CC01", name: "Caixa de comando", unit: "Unid.", unitPrice: 150.00, category: "Caixa de Comando" },
  { id: "CC02", name: "Fonte 12V", unit: "Unid.", unitPrice: 82.90, category: "Caixa de Comando" },
  { id: "CC03", name: "Disjuntor DC", unit: "Unid.", unitPrice: 11.14, category: "Caixa de Comando" },
  { id: "CC04", name: "Sensor de Temperatura e Corrente", unit: "Unid.", unitPrice: 133.36, category: "Caixa de Comando" },
  { id: "CC05", name: "Montagem das caixas", unit: "Horas", unitPrice: 200.00, category: "Caixa de Comando" },
  { id: "CC06", name: "Conversor AC/DC", unit: "Unid.", unitPrice: 25.30, category: "Caixa de Comando" },
  // Conectividade
  { id: "CN01", name: "Modem", unit: "Unid.", unitPrice: 500.00, category: "Conectividade" },
  { id: "CN02", name: "Adequação de banco de dados", unit: "Horas", unitPrice: 200.00, category: "Conectividade" },
  { id: "CN03", name: "Roteador", unit: "Unid.", unitPrice: 300.00, category: "Conectividade" },
  { id: "CN04", name: "Chip de celular", unit: "Unid.", unitPrice: 20.00, category: "Conectividade" },
  { id: "CN05", name: "Plano de celular", unit: "Unid.", unitPrice: 40.00, category: "Conectividade" },
  { id: "CN06", name: "Banco de dados (Custo Mensal p/ vão)", unit: "Unid.", unitPrice: 50.00, category: "Conectividade" },
  { id: "CN07", name: "API Render", unit: "Unid.", unitPrice: 90.00, category: "Conectividade" },
  { id: "CN08", name: "Switch", unit: "Unid.", unitPrice: 200.00, category: "Conectividade" },
  // Projeto
  { id: "P01", name: "Modelagem", unit: "Unid.", unitPrice: 9800.00, category: "Projeto e Simulação" },
  { id: "P02", name: "Simulação", unit: "Unid.", unitPrice: 5900.00, category: "Projeto e Simulação" },
  // Infraestrutura
  { id: "INF01", name: "Eletrodutos galvanizados 3m", unit: "Metros", unitPrice: 183.30, category: "Infraestrutura" },
  { id: "INF02", name: "Cabos 2,5mm² (100m)", unit: "Metros", unitPrice: 400.00, category: "Infraestrutura" },
  { id: "INF03", name: "Caixas de passagem", unit: "Unid.", unitPrice: 24.15, category: "Infraestrutura" },
  { id: "INF04", name: "Condulete", unit: "Unid.", unitPrice: 7.50, category: "Infraestrutura" },
  { id: "INF05", name: "Kit Conector Wago", unit: "Unid.", unitPrice: 342.07, category: "Infraestrutura" },
  { id: "INF06", name: "Abraçadeiras e Parafusos", unit: "Unid.", unitPrice: 10.00, category: "Infraestrutura" },
  // Energia Solar
  { id: "PS01", name: "Painel Solar 435W", unit: "Unid.", unitPrice: 449.00, category: "Energia Solar" },
  { id: "PS02", name: "Controlador MPPT 20A", unit: "Unid.", unitPrice: 739.00, category: "Energia Solar" },
  { id: "PS03", name: "Conector MC4", unit: "Unid.", unitPrice: 29.00, category: "Energia Solar" },
  { id: "PS04", name: "Cooler", unit: "Unid.", unitPrice: 139.90, category: "Energia Solar" },
  { id: "PS05", name: "Bateria Estacionária 12V 200Ah", unit: "Unid.", unitPrice: 1200.00, category: "Energia Solar" },
  // Kits / Pacotes
  { id: "SOL-KIT", name: "Kit Solar Completo", unit: "Unid.", unitPrice: 2918.04, category: "Pacotes" },
  { id: "REDE", name: "Kit Rede Elétrica", unit: "Unid.", unitPrice: 602.70, category: "Pacotes" },
  { id: "CON1", name: "Conexão Completa", unit: "Unid.", unitPrice: 1020.00, category: "Pacotes", notes: "1 roteador, 1 modem, chip" },
  { id: "CON2", name: "Conexão Parcial", unit: "Unid.", unitPrice: 1000.00, category: "Pacotes", notes: "1 roteador, 1 modem" },
  { id: "MEN", name: "Mensalidade", unit: "Unid.", unitPrice: 25.00, category: "Pacotes" },
];

export const categories = [
  "Sensores",
  "Caixa de Comando",
  "Conectividade",
  "Projeto e Simulação",
  "Infraestrutura",
  "Energia Solar",
  "Pacotes",
];
