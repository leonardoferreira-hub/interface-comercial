import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UpdateEmissaoData {
  nome_operacao?: string | null;
  numero_emissao?: string;
  empresa_razao_social?: string | null;
  empresa_nome_fantasia?: string | null;
  empresa_cnpj?: string | null;
  empresa_endereco?: string | null;
  contato_nome?: string | null;
  contato_email?: string | null;
  demandante_proposta?: string | null;
  empresa_destinataria?: string | null;
  volume?: number;
  categoria?: string | null;
  veiculo?: string | null;
  lastro?: string | null;
  tipo_oferta?: string | null;
}

export function useUpdateEmissao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: UpdateEmissaoData }) => {
      const { data, error } = await supabase
        .from('emissoes')
        .update(dados)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emissoes'] });
      queryClient.invalidateQueries({ queryKey: ['emissoes-estruturacao'] });
      queryClient.invalidateQueries({ queryKey: ['emissoes-com-detalhes'] });
      // usado na InformacoesTab para carregar os campos do Comercial
      queryClient.invalidateQueries({ queryKey: ['emissao-comercial', variables.id] });
    },
  });
}
