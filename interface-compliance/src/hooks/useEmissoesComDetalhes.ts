import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmissaoComDetalhes {
  id: string;
  numero_emissao: string;
  nome_operacao: string | null;
  volume: number;
  status: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  pmo_id: string | null;
  pmo_nome: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
}

export function useEmissoesComDetalhes() {
  return useQuery({
    queryKey: ['emissoes-com-detalhes'],
    queryFn: async () => {
      // Buscar emissões
      const { data: emissoes, error: emissaoError } = await supabase
        .from('emissoes')
        .select('*')
        .eq('status', 'em_estruturacao')
        .order('criado_em', { ascending: false });

      if (emissaoError) throw emissaoError;

      // Buscar dados de estruturação
      const { data: dadosEstruturacao, error: dadosError } = await supabase
        .from('dados_estruturacao')
        .select('id_emissao, pmo_id');

      if (dadosError) throw dadosError;

      // Buscar categorias
      const { data: categorias, error: categoriasError } = await supabase
        .from('categorias')
        .select('id, nome');

      if (categoriasError) throw categoriasError;

      // Buscar usuários (PMOs)
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome_completo');

      if (usuariosError) throw usuariosError;

      // Mapear dados
      const categoriasMap = new Map(categorias?.map(c => [c.id, c.nome]) || []);
      const usuariosMap = new Map(usuarios?.map(u => [u.id, u.nome_completo]) || []);
      const estruturacaoMap = new Map(dadosEstruturacao?.map(d => [d.id_emissao, d.pmo_id]) || []);

      const result: EmissaoComDetalhes[] = (emissoes || []).map(e => {
        const pmoId = estruturacaoMap.get(e.id);
        return {
          id: e.id,
          numero_emissao: e.numero_emissao,
          nome_operacao: e.nome_operacao,
          volume: e.volume,
          status: e.status,
          categoria_id: e.categoria,
          categoria_nome: e.categoria ? categoriasMap.get(e.categoria) || null : null,
          pmo_id: pmoId || null,
          pmo_nome: pmoId ? usuariosMap.get(pmoId) || null : null,
          criado_em: e.criado_em,
          atualizado_em: e.atualizado_em,
        };
      });

      return result;
    },
  });
}
