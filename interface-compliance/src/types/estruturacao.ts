// Tipos do schema 'estruturacao' - Interface de Estruturação

// ============= Status Types =============

export type StatusDocumento = 'pendente' | 'em_revisao' | 'aprovado' | 'rejeitado';
export type TipoDocumento = 
  | 'term_sheet' 
  | 'contrato' 
  | 'due_diligence' 
  | 'parecer_juridico'
  | 'rating'
  | 'prospecto'
  | 'anuncio_inicio'
  | 'anuncio_encerramento'
  | 'outros';

export type TipoInvestidor = 'qualificado' | 'profissional' | 'varejo';
export type StatusAlocacao = 'reservado' | 'confirmado' | 'liquidado' | 'cancelado';
export type TipoEventoFluxo = 'amortizacao' | 'juros' | 'despesa' | 'receita';
export type StatusEvento = 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';

// ============= Interfaces =============

export interface DocumentoEmissao {
  id: string;
  id_emissao: string;
  nome_documento: string;
  url_documento: string;
  tipo_documento: TipoDocumento;
  status: StatusDocumento;
  versao: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Investidor {
  id: string;
  nome: string;
  email: string;
  cpf_cnpj: string;
  tipo_investidor: TipoInvestidor;
  criado_em: string;
}

export interface AlocacaoInvestidor {
  id: string;
  id_serie: string;
  id_investidor: string;
  valor_alocado: number;
  status: StatusAlocacao;
  data_alocacao: string;
  // Joins
  investidor?: Investidor;
}

export interface FluxoCaixaProjetado {
  id: string;
  id_serie: string;
  data_evento: string;
  tipo_evento: TipoEventoFluxo;
  valor_projetado: number;
  criado_em: string;
}

export interface EventoChave {
  id: string;
  id_emissao: string;
  nome_evento: string;
  data_prevista: string | null;
  data_realizada: string | null;
  status: StatusEvento;
  responsavel: string | null;
  criado_em: string;
}

// ============= Insert/Update Types =============

export interface DocumentoEmissaoInsert {
  id_emissao: string;
  nome_documento: string;
  url_documento: string;
  tipo_documento: TipoDocumento;
  status?: StatusDocumento;
  versao?: number;
}

export interface InvestidorInsert {
  nome: string;
  email: string;
  cpf_cnpj: string;
  tipo_investidor: TipoInvestidor;
}

export interface AlocacaoInvestidorInsert {
  id_serie: string;
  id_investidor: string;
  valor_alocado: number;
  status?: StatusAlocacao;
}

export interface FluxoCaixaProjetadoInsert {
  id_serie: string;
  data_evento: string;
  tipo_evento: TipoEventoFluxo;
  valor_projetado: number;
}

export interface EventoChaveInsert {
  id_emissao: string;
  nome_evento: string;
  data_prevista?: string | null;
  data_realizada?: string | null;
  status?: StatusEvento;
  responsavel?: string | null;
}

// ============= Labels =============

export const STATUS_DOCUMENTO_LABELS: Record<StatusDocumento, string> = {
  pendente: 'Pendente',
  em_revisao: 'Em Revisão',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  term_sheet: 'Term Sheet',
  contrato: 'Contrato',
  due_diligence: 'Due Diligence',
  parecer_juridico: 'Parecer Jurídico',
  rating: 'Rating',
  prospecto: 'Prospecto',
  anuncio_inicio: 'Anúncio de Início',
  anuncio_encerramento: 'Anúncio de Encerramento',
  outros: 'Outros',
};

export const TIPO_INVESTIDOR_LABELS: Record<TipoInvestidor, string> = {
  qualificado: 'Qualificado',
  profissional: 'Profissional',
  varejo: 'Varejo',
};

export const STATUS_ALOCACAO_LABELS: Record<StatusAlocacao, string> = {
  reservado: 'Reservado',
  confirmado: 'Confirmado',
  liquidado: 'Liquidado',
  cancelado: 'Cancelado',
};

export const TIPO_EVENTO_FLUXO_LABELS: Record<TipoEventoFluxo, string> = {
  amortizacao: 'Amortização',
  juros: 'Juros',
  despesa: 'Despesa',
  receita: 'Receita',
};

export const STATUS_EVENTO_LABELS: Record<StatusEvento, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  atrasado: 'Atrasado',
};

// ============= Colors =============

export const STATUS_DOCUMENTO_COLORS: Record<StatusDocumento, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  em_revisao: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  aprovado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejeitado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const STATUS_ALOCACAO_COLORS: Record<StatusAlocacao, string> = {
  reservado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  liquidado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export const STATUS_EVENTO_COLORS: Record<StatusEvento, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  concluido: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  atrasado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};
