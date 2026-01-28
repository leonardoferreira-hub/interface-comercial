import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DadosEstruturacaoInsert, DadosEstruturacaoUpdate } from '@/types/dados-estruturacao';

// Buscar dados de estruturação de uma emissão específica
export function useDadosEstruturacao(idEmissao: string | undefined) {
  return useQuery({
    queryKey: ['dados-estruturacao', idEmissao],
    queryFn: async () => {
      if (!idEmissao) return null;
      
      const { data, error } = await supabase
        .from('dados_estruturacao')
        .select('*')
        .eq('id_emissao', idEmissao)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!idEmissao,
  });
}

// Criar ou atualizar dados de estruturação (upsert)
export function useUpsertDadosEstruturacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ idEmissao, dados }: { idEmissao: string; dados: DadosEstruturacaoUpdate }) => {
      // Primeiro verifica se já existe
      const { data: existing } = await supabase
        .from('dados_estruturacao')
        .select('id')
        .eq('id_emissao', idEmissao)
        .maybeSingle();
      
      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('dados_estruturacao')
          .update(dados)
          .eq('id_emissao', idEmissao)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert
        const insertData: DadosEstruturacaoInsert = {
          id_emissao: idEmissao,
          ...dados,
        };
        
        const { data, error } = await supabase
          .from('dados_estruturacao')
          .insert(insertData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dados-estruturacao', variables.idEmissao] });
      queryClient.invalidateQueries({ queryKey: ['emissoes-com-detalhes'] });
    },
  });
}

// Hook para atualizar um campo específico
export function useUpdateCampoEstruturacao() {
  const upsertMutation = useUpsertDadosEstruturacao();
  
  return {
    ...upsertMutation,
    updateCampo: (idEmissao: string, campo: string, valor: unknown) => {
      return upsertMutation.mutateAsync({
        idEmissao,
        dados: { [campo]: valor } as DadosEstruturacaoUpdate,
      });
    },
  };
}
