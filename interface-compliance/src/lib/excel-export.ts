import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';

// Helpers
function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toSheet(data: any[]) {
  return XLSX.utils.json_to_sheet(data, { skipHeader: false });
}

export type EmissaoResumoRow = {
  numero_emissao?: string | null;
  nome_operacao?: string | null;
  empresa?: string | null;
  status?: string | null;
  pmo?: string | null;
  categoria?: string | null;
  veiculo?: string | null;
  volume?: number | null;
  data_entrada_pipe?: string | null;
  data_previsao_liquidacao?: string | null;
  data_liquidacao?: string | null;

  custos_total_primeiro_ano?: number | null;
  custos_total_anos_subsequentes?: number | null;
  custos_total_upfront?: number | null;
  custos_total_anual?: number | null;
  custos_total_mensal?: number | null;
  custos_versao?: number | null;

  series_total_valor_emissao?: number | null;
  series_count?: number | null;
};

async function fetchEmissaoBundle(idEmissaoComercial: string) {
  // Emissão (public)
  const { data: emissao, error: emissaoError } = await supabase
    .from('emissoes')
    .select('*')
    .eq('id', idEmissaoComercial)
    .maybeSingle();
  if (emissaoError) throw emissaoError;

  // Série(s)
  const { data: series, error: seriesError } = await supabase
    .from('series')
    .select('*')
    .eq('id_emissao', idEmissaoComercial);
  if (seriesError) throw seriesError;

  // Custos
  const { data: custosEmissao, error: custosError } = await supabase
    .from('custos_emissao')
    .select('*')
    .eq('id_emissao', idEmissaoComercial)
    .maybeSingle();
  if (custosError) throw custosError;

  let custosLinhas: any[] = [];
  if (custosEmissao?.id) {
    const { data: linhas, error: linhasError } = await supabase
      .from('custos_linhas')
      .select('*')
      .eq('id_custos_emissao', custosEmissao.id)
      .order('papel');
    if (linhasError) throw linhasError;
    custosLinhas = linhas ?? [];
  }

  return { emissao, series: series ?? [], custosEmissao, custosLinhas };
}

function buildResumoRow(bundle: Awaited<ReturnType<typeof fetchEmissaoBundle>>): EmissaoResumoRow {
  const { emissao, series, custosEmissao } = bundle;

  const totalSeries = (series ?? []).reduce((acc: number, s: any) => acc + (s.valor_emissao || 0), 0);

  return {
    numero_emissao: emissao?.numero_emissao ?? null,
    nome_operacao: emissao?.nome_operacao ?? emissao?.nome ?? null,
    empresa: emissao?.empresa_razao_social ?? null,
    status: emissao?.status ?? null,
    pmo: (emissao as any)?.pmo_nome ?? null,
    categoria: (emissao as any)?.categoria_nome ?? null,
    veiculo: (emissao as any)?.veiculo_nome ?? null,
    volume: emissao?.volume ?? emissao?.volume_total ?? null,
    data_entrada_pipe: (emissao as any)?.data_entrada_pipe ?? null,
    data_previsao_liquidacao: (emissao as any)?.data_previsao_liquidacao ?? null,
    data_liquidacao: (emissao as any)?.data_liquidacao ?? null,

    custos_total_primeiro_ano: custosEmissao?.total_primeiro_ano ?? null,
    custos_total_anos_subsequentes: custosEmissao?.total_anos_subsequentes ?? null,
    custos_total_upfront: custosEmissao?.total_upfront ?? null,
    custos_total_anual: custosEmissao?.total_anual ?? null,
    custos_total_mensal: custosEmissao?.total_mensal ?? null,
    custos_versao: custosEmissao?.versao ?? null,

    series_total_valor_emissao: totalSeries,
    series_count: (series ?? []).length,
  };
}

export async function exportEmissaoToExcel(idEmissaoComercial: string) {
  const bundle = await fetchEmissaoBundle(idEmissaoComercial);

  const wb = XLSX.utils.book_new();

  const resumo = [buildResumoRow(bundle)];
  XLSX.utils.book_append_sheet(wb, toSheet(resumo), 'Resumo');

  XLSX.utils.book_append_sheet(wb, toSheet(bundle.series), 'Series');

  // custos: header mais “humano”
  const linhas = (bundle.custosLinhas ?? []).map((l: any) => ({
    papel: l.papel,
    periodicidade: l.periodicidade,
    tipo_preco: l.tipo_preco,
    preco_upfront: l.preco_upfront,
    preco_recorrente: l.preco_recorrente,
    gross_up: l.gross_up,
    valor_upfront_bruto: l.valor_upfront_bruto,
    valor_recorrente_bruto: l.valor_recorrente_bruto,
  }));
  XLSX.utils.book_append_sheet(wb, toSheet(linhas), 'Custos_Linhas');

  const numero = bundle.emissao?.numero_emissao ?? 'emissao';
  downloadWorkbook(wb, `${numero}_resumo.xlsx`);
}

export async function exportAllEmissoesToExcel(emissoes: Array<{ id_emissao_comercial?: string; id?: string; numero_emissao?: string | null }>) {
  // Para export completo: compila o Resumo (1 linha por emissão) + sheets detalhados.
  const ids = Array.from(
    new Set(
      (emissoes ?? [])
        .map((e) => (e as any).id_emissao_comercial || (e as any).id)
        .filter(Boolean),
    ),
  ) as string[];

  const bundles = await Promise.all(ids.map((id) => fetchEmissaoBundle(id)));

  const wb = XLSX.utils.book_new();

  const resumoAll = bundles.map((b) => buildResumoRow(b));
  XLSX.utils.book_append_sheet(wb, toSheet(resumoAll), 'Emissoes_Resumo');

  // Sheets detalhadas: séries e custos (linhas) com id/numero para join no Excel
  const allSeries = bundles.flatMap((b) =>
    (b.series ?? []).map((s: any) => ({
      numero_emissao: b.emissao?.numero_emissao ?? null,
      id_emissao: b.emissao?.id ?? null,
      ...s,
    })),
  );
  XLSX.utils.book_append_sheet(wb, toSheet(allSeries), 'Series');

  const allCustosLinhas = bundles.flatMap((b) =>
    (b.custosLinhas ?? []).map((l: any) => ({
      numero_emissao: b.emissao?.numero_emissao ?? null,
      id_emissao: b.emissao?.id ?? null,
      id_custos_emissao: b.custosEmissao?.id ?? null,
      papel: l.papel,
      periodicidade: l.periodicidade,
      tipo_preco: l.tipo_preco,
      preco_upfront: l.preco_upfront,
      preco_recorrente: l.preco_recorrente,
      gross_up: l.gross_up,
      valor_upfront_bruto: l.valor_upfront_bruto,
      valor_recorrente_bruto: l.valor_recorrente_bruto,
    })),
  );
  XLSX.utils.book_append_sheet(wb, toSheet(allCustosLinhas), 'Custos_Linhas');

  downloadWorkbook(wb, `emissoes_resumo.xlsx`);
}
