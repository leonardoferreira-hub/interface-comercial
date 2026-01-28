import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEstruturacao } from '@/lib/supabase-estruturacao';
import type { 
  EventoChave, 
  EventoChaveInsert,
  StatusEvento 
} from '@/types/estruturacao';

// ============= Queries =============

export function useEventosChave(idEmissao: string | undefined) {
  return useQuery({
    queryKey: ['eventos_chave', idEmissao],
    queryFn: async () => {
      if (!idEmissao) return [];
      
      const { data, error } = await supabaseEstruturacao
        .from('eventos_chave')
        .select('*')
        .eq('id_emissao', idEmissao)
        .order('data_prevista', { ascending: true });
      
      if (error) throw error;
      return data as EventoChave[];
    },
    enabled: !!idEmissao,
  });
}

// ============= Mutations =============

export function useCreateEventoChave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (evento: EventoChaveInsert) => {
      const { data, error } = await supabaseEstruturacao
        .from('eventos_chave')
        .insert(evento)
        .select()
        .single();
      
      if (error) throw error;
      return data as EventoChave;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eventos_chave', data.id_emissao] });
    },
  });
}

export function useUpdateEventoChave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, idEmissao, ...updates }: Partial<EventoChave> & { id: string; idEmissao: string }) => {
      const { data, error } = await supabaseEstruturacao
        .from('eventos_chave')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, idEmissao } as EventoChave & { idEmissao: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eventos_chave', data.idEmissao] });
    },
  });
}

export function useUpdateEventoStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      idEmissao,
      dataRealizada 
    }: { 
      id: string; 
      status: StatusEvento; 
      idEmissao: string;
      dataRealizada?: string;
    }) => {
      const updates: Partial<EventoChave> = { status };
      if (status === 'concluido' && dataRealizada) {
        updates.data_realizada = dataRealizada;
      }
      
      const { data, error } = await supabaseEstruturacao
        .from('eventos_chave')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, idEmissao } as EventoChave & { idEmissao: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eventos_chave', data.idEmissao] });
    },
  });
}

export function useDeleteEventoChave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, idEmissao }: { id: string; idEmissao: string }) => {
      const { error } = await supabaseEstruturacao
        .from('eventos_chave')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, idEmissao };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eventos_chave', data.idEmissao] });
    },
  });
}

// ============= Bulk Operations =============

export function useBulkCreateEventosChave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventos: EventoChaveInsert[]) => {
      const { data, error } = await supabaseEstruturacao
        .from('eventos_chave')
        .insert(eventos)
        .select();
      
      if (error) throw error;
      return data as EventoChave[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos_chave'] });
    },
  });
}

// ============= Helper: Eventos Padrão =============

export const EVENTOS_PADRAO = [
  'Kick-off Meeting',
  'Due Diligence Iniciada',
  'Due Diligence Concluída',
  'Term Sheet Assinado',
  'Documentação Jurídica',
  'Rating Obtido',
  'Registro CVM',
  'Bookbuilding',
  'Liquidação Financeira',
  'Primeira Amortização',
];

export function gerarEventosPadrao(idEmissao: string): EventoChaveInsert[] {
  return EVENTOS_PADRAO.map(nome => ({
    id_emissao: idEmissao,
    nome_evento: nome,
    status: 'pendente' as StatusEvento,
  }));
}
