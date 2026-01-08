import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Custódia B3 para CRA: 0.000300% do Volume de Emissão
// Aplicável a: CRA
// Periodicidade: MENSAL
const ALIQUOTA = 0.000300 / 100; // 0.000300% = 0.0000030

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

    console.log(`📊 [custodiab3_cra] volume=${volume}`);

    if (volume <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Volume deve ser maior que zero" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const valorTotal = volume * ALIQUOTA;

    console.log(`✅ [custodiab3_cra] Calculado: R$ ${valorTotal.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          nome: "Custódia B3 - CRA",
          papel: "Custódia B3",
          valor_total: valorTotal,
          tipo_custo: "variavel",
          periodicidade: "mensal",
          formula: "0.000300% × Volume Emissão (mensal)",
          detalhes: {
            aliquota: "0.000300%",
            volume: volume,
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [custodiab3_cra] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
