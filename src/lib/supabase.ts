import { supabase } from '@/integrations/supabase/client';

export interface Emissao {
  id: string;
  numero_emissao: string;
  demandante_proposta: string;
  empresa_destinataria: string;
  categoria: 'DEB' | 'CRA' | 'CRI' | 'NC' | 'CR';
  oferta: string;
  veiculo: string;
  lastro?: string;
  volume: number;
  quantidade_series: number;
  status_proposta: string;
  data_criacao: string;
  series?: { numero: number; valor_emissao: number }[];
}

// Interface para custos no formato antigo (compatibilidade)
export interface Custo {
  tipo?: string;
  valor?: number;
  descricao?: string;
  // Campos do novo formato
  papel?: string;
  id_prestador?: string | null;
  tipo_preco?: string;
  preco_upfront?: number;
  preco_recorrente?: number;
  periodicidade?: string | null;
  gross_up?: number;
  valor_upfront_bruto?: number;
  valor_recorrente_bruto?: number;
}

export interface FetchCustosParams {
  categoria: string;
  tipo_oferta: string;
  veiculo?: string;
  lastro?: string;
  volume: number;
  series: { numero: number; valor_emissao: number }[];
}

// FLUXO 0
export async function listarEmissoes(page = 1, limit = 10) {
  console.log('📋 [listarEmissoes] Buscando página:', page);

  try {
    const { data, error } = await supabase.functions.invoke('fluxo-0-listar-emissoes', {
      body: { page, limit },
    });

    if (error) {
      console.error('💥 [listarEmissoes] Erro:', error);
      throw error;
    }

    console.log('✅ [listarEmissoes] Sucesso:', data);
    return data;
  } catch (error) {
    console.error('💥 [listarEmissoes] Erro:', error);
    throw error;
  }
}

export async function detalhesEmissao(id: string) {
  console.log('🔍 [detalhesEmissao] Buscando ID:', id);

  try {
    const { data, error } = await supabase.functions.invoke(`fluxo-0-detalhes-emissao/${id}`);

    if (error) {
      console.error('💥 [detalhesEmissao] Erro:', error);
      throw error;
    }

    console.log('✅ [detalhesEmissao] Sucesso:', data);
    return data;
  } catch (error) {
    console.error('💥 [detalhesEmissao] Erro:', error);
    throw error;
  }
}

// FLUXO 1
export async function criarEmissao(emissaoData: Partial<Emissao>) {
  console.log('📝 [criarEmissao] Payload:', emissaoData);

  try {
    const { data, error } = await supabase.functions.invoke('fluxo-1-criar-emissao', {
      body: emissaoData,
    });

    if (error) {
      console.error('💥 [criarEmissao] Erro:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [criarEmissao] Sucesso:', data);
    return data;
  } catch (error) {
    console.error('💥 [criarEmissao] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}

export async function atualizarEmissao(id: string, emissaoData: Partial<Emissao>) {
  console.log('✏️ [atualizarEmissao] ID:', id, 'Dados:', emissaoData);

  try {
    const { data, error } = await supabase.functions.invoke(`fluxo-1-atualizar-emissao/${id}`, {
      body: emissaoData,
    });

    if (error) {
      console.error('💥 [atualizarEmissao] Erro:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [atualizarEmissao] Sucesso:', data);
    return data;
  } catch (error) {
    console.error('💥 [atualizarEmissao] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}

export async function salvarCustos(
  id_emissao: string, 
  custos: Custo[], 
  totais?: {
    total_upfront: number;
    total_anual: number;
    total_mensal: number;
    total_primeiro_ano: number;
    total_anos_subsequentes: number;
  },
  custos_series?: Array<{
    numero: number;
    registro_b3: number;
    custodia_b3: number;
  }>
) {
  console.log('💰 [salvarCustos] ID:', id_emissao, 'Custos:', custos.length, 'Totais:', totais, 'CustosSeries:', custos_series?.length || 0);

  try {
    const { data, error } = await supabase.functions.invoke('fluxo-1-salvar-custos', {
      body: { id_emissao, custos, totais, custos_series },
    });

    if (error) {
      console.error('💥 [salvarCustos] Erro:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [salvarCustos] Sucesso:', data);
    return data;
  } catch (error) {
    console.error('💥 [salvarCustos] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}

// FLUXO 2
export async function gerarPDF(id: string) {
  console.log('📄 [gerarPDF] Gerando para ID:', id);

  try {
    const { data, error } = await supabase.functions.invoke(`fluxo-2-gerar-pdf/${id}`);

    if (error) {
      console.error('💥 [gerarPDF] Erro:', error);
      throw error;
    }

    console.log('✅ [gerarPDF] Sucesso');
    return data;
  } catch (error) {
    console.error('💥 [gerarPDF] Erro:', error);
    throw error;
  }
}

export async function finalizarProposta(id: string, status: string, data_envio?: string) {
  console.log('🏁 [finalizarProposta] ID:', id, 'Status:', status);

  try {
    const { data, error } = await supabase.functions.invoke(`fluxo-2-finalizar-proposta/${id}`, {
      body: { status, data_envio },
    });

    if (error) {
      console.error('💥 [finalizarProposta] Erro:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [finalizarProposta] Sucesso:', data);
    return data;
  } catch (error) {
    console.error('💥 [finalizarProposta] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}

// FLUXO CUSTOS
export async function fetchCustosPorCombinacao(params: FetchCustosParams) {
  console.log('🧮 [fetchCustosPorCombinacao] Params:', params);

  try {
    const { data, error } = await supabase.functions.invoke('fluxo_custos_por_combinacao', {
      body: {
        categoria: params.categoria,
        tipo_oferta: params.tipo_oferta,
        veiculo: params.veiculo || null,
        lastro: params.lastro || null,
        volume: params.volume,
        series: params.series
      },
    });

    if (error) {
      console.error('💥 [fetchCustosPorCombinacao] Erro:', error);
      throw error;
    }

    console.log('✅ [fetchCustosPorCombinacao] Sucesso:', data);
    return data;
  } catch (error) {
    console.error('💥 [fetchCustosPorCombinacao] Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar custos',
      data: { upfront: [], anual: [], mensal: [], custos: [] },
      custodia_debenture: [],
      totais: { total_upfront: 0, total_anual: 0, total_mensal: 0, total_primeiro_ano: 0 }
    };
  }
}
