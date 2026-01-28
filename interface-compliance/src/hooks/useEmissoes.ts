import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EmissaoDB, SerieDB, StatusProposta } from '@/types/database';

// ============= Queries =============

export function useEmissoes() {
  return useQuery({
    queryKey: ['emissoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emissoes')
        .select('*')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data as EmissaoDB[];
    },
  });
}

export function useEmissao(id: string | undefined) {
  return useQuery({
    queryKey: ['emissao', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('emissoes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as EmissaoDB;
    },
    enabled: !!id,
  });
}

export function useEmissoesEstruturacao() {
  return useQuery({
    queryKey: ['emissoes', 'estruturacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emissoes')
        .select('*')
        .eq('status', 'em_estruturacao')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data as EmissaoDB[];
    },
  });
}

export function useSeries(idEmissao: string | undefined) {
  return useQuery({
    queryKey: ['series', idEmissao],
    queryFn: async () => {
      if (!idEmissao) return [];
      
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('id_emissao', idEmissao)
        .order('numero', { ascending: true });
      
      if (error) throw error;
      return data as SerieDB[];
    },
    enabled: !!idEmissao,
  });
}

// ============= Mutations =============

export function useUpdateEmissaoStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusProposta }) => {
      const { data, error } = await supabase
        .from('emissoes')
        .update({ status, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emissoes'] });
    },
  });
}

export function useEnviarParaEstruturacao() {
  const updateStatus = useUpdateEmissaoStatus();
  
  return {
    ...updateStatus,
    mutate: (id: string) => updateStatus.mutate({ id, status: 'estruturacao' }),
    mutateAsync: (id: string) => updateStatus.mutateAsync({ id, status: 'estruturacao' }),
  };
}
