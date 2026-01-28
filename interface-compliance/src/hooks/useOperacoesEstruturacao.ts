import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OperacaoEstruturacao {
  id: string;
  /** FK para public.emissoes */
  id_emissao_comercial: string | null;

  numero_emissao: string;
  nome_operacao: string | null;
  volume: number;
  status: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  pmo_id: string | null;
  pmo_nome: string | null;
  veiculo_id: string | null;
  veiculo_nome: string | null;
  data_entrada_pipe: string | null;
  data_previsao_liquidacao: string | null;
  data_liquidacao: string | null;
  analista_gestao_id: string | null;
  analista_gestao_nome: string | null;
  criado_em: string | null;
  atualizado_em: string | null;

  // campos da emissão (public.emissoes)
  empresa_cnpj?: string | null;
  empresa_razao_social?: string | null;
  empresa_destinataria?: string | null;
  empresa_nome_fantasia?: string | null;
}

// A lista da página inicial deve ser eficiente: use uma view no banco
// (join em DB) para evitar múltiplas queries + junções no client.

export function useOperacoesEstruturacao() {
  return useQuery({
    queryKey: ['operacoes-estruturacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('estruturacao')
        .from('v_operacoes_ui')
        .select('*')
        .eq('status', 'Em Estruturação')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as OperacaoEstruturacao[];
    },
  });
}

export function useOperacoesLiquidadas() {
  return useQuery({
    queryKey: ['operacoes-liquidadas'],
    queryFn: async () => {
      const { data: operacoes, error: operacoesError } = await supabase
        .schema('estruturacao')
        .from('operacoes')
        .select('*')
        .eq('status', 'Liquidada')
        .order('data_liquidacao', { ascending: false, nullsFirst: false });

      if (operacoesError) throw operacoesError;

      const { data: categorias, error: categoriasError } = await supabase.rpc('get_base_custos_categorias' as any);
      if (categoriasError) throw categoriasError;

      const { data: veiculos, error: veiculosError } = await supabase.rpc('get_base_custos_veiculos' as any);
      if (veiculosError) throw veiculosError;

      const { data: analistas, error: analistasError } = await supabase
        .schema('estruturacao')
        .from('analistas_gestao')
        .select('id, nome');
      if (analistasError) {
        console.warn('Erro ao buscar analistas:', analistasError);
      }

      const emissaoIds = Array.from(
        new Set((operacoes || []).map((o: any) => o.id_emissao_comercial).filter(Boolean)),
      ) as string[];

      const { data: dadosEstruturacao, error: dadosErr } = await supabase
        .from('dados_estruturacao')
        .select('id_emissao, pmo_id')
        .in('id_emissao', emissaoIds);
      if (dadosErr) throw dadosErr;

      const pmoByEmissaoId = new Map((dadosEstruturacao || []).map((d: any) => [d.id_emissao, d.pmo_id]));

      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*');
      if (usuariosError) throw usuariosError;

      const categoriasMap = new Map((categorias || []).map((c: any) => [c.id, c.codigo || c.nome]));
      const veiculosMap = new Map((veiculos || []).map((v: any) => [v.id, v.nome]));
      const analistasMap = new Map((analistas || []).map((a: any) => [a.id, a.nome]));
      const usuariosMap = new Map((usuarios || []).map((u: any) => [u.id, u.nome_completo || u.nome || u.email || '—']));

      return mapOperacoes(operacoes as any, categoriasMap, veiculosMap, analistasMap, usuariosMap, pmoByEmissaoId);
    },
  });
}

export function useOperacao(id: string | undefined) {
  return useQuery({
    queryKey: ['operacao', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .schema('estruturacao')
        .from('operacoes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
