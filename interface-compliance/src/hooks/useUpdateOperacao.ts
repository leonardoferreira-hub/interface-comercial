import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UpdateOperacaoData = Record<string, any>;

export function useUpdateOperacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: UpdateOperacaoData }) => {
      const { data, error } = await supabase
        .schema('estruturacao')
        .from('operacoes')
        .update(dados)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['operacoes-estruturacao'] });
      queryClient.invalidateQueries({ queryKey: ['operacoes-liquidadas'] });
      queryClient.invalidateQueries({ queryKey: ['operacao', data?.id] });
    },
  });
}
