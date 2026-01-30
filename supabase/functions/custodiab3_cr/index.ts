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

// Custódia B3 para CR/CRI: 0.000800% do Volume de Emissão
// Aplicável a: CR (público e privado cetipado) e CRI
// Periodicidade: MENSAL
const ALIQUOTA = 0.000800 / 100; // 0.000800% = 0.0000080

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

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

    console.log(`📊 [custodiab3_cr] volume=${volume}`);

    if (volume <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Volume deve ser maior que zero" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const valorTotal = volume * ALIQUOTA;

    console.log(`✅ [custodiab3_cr] Calculado: R$ ${valorTotal.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          nome: "Custódia B3 - CR/CRI",
          papel: "Custódia B3",
          valor_total: valorTotal,
          tipo_custo: "variavel",
          periodicidade: "mensal",
          formula: "0.000800% × Volume Emissão (mensal)",
          detalhes: {
            aliquota: "0.000800%",
            volume: volume,
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [custodiab3_cr] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
