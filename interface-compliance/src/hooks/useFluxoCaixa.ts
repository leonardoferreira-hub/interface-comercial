import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEstruturacao } from '@/lib/supabase-estruturacao';
import type { 
  FluxoCaixaProjetado, 
  FluxoCaixaProjetadoInsert 
} from '@/types/estruturacao';

// ============= Queries =============

export function useFluxoCaixa(idSerie: string | undefined) {
  return useQuery({
    queryKey: ['fluxo_caixa', idSerie],
    queryFn: async () => {
      if (!idSerie) return [];
      
      const { data, error } = await supabaseEstruturacao
        .from('fluxo_caixa_projetado')
        .select('*')
        .eq('id_serie', idSerie)
        .order('data_evento', { ascending: true });
      
      if (error) throw error;
      return data as FluxoCaixaProjetado[];
    },
    enabled: !!idSerie,
  });
}

export function useFluxoCaixaPorEmissao(seriesIds: string[]) {
  return useQuery({
    queryKey: ['fluxo_caixa', 'emissao', seriesIds],
    queryFn: async () => {
      if (seriesIds.length === 0) return [];
      
      const { data, error } = await supabaseEstruturacao
        .from('fluxo_caixa_projetado')
        .select('*')
        .in('id_serie', seriesIds)
        .order('data_evento', { ascending: true });
      
      if (error) throw error;
      return data as FluxoCaixaProjetado[];
    },
    enabled: seriesIds.length > 0,
  });
}

// ============= Mutations =============

export function useCreateFluxoCaixa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fluxo: FluxoCaixaProjetadoInsert) => {
      const { data, error } = await supabaseEstruturacao
        .from('fluxo_caixa_projetado')
        .insert(fluxo)
        .select()
        .single();
      
      if (error) throw error;
      return data as FluxoCaixaProjetado;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa', data.id_serie] });
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa', 'emissao'] });
    },
  });
}

export function useUpdateFluxoCaixa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, idSerie, ...updates }: Partial<FluxoCaixaProjetado> & { id: string; idSerie: string }) => {
      const { data, error } = await supabaseEstruturacao
        .from('fluxo_caixa_projetado')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, idSerie } as FluxoCaixaProjetado & { idSerie: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa', data.idSerie] });
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa', 'emissao'] });
    },
  });
}

export function useDeleteFluxoCaixa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, idSerie }: { id: string; idSerie: string }) => {
      const { error } = await supabaseEstruturacao
        .from('fluxo_caixa_projetado')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, idSerie };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa', data.idSerie] });
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa', 'emissao'] });
    },
  });
}

export function useBulkCreateFluxoCaixa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fluxos: FluxoCaixaProjetadoInsert[]) => {
      const { data, error } = await supabaseEstruturacao
        .from('fluxo_caixa_projetado')
        .insert(fluxos)
        .select();
      
      if (error) throw error;
      return data as FluxoCaixaProjetado[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa'] });
    },
  });
}
