import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "http://100.91.53.76:8082",
  "http://100.91.53.76:8083",
  "http://100.91.53.76:8084",
  "http://100.91.53.76:5173",
  "http://localhost:5173",
  "https://calculadoratrv.lovable.app",
  "https://interfaceestruturacao.lovable.app",
  "https://interfacecompliance.lovable.app",
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

// ANBIMA CRI: 0.003968% do Volume, com mínimo e máximo
// Aplicável a: CRI
const ALIQUOTA = 0.003968 / 100; // 0.003968%
const VALOR_MINIMO = 1416.00;
const VALOR_MAXIMO = 2830.00;

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

    console.log(`📊 [anbima_cri] volume=${volume}`);

    if (volume <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Volume deve ser maior que zero" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let valorCalculado = volume * ALIQUOTA;
    let valorFinal = Math.max(VALOR_MINIMO, Math.min(VALOR_MAXIMO, valorCalculado));
    
    const aplicouMinimo = valorCalculado < VALOR_MINIMO;
    const aplicouMaximo = valorCalculado > VALOR_MAXIMO;

    console.log(`✅ [anbima_cri] Calculado: R$ ${valorCalculado.toFixed(2)}, Final: R$ ${valorFinal.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          nome: "Taxa ANBIMA - CRI",
          papel: "Taxa ANBIMA",
          valor_total: valorFinal,
          tipo_custo: "variavel",
          periodicidade: "upfront",
          formula: "0.003968% × Volume (mín R$ 1.416, máx R$ 2.830)",
          detalhes: {
            aliquota: "0.003968%",
            volume: volume,
            valor_calculado: valorCalculado,
            valor_minimo: VALOR_MINIMO,
            valor_maximo: VALOR_MAXIMO,
            aplicou_minimo: aplicouMinimo,
            aplicou_maximo: aplicouMaximo,
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [anbima_cri] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
