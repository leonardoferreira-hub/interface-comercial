import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "http://100.91.53.76:8082",
  "http://100.91.53.76:8083",
  "http://100.91.53.76:8084",
  "http://100.91.53.76:5173",
  "http://localhost:5173",
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

// Registro B3 para CR: Tabela progressiva POR SÉRIE
// Aplicável a: CRI, CRA, CR (público e privado cetipado)
// Faixas:
// - Até 500MM: 0.0030%
// - 500MM a 1BI: 0.0020%
// - 1BI a 5BI: 0.0010%
// - Acima 5BI: 0.0005%

interface Serie {
  numero: number;
  valor_emissao: number;
}

interface Faixa {
  limite: number;
  aliquota: number;
}

const FAIXAS: Faixa[] = [
  { limite: 500_000_000, aliquota: 0.0030 / 100 },        // Até 500MM
  { limite: 1_000_000_000, aliquota: 0.0020 / 100 },      // 500MM a 1BI
  { limite: 5_000_000_000, aliquota: 0.0010 / 100 },      // 1BI a 5BI
  { limite: Infinity, aliquota: 0.0005 / 100 },            // Acima de 5BI
];

function calcularRegistroProgressivo(volume: number): { valor: number; faixasAplicadas: any[] } {
  let valorTotal = 0;
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
          : `R$ ${(limiteAnterior / 1_000_000).toFixed(0)}MM a R$ ${(faixa.limite / 1_000_000_000).toFixed(1)}BI`,
      aliquota: `${(faixa.aliquota * 100).toFixed(4)}%`,
      volume_na_faixa: volumeNaFaixa,
      valor: valorNaFaixa,
    });

    valorTotal += valorNaFaixa;
    volumeRestante -= volumeNaFaixa;
    limiteAnterior = faixa.limite;
  }

  return { valor: valorTotal, faixasAplicadas };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let series: Serie[] = [];
    let volume = 0;

    if (req.method === "POST") {
      const body = await req.json();
      series = body.series || [];
      volume = parseFloat(body.volume) || 0;
    } else {
      const url = new URL(req.url);
      const seriesParam = url.searchParams.get("series");
      if (seriesParam) {
        series = JSON.parse(seriesParam);
      }
      volume = parseFloat(url.searchParams.get("volume") || "0");
    }

    console.log(`📊 [registrob3_cr] series=${JSON.stringify(series)}, volume=${volume}`);

    // Se não houver séries, usar volume total como uma única série
    if (series.length === 0 && volume > 0) {
      series = [{ numero: 1, valor_emissao: volume }];
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
      const resultado = calcularRegistroProgressivo(serie.valor_emissao);
      valorTotalGeral += resultado.valor;
      
      detalhesSeries.push({
        serie: serie.numero,
        volume: serie.valor_emissao,
        valor: resultado.valor,
        faixas: resultado.faixasAplicadas,
      });
    }

    console.log(`✅ [registrob3_cr] Calculado: R$ ${valorTotalGeral.toFixed(2)} (${series.length} séries)`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          nome: "Registro B3 - CR/CRI/CRA",
          papel: "Registro B3",
          valor_total: valorTotalGeral,
          tipo_custo: "variavel",
          periodicidade: "upfront",
          formula: "Tabela progressiva por série",
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
    console.error("💥 [registrob3_cr] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
