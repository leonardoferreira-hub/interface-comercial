import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEstruturacao } from '@/lib/supabase-estruturacao';
import { toast } from 'sonner';

export type TipoDocumentoInvestidor = 'kyc' | 'suitability' | 'ficha_cadastral' | 'outros';
export type StatusDocumentoInvestidor = 'pendente' | 'aprovado' | 'rejeitado';

export interface InvestidorDocumento {
  id: string;
  id_investidor: string;
  tipo_documento: TipoDocumentoInvestidor;
  nome_arquivo: string;
  url_arquivo: string;
  mime_type: string | null;
  tamanho_bytes: number | null;
  status: StatusDocumentoInvestidor;
  observacoes: string | null;
  enviado_por: string | null;
  data_envio: string;
  data_validacao: string | null;
  validado_por: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface UploadDocumentoInput {
  id_investidor: string;
  tipo_documento: TipoDocumentoInvestidor;
  nome_arquivo: string;
  url_arquivo: string;
  mime_type?: string;
  tamanho_bytes?: number;
}

// ============= Queries =============

export function useDocumentosInvestidor(idInvestidor: string | undefined) {
  return useQuery({
    queryKey: ['investidor-documentos', idInvestidor],
    queryFn: async () => {
      if (!idInvestidor) return [];
      
      const { data, error } = await supabaseEstruturacao
        .from('investidor_documentos')
        .select('*')
        .eq('id_investidor', idInvestidor)
        .order('data_envio', { ascending: false });
      
      if (error) throw error;
      return data as InvestidorDocumento[];
    },
    enabled: !!idInvestidor,
  });
}

// ============= Mutations =============

export function useUploadDocumentoInvestidor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UploadDocumentoInput) => {
      const { data, error } = await supabaseEstruturacao
        .from('investidor_documentos')
        .upsert({
          id_investidor: input.id_investidor,
          tipo_documento: input.tipo_documento,
          nome_arquivo: input.nome_arquivo,
          url_arquivo: input.url_arquivo,
          mime_type: input.mime_type || null,
          tamanho_bytes: input.tamanho_bytes || null,
          status: 'pendente',
        }, {
          onConflict: 'id_investidor,tipo_documento',
          ignoreDuplicates: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as InvestidorDocumento;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['investidor-documentos', data.id_investidor] });
      toast.success('Documento enviado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao enviar documento');
    },
  });
}

export function useValidarDocumentoInvestidor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      id_investidor, 
      status, 
      observacoes 
    }: { 
      id: string; 
      id_investidor: string; 
      status: StatusDocumentoInvestidor;
      observacoes?: string;
    }) => {
      const { data, error } = await supabaseEstruturacao
        .from('investidor_documentos')
        .update({
          status,
          observacoes: observacoes || null,
          data_validacao: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as InvestidorDocumento;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['investidor-documentos', data.id_investidor] });
      toast.success('Documento validado');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao validar documento');
    },
  });
}

export function useRemoverDocumentoInvestidor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, id_investidor }: { id: string; id_investidor: string }) => {
      const { error } = await supabaseEstruturacao
        .from('investidor_documentos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, id_investidor };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['investidor-documentos', data.id_investidor] });
      toast.success('Documento removido');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao remover documento');
    },
  });
}
