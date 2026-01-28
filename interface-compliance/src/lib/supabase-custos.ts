import { supabase } from '@/integrations/supabase/client';
import type { CostItem } from '@/components/estruturacao/tabs/despesas/CostRow';
import type { CostType } from '@/components/estruturacao/tabs/despesas/CostSection';

function uuidv4() {
  return (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}


interface CustoLinha {
  /** Mantém id estável para permitir upsert sem apagar tudo */
  id?: string;
  origem?: 'manual' | 'auto';
  papel: string;
  id_prestador: string | null;
  tipo_preco: string;
  preco_upfront: number;
  preco_recorrente: number;
  periodicidade: string | null;
  gross_up: number;
  valor_upfront_bruto: number;
  valor_recorrente_bruto: number;
}

interface TotaisCustos {
  total_upfront: number;
  total_anual: number;
  total_mensal: number;
  total_primeiro_ano: number;
  total_anos_subsequentes: number;
}

interface SalvarCustosPayload {
  /** FK para a emissão do comercial (public.emissoes.id) */
  id_emissao_comercial: string;
  custos: CustoLinha[];
  totais: TotaisCustos;
}

/**
 * Converte CostItem para o formato esperado pela Edge Function
 */
export function convertToApiFormat(items: CostItem[], type: CostType): CustoLinha[] {
  return items.map((item) => ({
    id: item.id,
    origem: item.origem || (item.tipo === 'auto' ? 'auto' : 'manual'),
    papel: item.papel || item.prestador,
    id_prestador: item.id_prestador || null,
    tipo_preco: item.tipo === 'input' ? 'fixo' : 'auto',
    preco_upfront: type === 'upfront' ? item.valor : 0,
    preco_recorrente: type !== 'upfront' ? item.valor : 0,
    periodicidade: type === 'upfront' ? null : type,
    gross_up: item.grossUp,
    valor_upfront_bruto: type === 'upfront' ? item.valorBruto : 0,
    valor_recorrente_bruto: type !== 'upfront' ? item.valorBruto : 0,
  }));
}

/**
 * Salva custos direto no banco (estruturação), com sincronização bidirecional para o comercial via triggers.
 * Regra: last-write-wins via atualizado_em.
 */
export async function salvarCustos(
  payload: SalvarCustosPayload,
): Promise<{ success: boolean; error?: string; versao?: number; id_custos_emissao?: string }> {
  try {
    // upsert custos_emissao (1:1 por emissão)
    const now = new Date().toISOString();

    // buscar existente
    const { data: existing, error: existingError } = await supabase
      .from('custos_emissao')
      .select('id, versao')
      .eq('id_emissao', payload.id_emissao_comercial)
      .maybeSingle();

    if (existingError) throw existingError;

    const idCustos = existing?.id ?? uuidv4();
    const versao = (existing?.versao ?? 0) + 1;

    const { data: custosRow, error: upsertError } = await supabase
      .from('custos_emissao')
      .upsert({
        id: idCustos,
        id_emissao: payload.id_emissao_comercial,
        versao,
        ...payload.totais,
        atualizado_em: now,
      } as any, { onConflict: 'id_emissao' } as any)
      .select('id, versao')
      .single();

    if (upsertError) throw upsertError;

    // Atualizar linhas sem risco de perder tudo se o insert falhar.
    // Estratégia: upsert primeiro, depois apagar o que foi removido.

    // buscar ids atuais (pra conseguir deletar só o que saiu)
    const { data: existingLinhas, error: existingLinhasError } = await supabase
      .from('custos_linhas')
      .select('id')
      .eq('id_custos_emissao', idCustos);

    if (existingLinhasError) throw existingLinhasError;

    const existingIds = new Set((existingLinhas ?? []).map((r: any) => r.id));

    const seenIds = new Set<string>();
    const desiredRows = (payload.custos ?? []).map((c) => {
      let id = c.id && existingIds.has(c.id) ? c.id : uuidv4();

      // Evitar duplicar o mesmo id no mesmo upsert (causa: "ON CONFLICT ... cannot affect row a second time")
      if (seenIds.has(id)) {
        id = uuidv4();
      }
      seenIds.add(id);

      return {
        id,
        id_custos_emissao: idCustos,
        ...c,
        origem: c.origem || 'manual',
        atualizado_em: now,
      };
    });

    const desiredIds = new Set(desiredRows.map((r) => r.id));

    if (desiredRows.length > 0) {
      const { error: upsertLinhasError } = await supabase
        .from('custos_linhas')
        .upsert(desiredRows as any, { onConflict: 'id' } as any);

      if (upsertLinhasError) throw upsertLinhasError;
    }

    // Agora sim: apagar o que não está mais na UI
    // - se o usuário removeu tudo, apagar tudo
    if (desiredIds.size === 0) {
      const { error: delAllError } = await supabase
        .from('custos_linhas')
        .delete()
        .eq('id_custos_emissao', idCustos);

      if (delAllError) throw delAllError;
    } else {
      const idsToDelete = Array.from(existingIds).filter((id) => !desiredIds.has(id));
      if (idsToDelete.length > 0) {
        const { error: delSomeError } = await supabase
          .from('custos_linhas')
          .delete()
          .eq('id_custos_emissao', idCustos)
          .in('id', idsToDelete);

        if (delSomeError) throw delSomeError;
      }
    }

    return { success: true, versao: custosRow?.versao, id_custos_emissao: idCustos };
  } catch (err: any) {
    console.error('Erro ao salvar custos:', err);
    return { success: false, error: err?.message || 'Erro inesperado ao salvar custos' };
  }
}
