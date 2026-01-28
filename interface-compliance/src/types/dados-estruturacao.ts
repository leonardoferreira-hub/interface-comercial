// Tipos para dados complementares de estruturação

export type StatusOkNok = 'ok' | 'nok' | 'pendente';
export type StatusBoletagem = 'sim' | 'nao' | 'na' | 'pendente';

export interface DadosEstruturacao {
  id: string;
  id_emissao: string;
  
  // PMO e Analistas
  pmo_id: string | null;
  analista_financeiro_id: string | null;
  analista_contabil_id: string | null;
  analista_gestao_id: string | null;
  
  // Datas
  previsao_liquidacao: string | null;
  data_liquidacao: string | null;
  primeira_data_pagamento: string | null;
  data_df: string | null;
  data_entrada_pipe: string | null;
  
  // Dados Bancários
  banco: string | null;
  agencia: string | null;
  conta_bancaria: string | null;
  
  // Status/Flags
  compliance: StatusOkNok;
  boletagem: StatusBoletagem;
  floating: boolean;
  mapa_liquidacao: StatusOkNok;
  mapa_registros: StatusOkNok;
  lo_status: StatusOkNok;
  due_diligence: StatusOkNok;
  envio_email_prestadores: StatusOkNok;
  passagem_bastao: StatusOkNok;
  kick_off: StatusOkNok;
  
  // Observações
  proximos_passos: string | null;
  alertas: string | null;
  status_tech: string | null;
  resumo: string | null;
  investidores_obs: string | null;
  
  // Timestamps
  criado_em: string;
  atualizado_em: string;
}

export interface DadosEstruturacaoInsert {
  id_emissao: string;
  pmo_id?: string | null;
  analista_financeiro_id?: string | null;
  analista_contabil_id?: string | null;
  analista_gestao_id?: string | null;
  previsao_liquidacao?: string | null;
  data_liquidacao?: string | null;
  primeira_data_pagamento?: string | null;
  data_df?: string | null;
  data_entrada_pipe?: string | null;
  banco?: string | null;
  agencia?: string | null;
  conta_bancaria?: string | null;
  compliance?: StatusOkNok;
  boletagem?: StatusBoletagem;
  floating?: boolean;
  mapa_liquidacao?: StatusOkNok;
  mapa_registros?: StatusOkNok;
  lo_status?: StatusOkNok;
  due_diligence?: StatusOkNok;
  envio_email_prestadores?: StatusOkNok;
  passagem_bastao?: StatusOkNok;
  kick_off?: StatusOkNok;
  proximos_passos?: string | null;
  alertas?: string | null;
  status_tech?: string | null;
  resumo?: string | null;
  investidores_obs?: string | null;
}

export interface DadosEstruturacaoUpdate extends Partial<Omit<DadosEstruturacaoInsert, 'id_emissao'>> {}

// Labels para exibição
export const STATUS_OKNOK_LABELS: Record<StatusOkNok, string> = {
  ok: 'OK',
  nok: 'NOK',
  pendente: 'Pendente'
};

export const STATUS_BOLETAGEM_LABELS: Record<StatusBoletagem, string> = {
  sim: 'Sim',
  nao: 'Não',
  na: 'N/A',
  pendente: 'Pendente'
};

export const STATUS_OKNOK_COLORS: Record<StatusOkNok, string> = {
  ok: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  nok: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
};

// Tipos para lookup tables (usados por useLookups.ts)
// Re-exportados do useLookups para manter compatibilidade
export type { Categoria, Veiculo, Lastro, TipoOferta } from '@/hooks/useLookups';

// Alias para compatibilidade
export type TipoOperacao = import('@/hooks/useLookups').TipoOferta;

export interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  funcao: string | null;
  departamento: string | null;
  ativo: boolean | null;
}

export interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  funcao: string | null;
  departamento: string | null;
  ativo: boolean | null;
}
