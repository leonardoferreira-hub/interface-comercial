import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Usuario } from '@/types/dados-estruturacao';

// Buscar todos os usuários ativos
export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*');

      if (error) throw error;

      // Compat: remoto usa nome_completo; local usa nome
      const normalized = (data || []).map((u: any) => ({
        id: u.id,
        nome_completo: u.nome_completo || u.nome || u.email || '—',
        email: u.email || '',
        funcao: u.funcao ?? null,
        departamento: u.departamento ?? null,
        ativo: u.ativo ?? true,
      })) as Usuario[];

      normalized.sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || '', 'pt-BR'));
      return normalized;
    },
  });
}

// Buscar usuários que podem ser PMO
export function useUsuariosPMO() {
  return useQuery({
    queryKey: ['usuarios-pmo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*');

      if (error) throw error;

      // Por enquanto, todos os usuários podem ser PMO
      const normalized = (data || []).map((u: any) => ({
        id: u.id,
        nome_completo: u.nome_completo || u.nome || u.email || '—',
        email: u.email || '',
        funcao: u.funcao ?? null,
        departamento: u.departamento ?? null,
        ativo: u.ativo ?? true,
      })) as Usuario[];

      normalized.sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || '', 'pt-BR'));
      return normalized;
    },
  });
}

// Buscar um usuário específico
export function useUsuario(id: string | undefined) {
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Usuario;
    },
    enabled: !!id,
  });
}
