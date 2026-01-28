import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  situacao: string;
  data_abertura: string | null;
  tipo: string;
  porte: string | null;
  natureza_juridica: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
  telefone: string | null;
  email: string | null;
  atividade_principal: { code: string; text: string } | null;
  qsa: { nome: string; qual: string }[];
}

export function useConsultaCNPJ() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<CNPJData | null>(null);

  const consultar = useCallback(async (cnpj: string): Promise<CNPJData | null> => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (cnpjLimpo.length !== 14) {
      toast.error('CNPJ deve ter 14 dígitos');
      return null;
    }

    setIsLoading(true);
    try {
      // Usar BrasilAPI (gratuita, sem token)
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('CNPJ não encontrado');
          return null;
        }
        throw new Error(`Erro ${response.status}`);
      }

      const result = await response.json();
      
      const cnpjData: CNPJData = {
        cnpj: result.cnpj || cnpjLimpo,
        razao_social: result.razao_social || result.nome || 'Não informado',
        nome_fantasia: result.nome_fantasia || null,
        situacao: result.descricao_situacao_cadastral || result.situacao || 'Não informado',
        data_abertura: result.data_inicio_atividade || null,
        tipo: result.descricao_identificador_matriz_filial === '1' ? 'Matriz' : 'Filial',
        porte: result.descricao_porte || null,
        natureza_juridica: result.natureza_juridica || null,
        logradouro: result.logradouro || null,
        numero: result.numero || null,
        complemento: result.complemento || null,
        bairro: result.bairro || null,
        municipio: result.municipio || null,
        uf: result.uf || null,
        cep: result.cep || null,
        telefone: result.ddd_telefone_1 || result.telefone || null,
        email: result.email || null,
        atividade_principal: result.cnae_fiscal_descricao ? {
          code: result.cnae_fiscal?.toString() || '',
          text: result.cnae_fiscal_descricao,
        } : null,
        qsa: result.qsa?.map((s: any) => ({
          nome: s.nome_socio || s.nome,
          qual: s.qualificacao_socio || s.qual,
        })) || [],
      };

      setData(cnpjData);
      return cnpjData;
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao consultar CNPJ');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const limpar = useCallback(() => {
    setData(null);
  }, []);

  return {
    data,
    isLoading,
    consultar,
    limpar,
  };
}
