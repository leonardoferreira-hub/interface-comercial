const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
if (!url || !anon) throw new Error('Missing env');

const supabase = createClient(url, anon);

(async () => {
  // 1) list emissions to pick one id
  const list = await supabase.functions.invoke('fluxo-0-listar-emissoes', { body: { page: 1, limit: 5 } });
  console.log('list error?', list.error);
  const first = list.data?.data?.[0] || list.data?.[0];
  console.log('first', first);
  if (!first?.id) process.exit(0);

  // 2) try salvar custos with minimal payload
  const body = {
    id_emissao: first.id,
    custos: [],
    totais: { total_upfront: 0, total_anual: 0, total_mensal: 0, total_primeiro_ano: 0, total_anos_subsequentes: 0 },
    custos_series: [],
  };
  const res = await supabase.functions.invoke('fluxo-1-salvar-custos', { body });

  console.log('invoke status ok?');
  console.log('data', res.data);
  console.log('error', res.error);
})();
