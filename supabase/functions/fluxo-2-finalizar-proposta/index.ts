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

    const body = await req.json();
    const { id, status, data_envio } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da emissão é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!status) {
      return new Response(
        JSON.stringify({ success: false, error: "Status é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🏁 [finalizar-proposta] ID: ${id}, status: ${status}`);

    // Buscar status atual
    const { data: emissaoAtual, error: fetchError } = await supabase
      .from("emissoes")
      .select("status, numero_emissao")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("❌ [finalizar-proposta] Erro ao buscar emissão:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar status
    const { data: emissao, error: updateError } = await supabase
      .from("emissoes")
      .update({
        status,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ [finalizar-proposta] Erro ao atualizar:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Registrar no histórico
    await supabase.from("historico_emissoes").insert({
      id_emissao: id,
      status_anterior: emissaoAtual.status,
      status_novo: status,
      motivo: `Proposta finalizada com status: ${status}`,
    });

    console.log(`✅ [finalizar-proposta] Status atualizado de "${emissaoAtual.status}" para "${status}"`);

    return new Response(
      JSON.stringify({
        success: true,
        data: emissao,
        message: `Proposta ${emissaoAtual.numero_emissao} finalizada com sucesso`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [finalizar-proposta] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
