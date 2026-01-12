import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract ID from query params
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da emissão é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📜 [historico-emissao] Buscando histórico para ID: ${id}`);

    // Buscar versão atual da emissão
    const { data: emissao, error: emissaoError } = await supabase
      .from("emissoes")
      .select("versao, numero_emissao")
      .eq("id", id)
      .single();

    if (emissaoError) {
      console.error("❌ [historico-emissao] Erro ao buscar emissão:", emissaoError);
      return new Response(
        JSON.stringify({ success: false, error: emissaoError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar histórico completo
    const { data: historico, error: historicoError } = await supabase
      .from("historico_emissoes")
      .select("*")
      .eq("id_emissao", id)
      .order("criado_em", { ascending: false });

    if (historicoError) {
      console.error("❌ [historico-emissao] Erro ao buscar histórico:", historicoError);
      return new Response(
        JSON.stringify({ success: false, error: historicoError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [historico-emissao] Encontrados ${historico?.length || 0} registros`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          versao_atual: emissao.versao || 1,
          numero_emissao: emissao.numero_emissao,
          historico: historico || [],
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [historico-emissao] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
