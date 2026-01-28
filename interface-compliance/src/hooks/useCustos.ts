import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function uuidv4() {
  // browser-safe uuid
  return (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}


// Buscar custos de uma emissão específica
export function useCustosEmissao(idEmissao: string | undefined) {
  return useQuery({
    queryKey: ['custos', idEmissao],
    queryFn: async () => {
      if (!idEmissao) return null;
      
      const { data, error } = await supabase
        .from('custos_emissao')
        .select('*')
        .eq('id_emissao', idEmissao)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!idEmissao,
  });
}

// Buscar custos detalhados (linhas) de uma emissão
export function useCustosLinhas(idCustosEmissao: string | undefined) {
  return useQuery({
    queryKey: ['custos-linhas', idCustosEmissao],
    queryFn: async () => {
      if (!idCustosEmissao) return [];
      
      const { data, error } = await supabase
        .from('custos_linhas')
        .select('*')
        .eq('id_custos_emissao', idCustosEmissao)
        .order('papel');
      
      if (error) throw error;
      return data;
    },
    enabled: !!idCustosEmissao,
  });
}

// Atualizar custos
export function useUpdateCustos() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ idEmissao, dados }: { idEmissao: string; dados: Record<string, number | null> }) => {
      const { data, error } = await supabase
        .from('custos_emissao')
        .update(dados)
        .eq('id_emissao', idEmissao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custos', variables.idEmissao] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar custos:', error);
    },
  });
}

// Criar registro de custos para uma emissão
export function useCreateCustos() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ idEmissao }: { idEmissao: string }) => {
      const { data, error } = await supabase
        .from('custos_emissao')
        .insert({ id: uuidv4(), id_emissao: idEmissao })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custos', variables.idEmissao] });
    },
  });
}
