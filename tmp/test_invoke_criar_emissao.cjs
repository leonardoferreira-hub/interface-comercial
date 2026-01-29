const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
if (!url || !anon) throw new Error('Missing env');

const supabase = createClient(url, anon);

(async () => {
  const payload = {
    demandante_proposta: 'Teste',
    empresa_destinataria: 'Teste',
    categoria: 'DEB',
    oferta: 'Oferta CVM 160',
    veiculo: 'eaa0051e-5a29-4743-bf2c-6dbd321a9284',
    lastro: null,
    quantidade_series: 1,
    series: [{ numero: 1, valor_emissao: 1000000, prazo: null }],
  };

  const res = await supabase.functions.invoke('fluxo-1-criar-emissao', { body: payload });
  console.log('data', res.data);
  console.log('error', res.error);
})();
