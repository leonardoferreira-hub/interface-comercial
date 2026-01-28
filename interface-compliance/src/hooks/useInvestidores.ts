import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEstruturacao } from '@/lib/supabase-estruturacao';
import type { 
  Investidor, 
  InvestidorInsert,
  AlocacaoInvestidor,
  AlocacaoInvestidorInsert 
} from '@/types/estruturacao';

// ============= Investidores Queries =============

export function useInvestidores() {
  return useQuery({
    queryKey: ['investidores'],
    queryFn: async () => {
      const { data, error } = await supabaseEstruturacao
        .from('investidores')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data as Investidor[];
    },
  });
}

export function useInvestidor(id: string | undefined) {
  return useQuery({
    queryKey: ['investidor', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabaseEstruturacao
        .from('investidores')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Investidor;
    },
    enabled: !!id,
  });
}

// ============= Investidores Mutations =============

export function useCreateInvestidor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (investidor: InvestidorInsert) => {
      const { data, error } = await supabaseEstruturacao
        .from('investidores')
        .insert(investidor)
        .select()
        .single();
      
      if (error) throw error;
      return data as Investidor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investidores'] });
    },
  });
}

export function useUpdateInvestidor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Investidor> & { id: string }) => {
      const { data, error } = await supabaseEstruturacao
        .from('investidores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Investidor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investidores'] });
    },
  });
}

// ============= Alocações Queries =============

export function useAlocacoes(idSerie: string | undefined) {
  return useQuery({
    queryKey: ['alocacoes', idSerie],
    queryFn: async () => {
      if (!idSerie) return [];
      
      const { data, error } = await supabaseEstruturacao
        .from('alocacao_investidores')
        .select(`
          *,
          investidor:investidores(*)
        `)
        .eq('id_serie', idSerie)
        .order('data_alocacao', { ascending: false });
      
      if (error) throw error;
      return data as (AlocacaoInvestidor & { investidor: Investidor })[];
    },
    enabled: !!idSerie,
  });
}

export function useAlocacoesPorEmissao(idEmissao: string | undefined, seriesIds: string[]) {
  return useQuery({
    queryKey: ['alocacoes', 'emissao', idEmissao],
    queryFn: async () => {
      if (!idEmissao || seriesIds.length === 0) return [];
      
      const { data, error } = await supabaseEstruturacao
        .from('alocacao_investidores')
        .select(`
          *,
          investidor:investidores(*)
        `)
        .in('id_serie', seriesIds)
        .order('data_alocacao', { ascending: false });
      
      if (error) throw error;
      return data as (AlocacaoInvestidor & { investidor: Investidor })[];
    },
    enabled: !!idEmissao && seriesIds.length > 0,
  });
}

// ============= Alocações Mutations =============

export function useCreateAlocacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alocacao: AlocacaoInvestidorInsert) => {
      const { data, error } = await supabaseEstruturacao
        .from('alocacao_investidores')
        .insert(alocacao)
        .select()
        .single();
      
      if (error) throw error;
      return data as AlocacaoInvestidor;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alocacoes', data.id_serie] });
      queryClient.invalidateQueries({ queryKey: ['alocacoes', 'emissao'] });
    },
  });
}

export function useUpdateAlocacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, idSerie, ...updates }: Partial<AlocacaoInvestidor> & { id: string; idSerie: string }) => {
      const { data, error } = await supabaseEstruturacao
        .from('alocacao_investidores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, idSerie } as AlocacaoInvestidor & { idSerie: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alocacoes', data.idSerie] });
      queryClient.invalidateQueries({ queryKey: ['alocacoes', 'emissao'] });
    },
  });
}

export function useDeleteAlocacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, idSerie }: { id: string; idSerie: string }) => {
      const { error } = await supabaseEstruturacao
        .from('alocacao_investidores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, idSerie };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alocacoes', data.idSerie] });
      queryClient.invalidateQueries({ queryKey: ['alocacoes', 'emissao'] });
    },
  });
}
