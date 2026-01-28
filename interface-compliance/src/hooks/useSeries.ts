import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SerieDB } from '@/types/database';
import { toast } from 'sonner';

type SerieInsert = Omit<SerieDB, 'id' | 'criado_em' | 'atualizado_em'>;
type SerieUpdate = Partial<Omit<SerieDB, 'id' | 'id_emissao' | 'criado_em' | 'atualizado_em'>>;

// Criar nova série
export function useCreateSerie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dados: SerieInsert) => {
      const { data, error } = await supabase
        .from('series')
        .insert(dados)
        .select()
        .single();
      
      if (error) throw error;
      return data as SerieDB;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['series', data.id_emissao] });
      queryClient.invalidateQueries({ queryKey: ['emissao', data.id_emissao] });
      toast.success('Série criada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar série:', error);
      toast.error('Erro ao criar série');
    },
  });
}

// Atualizar série existente
export function useUpdateSerie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, idEmissao, dados }: { id: string; idEmissao: string; dados: SerieUpdate }) => {
      const { data, error } = await supabase
        .from('series')
        .update(dados)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, idEmissao } as SerieDB & { idEmissao: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['series', data.idEmissao] });
      queryClient.invalidateQueries({ queryKey: ['emissao', data.idEmissao] });
      toast.success('Série atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar série:', error);
      toast.error('Erro ao atualizar série');
    },
  });
}

// Deletar série
export function useDeleteSerie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, idEmissao }: { id: string; idEmissao: string }) => {
      const { error } = await supabase
        .from('series')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, idEmissao };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['series', data.idEmissao] });
      queryClient.invalidateQueries({ queryKey: ['emissao', data.idEmissao] });
      toast.success('Série removida com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao remover série:', error);
      toast.error('Erro ao remover série');
    },
  });
}
