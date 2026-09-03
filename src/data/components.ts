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
  { id: "S01", name: "Placa do sensor", unit: "Unid.", unitPrice: 357.27, category: "Sensores" },
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
  { id: "P01", name: "Modelagem (por vão)", unit: "Vão", unitPrice: 4900.00, category: "Projeto e Simulação" },
  { id: "P02", name: "Simulação (por vão)", unit: "Vão", unitPrice: 2950.00, category: "Projeto e Simulação" },
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
  // Energia Solar - Conjunto (por kit)
  { id: "PS06", name: "Painel Solar 150Wp", unit: "Unid.", unitPrice: 259.00, category: "Energia Solar" },
  { id: "PS07", name: "Bateria 40Ah", unit: "Unid.", unitPrice: 389.70, category: "Energia Solar" },
  { id: "PS08", name: "Caixa de comando (conjunto solar)", unit: "Unid.", unitPrice: 334.33, category: "Energia Solar" },
  { id: "PS09", name: "Grade do cooler", unit: "Unid.", unitPrice: 15.00, category: "Energia Solar" },
  { id: "PS10", name: "Filtro do cooler", unit: "Unid.", unitPrice: 4.00, category: "Energia Solar" },
  { id: "PS11", name: "Terminal Olhal", unit: "Unid.", unitPrice: 0.34, category: "Energia Solar" },
  // Energia Rede
  { id: "ER01", name: "Conversor AC/DC 220V-12V", unit: "Unid.", unitPrice: 25.30, category: "Energia Rede" },
  { id: "ER02", name: "Disjuntor AC", unit: "Unid.", unitPrice: 20.00, category: "Energia Rede" },
  { id: "ER03", name: "Cabo PP 3x2,5mm² (rolo)", unit: "Unid.", unitPrice: 350.00, category: "Energia Rede" },
  { id: "ER04", name: "Tomada/plug industrial", unit: "Unid.", unitPrice: 45.00, category: "Energia Rede" },
  { id: "ER05", name: "Dispositivo de proteção (DPS)", unit: "Unid.", unitPrice: 162.40, category: "Energia Rede" },
  // Instalação
  { id: "INST01", name: "Mão de obra (diária por técnico)", unit: "Diária", unitPrice: 500.00, category: "Instalação" },
  { id: "INST02", name: "Deslocamento", unit: "Unid.", unitPrice: 1500.00, category: "Instalação" },
  { id: "INST03", name: "Hospedagem e alimentação (diária)", unit: "Diária", unitPrice: 350.00, category: "Instalação" },
  // Kits / Pacotes
  { id: "CON1", name: "Conexão Completa", unit: "Unid.", unitPrice: 1020.00, category: "Pacotes", notes: "1 roteador, 1 modem, chip" },
  { id: "CON2", name: "Conexão Parcial", unit: "Unid.", unitPrice: 1000.00, category: "Pacotes", notes: "1 roteador, 1 modem" },
  { id: "MEN", name: "Mensalidade", unit: "Unid.", unitPrice: 25.00, category: "Pacotes" },
  // Infraestrutura de Terceiros (executado por empresa contratada)
  { id: "TER01", name: "Serviços Preliminares (mobilização, sinalização, canteiro, plataforma)", unit: "vb", unitPrice: 556183.62, category: "Infraestrutura de Terceiros", notes: "Serviço executado por terceiro contratado" },
  { id: "TER02", name: "Cabeamento (cabos flexíveis 2,5mm²)", unit: "vb", unitPrice: 73341.00, category: "Infraestrutura de Terceiros", notes: "Serviço executado por terceiro contratado" },
  { id: "TER03", name: "Eletrodutos e Conduítes", unit: "vb", unitPrice: 128420.91, category: "Infraestrutura de Terceiros", notes: "Serviço executado por terceiro contratado" },
  { id: "TER04", name: "Fixação e Abraçadeiras (eletrodutos e caixas)", unit: "vb", unitPrice: 26858.25, category: "Infraestrutura de Terceiros", notes: "Serviço executado por terceiro contratado" },
  { id: "TER05", name: "Estrutura dos Postes (13 postes)", unit: "vb", unitPrice: 245085.36, category: "Infraestrutura de Terceiros", notes: "Serviço executado por terceiro contratado" },
  { id: "TER06", name: "Fixação dos Postes na Estrutura", unit: "vb", unitPrice: 18160.49, category: "Infraestrutura de Terceiros", notes: "Serviço executado por terceiro contratado" },
  { id: "TER07", name: "Caixas e Conduletes", unit: "vb", unitPrice: 14735.26, category: "Infraestrutura de Terceiros", notes: "Serviço executado por terceiro contratado" },
  { id: "TER08", name: "Conexões Elétricas (Wago, terminais)", unit: "vb", unitPrice: 15956.02, category: "Infraestrutura de Terceiros", notes: "Serviço executado por terceiro contratado" },
  { id: "TER09", name: "Materiais Complementares (graxa, fitas, abraçadeiras)", unit: "vb", unitPrice: 11259.09, category: "Infraestrutura de Terceiros", notes: "Serviço executado por terceiro contratado" },
];

export const categories = [
  "Sensores",
  "Caixa de Comando",
  "Conectividade",
  "Projeto e Simulação",
  "Infraestrutura",
  "Energia Solar",
  "Energia Rede",
  "Instalação",
  "Pacotes",
  "Infraestrutura de Terceiros",
];

/** Garante que componentes novos do catálogo padrão existam em orçamentos salvos. */
export function mergeWithDefaultComponents(saved: ComponentItem[]): ComponentItem[] {
  const ids = new Set(saved.map((c) => c.id));
  const missing = defaultComponents.filter((c) => !ids.has(c.id));
  return [...saved.filter((c) => c.id !== "SOL-KIT" && c.id !== "REDE"), ...missing];
}
