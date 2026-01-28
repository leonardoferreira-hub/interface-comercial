// Cliente Supabase configurado para o schema 'estruturacao'
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Cliente configurado para acessar o schema 'estruturacao'
export const supabaseEstruturacao = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'estruturacao'
  }
});

// Re-export do cliente público para conveniência
export { supabase } from '@/integrations/supabase/client';
