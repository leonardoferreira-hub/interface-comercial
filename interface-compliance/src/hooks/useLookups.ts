import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Interfaces para lookup tables do base_custos
export interface Categoria {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  created_at: string;
}

export interface Veiculo {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  created_at: string;
}

export interface Lastro {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  created_at: string;
}

export interface TipoOferta {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  created_at: string;
}

// Buscar todas as categorias do base_custos (CRI, CRA, CR, DEB)
export function useCategorias() {
  return useQuery({
    queryKey: ['categorias-base-custos'],
    queryFn: async () => {
      // Usar RPC para buscar do base_custos
      const { data, error } = await supabase.rpc('get_base_custos_categorias' as any);
      
      if (error) throw error;
      return (data || []) as Categoria[];
    },
  });
}

// Buscar todos os veículos do base_custos (Patrimônio Separado, Veículo Exclusivo)
export function useVeiculos() {
  return useQuery({
    queryKey: ['veiculos-base-custos'],
    queryFn: async () => {
      // Usar RPC para buscar do base_custos
      const { data, error } = await supabase.rpc('get_base_custos_veiculos' as any);
      
      if (error) throw error;
      return (data || []) as Veiculo[];
    },
  });
}

// Buscar todos os lastros do base_custos (Origem, Destinação)
export function useLastros() {
  return useQuery({
    queryKey: ['lastros-base-custos'],
    queryFn: async () => {
      // Usar RPC para buscar do base_custos
      const { data, error } = await supabase.rpc('get_base_custos_lastros' as any);
      
      if (error) throw error;
      return (data || []) as Lastro[];
    },
  });
}

// Buscar todos os tipos de oferta do base_custos (Privada Pura, Privada Cetipada, CVM 160)
export function useTiposOferta() {
  return useQuery({
    queryKey: ['tipos-oferta-base-custos'],
    queryFn: async () => {
      // Usar RPC para buscar do base_custos
      const { data, error } = await supabase.rpc('get_base_custos_tipos_oferta' as any);
      
      if (error) throw error;
      return (data || []) as TipoOferta[];
    },
  });
}

// Alias para compatibilidade
export function useTiposOperacao() {
  return useTiposOferta();
}
