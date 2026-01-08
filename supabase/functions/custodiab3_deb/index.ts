import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Custódia B3 para Debêntures: Tabela progressiva
// Aplicável a: DEB (público e privado cetipado)
// Faixas:
// - Até 100MM: 0.000167%
// - 100MM a 500MM: 0.000100%
// - 500MM a 1BI: 0.000067%
// - Acima 1BI: 0.000033%

interface Faixa {
  limite: number;
  aliquota: number;
}

const FAIXAS: Faixa[] = [
  { limite: 100_000_000, aliquota: 0.000167 / 100 },      // Até 100MM
  { limite: 500_000_000, aliquota: 0.000100 / 100 },      // 100MM a 500MM
  { limite: 1_000_000_000, aliquota: 0.000067 / 100 },    // 500MM a 1BI
  { limite: Infinity, aliquota: 0.000033 / 100 },          // Acima de 1BI
];

function calcularCustodiaProgressiva(volume: number): { valor: number; detalhes: any[] } {
  let valorTotal = 0;
  let volumeRestante = volume;
  let limiteAnterior = 0;
  const detalhes: any[] = [];

  for (const faixa of FAIXAS) {
    if (volumeRestante <= 0) break;

    const faixaMaxima = faixa.limite - limiteAnterior;
    const volumeNaFaixa = Math.min(volumeRestante, faixaMaxima);
    const valorNaFaixa = volumeNaFaixa * faixa.aliquota;

    detalhes.push({
      faixa: limiteAnterior === 0 
        ? `Até R$ ${(faixa.limite / 1_000_000).toFixed(0)}MM`
        : faixa.limite === Infinity
          ? `Acima de R$ ${(limiteAnterior / 1_000_000).toFixed(0)}MM`
          : `R$ ${(limiteAnterior / 1_000_000).toFixed(0)}MM a R$ ${(faixa.limite / 1_000_000).toFixed(0)}MM`,
      aliquota: `${(faixa.aliquota * 100).toFixed(6)}%`,
      volume_na_faixa: volumeNaFaixa,
      valor: valorNaFaixa,
    });

    valorTotal += valorNaFaixa;
    volumeRestante -= volumeNaFaixa;
    limiteAnterior = faixa.limite;
  }

  return { valor: valorTotal, detalhes };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let volume = 0;

    if (req.method === "POST") {
      const body = await req.json();
      volume = parseFloat(body.volume) || 0;
    } else {
      const url = new URL(req.url);
      volume = parseFloat(url.searchParams.get("volume") || "0");
    }

    console.log(`📊 [custodiab3_deb] volume=${volume}`);

    if (volume <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Volume deve ser maior que zero" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resultado = calcularCustodiaProgressiva(volume);

    console.log(`✅ [custodiab3_deb] Calculado: R$ ${resultado.valor.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          nome: "Custódia B3 - Debênture",
          papel: "Custódia B3",
          valor_total: resultado.valor,
          tipo_custo: "variavel",
          periodicidade: "mensal",
          formula: "Tabela progressiva por faixas de volume",
          detalhes: {
            volume: volume,
            faixas: resultado.detalhes,
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [custodiab3_deb] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
