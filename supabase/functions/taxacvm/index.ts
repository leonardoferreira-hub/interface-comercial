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

// Taxa CVM: 0.03% do Volume Total da Oferta
// Aplicável a: Ofertas públicas (CRI, CRA, CR público, DEB público)
const ALIQUOTA = 0.03 / 100; // 0.03%

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

    console.log(`📊 [taxacvm] volume=${volume}`);

    if (volume <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Volume deve ser maior que zero" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const valorTotal = volume * ALIQUOTA;

    console.log(`✅ [taxacvm] Calculado: R$ ${valorTotal.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          nome: "Taxa de Fiscalização CVM",
          papel: "Taxa CVM",
          valor_total: valorTotal,
          tipo_custo: "variavel",
          periodicidade: "upfront",
          formula: "0.03% × Volume Total da Oferta",
          detalhes: {
            aliquota: "0.03%",
            volume: volume,
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [taxacvm] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
