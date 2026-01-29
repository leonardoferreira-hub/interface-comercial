import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "http://100.91.53.76:5173",
  "http://100.91.53.76:5174",
  "http://100.91.53.76:5176",
];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
};

// Registro B3 para Debênture Privada Cetipada: Tabela progressiva × prazo POR SÉRIE
// Aplicável a: DEB oferta privada cetipada
// Faixas (50% das taxas públicas):
// - Até 100MM: 0.0010%
// - 100MM a 500MM: 0.00075%
// - 500MM a 1BI: 0.0005%
// - Acima 1BI: 0.00025%
// Multiplicado pelo prazo em anos

interface Serie {
  numero: number;
  valor_emissao: number;
  prazo?: number; // Em anos
}

interface Faixa {
  limite: number;
  aliquota: number;
}

// Taxas são 50% das taxas públicas
const FAIXAS: Faixa[] = [
  { limite: 100_000_000, aliquota: 0.0010 / 100 },        // Até 100MM (50% de 0.0020%)
  { limite: 500_000_000, aliquota: 0.00075 / 100 },       // 100MM a 500MM (50% de 0.0015%)
  { limite: 1_000_000_000, aliquota: 0.0005 / 100 },      // 500MM a 1BI (50% de 0.0010%)
  { limite: Infinity, aliquota: 0.00025 / 100 },           // Acima de 1BI (50% de 0.0005%)
];

function calcularRegistroProgressivo(volume: number, prazo: number): { valor: number; faixasAplicadas: any[] } {
  let valorBase = 0;
  let volumeRestante = volume;
  let limiteAnterior = 0;
  const faixasAplicadas: any[] = [];

  for (const faixa of FAIXAS) {
    if (volumeRestante <= 0) break;

    const faixaMaxima = faixa.limite - limiteAnterior;
    const volumeNaFaixa = Math.min(volumeRestante, faixaMaxima);
    const valorNaFaixa = volumeNaFaixa * faixa.aliquota;

    faixasAplicadas.push({
      faixa: limiteAnterior === 0 
        ? `Até R$ ${(faixa.limite / 1_000_000).toFixed(0)}MM`
        : faixa.limite === Infinity
          ? `Acima de R$ ${(limiteAnterior / 1_000_000_000).toFixed(0)}BI`
          : `R$ ${(limiteAnterior / 1_000_000).toFixed(0)}MM a R$ ${(faixa.limite / 1_000_000).toFixed(0)}MM`,
      aliquota: `${(faixa.aliquota * 100).toFixed(5)}%`,
      volume_na_faixa: volumeNaFaixa,
      valor_base: valorNaFaixa,
    });

    valorBase += valorNaFaixa;
    volumeRestante -= volumeNaFaixa;
    limiteAnterior = faixa.limite;
  }

  // Multiplicar pelo prazo
  const valorFinal = valorBase * prazo;

  return { valor: valorFinal, faixasAplicadas };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let series: Serie[] = [];
    let volume = 0;
    let prazoGeral = 1;

    if (req.method === "POST") {
      const body = await req.json();
      series = body.series || [];
      volume = parseFloat(body.volume) || 0;
      prazoGeral = parseFloat(body.prazo) || 1;
    } else {
      const url = new URL(req.url);
      const seriesParam = url.searchParams.get("series");
      if (seriesParam) {
        series = JSON.parse(seriesParam);
      }
      volume = parseFloat(url.searchParams.get("volume") || "0");
      prazoGeral = parseFloat(url.searchParams.get("prazo") || "1");
    }

    console.log(`📊 [registrob3_debpriv] series=${JSON.stringify(series)}, volume=${volume}, prazoGeral=${prazoGeral}`);

    // Se não houver séries, usar volume total como uma única série
    if (series.length === 0 && volume > 0) {
      series = [{ numero: 1, valor_emissao: volume, prazo: prazoGeral }];
    }

    if (series.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Séries ou volume são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let valorTotalGeral = 0;
    const detalhesSeries: any[] = [];

    for (const serie of series) {
      const prazo = serie.prazo || prazoGeral || 1;
      const resultado = calcularRegistroProgressivo(serie.valor_emissao, prazo);
      valorTotalGeral += resultado.valor;
      
      detalhesSeries.push({
        serie: serie.numero,
        volume: serie.valor_emissao,
        prazo: prazo,
        valor: resultado.valor,
        faixas: resultado.faixasAplicadas,
      });
    }

    console.log(`✅ [registrob3_debpriv] Calculado: R$ ${valorTotalGeral.toFixed(2)} (${series.length} séries)`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          nome: "Registro B3 - Debênture Privada",
          papel: "Registro B3",
          valor_total: valorTotalGeral,
          tipo_custo: "variavel",
          periodicidade: "upfront",
          formula: "Tabela progressiva × prazo (anos) por série (50% taxas públicas)",
          detalhes: {
            quantidade_series: series.length,
            series: detalhesSeries,
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [registrob3_debpriv] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
