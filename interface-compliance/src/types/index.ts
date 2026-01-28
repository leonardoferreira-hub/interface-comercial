// Tipos principais do sistema de emissões

export type TipoEmissao = 'CRI' | 'CRA' | 'CR' | 'FIDC' | 'FII' | 'FIAGRO' | 'DEBENTURE';

export type StatusEmissao = 
  | 'em_estruturacao' 
  | 'em_analise' 
  | 'aguardando_documentos' 
  | 'em_registro' 
  | 'registrado' 
  | 'liquidado' 
  | 'cancelado'
  // DB statuses (from public.emissoes)
  | 'rascunho'
  | 'enviada'
  | 'aceita'
  | 'recusada'
  | 'finalizada'
  | 'estruturacao';

export type StatusPendencia = 'pendente' | 'em_andamento' | 'concluido';

export type PrioridadePendencia = 'baixa' | 'media' | 'alta' | 'urgente';

export type CategoriaPendencia = 
  | 'documentacao' 
  | 'analise_credito' 
  | 'estruturacao' 
  | 'registro' 
  | 'outros';

export interface Serie {
  id: string;
  numero: string;
  valor_nominal: number;
  quantidade_titulos: number;
  taxa_juros: number;
  tipo_taxa: 'prefixado' | 'pos_fixado' | 'hibrido';
  indexador?: 'CDI' | 'IPCA' | 'IGP-M' | 'SELIC' | 'TR';
  spread?: number;
  data_vencimento: string;
  periodicidade_juros: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'bullet';
  amortizacao: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'bullet';
  garantias?: string;
  rating?: string;
  agencia_rating?: string;
}

export interface Emissao {
  id: string;
  codigo: string;
  nome: string;
  tipo: TipoEmissao;
  status: StatusEmissao;
  
  // Datas
  data_emissao?: string;
  data_registro?: string;
  data_liquidacao?: string;
  data_vencimento?: string;
  created_at: string;
  updated_at: string;
  
  // Valores
  valor_total: number;
  valor_captado?: number;
  
  // Partes envolvidas
  originador: string;
  cedente?: string;
  servicer?: string;
  custodiante?: string;
  escriturador?: string;
  coordenador_lider?: string;
  agente_fiduciario?: string;
  assessor_legal_emissor?: string;
  assessor_legal_coordenador?: string;
  auditor?: string;
  agencia_rating?: string;
  
  // Séries
  series: Serie[];
  
  // Documentos e controle
  numero_registro_cvm?: string;
  numero_registro_anbima?: string;
  oferta_publica: boolean;
  esforcos_restritos: boolean;
  
  // Lastro
  tipo_lastro?: string;
  descricao_lastro?: string;
  
  // Observações
  observacoes?: string;
  
  // Contagem de pendências
  pendencias_count?: number;
}

export interface Pendencia {
  id: string;
  emissao_id: string;
  emissao_codigo?: string;
  emissao_nome?: string;
  titulo: string;
  descricao?: string;
  status: StatusPendencia;
  prioridade: PrioridadePendencia;
  categoria: CategoriaPendencia;
  responsavel?: string;
  data_limite?: string;
  data_conclusao?: string;
  created_at: string;
  updated_at: string;
  observacoes?: string;
}

export interface HistoricoEntry {
  id: string;
  emissao_id: string;
  emissao: Emissao;
  tipo_evento: 'liquidacao' | 'cancelamento' | 'alteracao';
  data_evento: string;
  motivo?: string;
  usuario?: string;
  detalhes?: Record<string, unknown>;
}

export interface DashboardMetrics {
  total_emissoes: number;
  valor_total_emitido: number;
  emissoes_ativas: number;
  valor_ativo: number;
  emissoes_mes: number;
  valor_mes: number;
  pendencias_abertas: number;
  pendencias_atrasadas: number;
  taxa_conclusao_sla: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface FilterState {
  search: string;
  tipo?: TipoEmissao[];
  status?: StatusEmissao[];
  originador?: string[];
  periodo?: {
    inicio?: string;
    fim?: string;
  };
}

export interface PendenciaFilterState {
  search: string;
  status?: StatusPendencia[];
  prioridade?: PrioridadePendencia[];
  categoria?: CategoriaPendencia[];
  responsavel?: string[];
}

// Labels para exibição
export const STATUS_LABELS: Record<StatusEmissao, string> = {
  em_estruturacao: 'Em Estruturação',
  em_analise: 'Em Análise',
  aguardando_documentos: 'Aguardando Documentos',
  em_registro: 'Em Registro',
  registrado: 'Registrado',
  liquidado: 'Liquidado',
  cancelado: 'Cancelado',
  // DB statuses
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aceita: 'Aceita',
  recusada: 'Recusada',
  finalizada: 'Finalizada',
  estruturacao: 'Em Estruturação',
};

export const STATUS_COLORS: Record<StatusEmissao, string> = {
  em_estruturacao: 'bg-blue-100 text-blue-800',
  em_analise: 'bg-yellow-100 text-yellow-800',
  aguardando_documentos: 'bg-orange-100 text-orange-800',
  em_registro: 'bg-purple-100 text-purple-800',
  registrado: 'bg-green-100 text-green-800',
  liquidado: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-red-100 text-red-800',
  // DB statuses
  rascunho: 'bg-gray-100 text-gray-800',
  enviada: 'bg-blue-100 text-blue-800',
  aceita: 'bg-green-100 text-green-800',
  recusada: 'bg-red-100 text-red-800',
  finalizada: 'bg-purple-100 text-purple-800',
  estruturacao: 'bg-indigo-100 text-indigo-800',
};

export const PRIORIDADE_LABELS: Record<PrioridadePendencia, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const PRIORIDADE_COLORS: Record<PrioridadePendencia, string> = {
  baixa: 'bg-gray-100 text-gray-800',
  media: 'bg-blue-100 text-blue-800',
  alta: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800',
};

export const CATEGORIA_LABELS: Record<CategoriaPendencia, string> = {
  documentacao: 'Documentação',
  analise_credito: 'Análise de Crédito',
  estruturacao: 'Estruturação',
  registro: 'Registro',
  outros: 'Outros',
};

export const STATUS_PENDENCIA_LABELS: Record<StatusPendencia, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
};
