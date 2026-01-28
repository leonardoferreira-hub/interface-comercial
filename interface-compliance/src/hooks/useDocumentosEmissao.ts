import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEstruturacao } from '@/lib/supabase-estruturacao';
import type { 
  DocumentoEmissao, 
  DocumentoEmissaoInsert,
  StatusDocumento 
} from '@/types/estruturacao';

// ============= Queries =============

export function useDocumentosEmissao(idEmissao: string | undefined) {
  return useQuery({
    queryKey: ['documentos_emissao', idEmissao],
    queryFn: async () => {
      if (!idEmissao) return [];
      
      const { data, error } = await supabaseEstruturacao
        .from('documentos_emissao')
        .select('*')
        .eq('id_emissao', idEmissao)
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data as DocumentoEmissao[];
    },
    enabled: !!idEmissao,
  });
}

// ============= Mutations =============

export function useCreateDocumento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (documento: DocumentoEmissaoInsert) => {
      const { data, error } = await supabaseEstruturacao
        .from('documentos_emissao')
        .insert(documento)
        .select()
        .single();
      
      if (error) throw error;
      return data as DocumentoEmissao;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documentos_emissao', data.id_emissao] });
    },
  });
}

export function useUpdateDocumentoStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, idEmissao }: { id: string; status: StatusDocumento; idEmissao: string }) => {
      const { data, error } = await supabaseEstruturacao
        .from('documentos_emissao')
        .update({ status, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, idEmissao } as DocumentoEmissao & { idEmissao: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documentos_emissao', data.idEmissao] });
    },
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, idEmissao }: { id: string; idEmissao: string }) => {
      const { error } = await supabaseEstruturacao
        .from('documentos_emissao')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, idEmissao };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documentos_emissao', data.idEmissao] });
    },
  });
}
