// Tipos alinhados com o banco de dados Supabase (schema public)
// Estes tipos refletem a estrutura real das tabelas

import { Tables } from '@/integrations/supabase/types';

// ============= Tipos das Tabelas =============

export type EmissaoDB = Tables<'emissoes'>;
export type SerieDB = Tables<'series'>;
export type HistoricoEmissaoDB = Tables<'historico_emissoes'>;
export type CustosEmissaoDB = Tables<'custos_emissao'>;
export type CustosLinhasDB = Tables<'custos_linhas'>;
export type TerceiroDB = Tables<'terceiros'>;
export type PrestadorDB = Tables<'prestadores'>;
export type UsuarioDB = Tables<'usuarios'>;

// ============= Status da Proposta =============

export type StatusProposta = 
  | 'rascunho' 
  | 'enviada' 
  | 'aceita' 
  | 'recusada' 
  | 'finalizada' 
  | 'estruturacao'
  | 'em_estruturacao';

export const STATUS_PROPOSTA_LABELS: Record<StatusProposta, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aceita: 'Aceita',
  recusada: 'Recusada',
  finalizada: 'Finalizada',
  estruturacao: 'Em Estruturação',
  em_estruturacao: 'Em Estruturação',
};

export const STATUS_PROPOSTA_COLORS: Record<StatusProposta, string> = {
  rascunho: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  enviada: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  aceita: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  recusada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  finalizada: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  estruturacao: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  em_estruturacao: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

// ============= Emissão Estendida =============

export interface EmissaoComSeries extends EmissaoDB {
  series?: SerieDB[];
}

// ============= Filtros =============

export interface EmissaoFilterState {
  search: string;
  status?: StatusProposta[];
  categoria?: string[];
  veiculo?: string[];
}
