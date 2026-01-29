import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cliente Supabase para storage
const supabaseStorage = createClient(supabaseUrl, supabaseKey);

export type TipoDocumentoInvestidor = 'kyc' | 'suitability' | 'ficha_cadastral' | 'comprovante_residencia' | 'rg_cpf' | 'outros';

export interface DocumentoUpload {
  id: string;
  investidor_id: string;
  tipo_documento: TipoDocumentoInvestidor;
  nome_arquivo: string;
  url_arquivo: string;
  mime_type: string;
  tamanho_bytes: number;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  observacoes: string | null;
  data_envio: string;
}

const configDocumentos: Record<TipoDocumentoInvestidor, { 
  label: string; 
  descricao: string;
  obrigatorio: boolean;
  aceitos: string[];
}> = {
  kyc: {
    label: 'KYC (Know Your Customer)',
    descricao: 'Formulário de conhecimento do cliente',
    obrigatorio: true,
    aceitos: ['.pdf', '.doc', '.docx'],
  },
  suitability: {
    label: 'Suitability',
    descricao: 'Avaliação de perfil de investidor',
    obrigatorio: true,
    aceitos: ['.pdf'],
  },
  ficha_cadastral: {
    label: 'Ficha Cadastral',
    descricao: 'Dados cadastrais completos',
    obrigatorio: true,
    aceitos: ['.pdf', '.doc', '.docx'],
  },
  comprovante_residencia: {
    label: 'Comprovante de Residência',
    descricao: 'Conta de luz, água, etc (últimos 3 meses)',
    obrigatorio: true,
    aceitos: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
  rg_cpf: {
    label: 'RG/CPF',
    descricao: 'Documento de identificação',
    obrigatorio: true,
    aceitos: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
  outros: {
    label: 'Outros Documentos',
    descricao: 'Documentos adicionais',
    obrigatorio: false,
    aceitos: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  },
};

export { configDocumentos };

export function useDocumentosInvestidor(investidorId: string | undefined) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const fazerUpload = useCallback(async (
    tipo: TipoDocumentoInvestidor,
    file: File
  ): Promise<DocumentoUpload | null> => {
    if (!investidorId) {
      toast.error('Investidor não selecionado');
      return null;
    }

    const config = configDocumentos[tipo];
    const extensao = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!config.aceitos.includes(extensao)) {
      toast.error(`Formato não aceito. Use: ${config.aceitos.join(', ')}`);
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx: 10MB)');
      return null;
    }

    setUploading(prev => ({ ...prev, [tipo]: true }));

    try {
      // Upload para storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${investidorId}/${tipo}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabaseStorage.storage
        .from('investidor-documentos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabaseStorage.storage
        .from('investidor-documentos')
        .getPublicUrl(fileName);

      // Salvar no banco via RPC
      const { data, error: dbError } = await supabaseStorage
        .rpc('adicionar_documento_investidor', {
          p_investidor_id: investidorId,
          p_tipo_documento: tipo,
          p_nome_arquivo: file.name,
          p_url_arquivo: urlData.publicUrl,
          p_mime_type: file.type,
          p_tamanho_bytes: file.size,
        });

      if (dbError) throw dbError;

      toast.success(`${config.label} enviado com sucesso`);
      return data as DocumentoUpload;
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao fazer upload');
      return null;
    } finally {
      setUploading(prev => ({ ...prev, [tipo]: false }));
    }
  }, [investidorId]);

  const removerDocumento = useCallback(async (docId: string): Promise<boolean> => {
    try {
      const { error } = await supabaseStorage
        .rpc('remover_documento_investidor', {
          p_documento_id: docId,
        });

      if (error) throw error;

      toast.success('Documento removido');
      return true;
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao remover documento');
      return false;
    }
  }, []);

  const validarDocumento = useCallback(async (
    docId: string,
    status: 'aprovado' | 'rejeitado',
    observacoes?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabaseStorage
        .rpc('validar_documento_investidor', {
          p_documento_id: docId,
          p_status: status,
          p_observacoes: observacoes || null,
        });

      if (error) throw error;

      toast.success(`Documento ${status === 'aprovado' ? 'aprovado' : 'rejeitado'}`);
      return true;
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao validar documento');
      return false;
    }
  }, []);

  return {
    uploading,
    fazerUpload,
    removerDocumento,
    validarDocumento,
    configDocumentos,
  };
}
