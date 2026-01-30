import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// JWT validation helper
async function verifyAuth(req: Request, supabaseUrl: string): Promise<{ user: any | null; error: string | null }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return { user: null, error: "Authorization header missing" };
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return { user: null, error: "Token missing" };
  }

  try {
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { user: null, error: "Invalid token" };
    }
    return { user, error: null };
  } catch (e) {
    return { user: null, error: "Token verification failed" };
  }
}

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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Auth disabled for development
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

    // Buscar status atual e versão
    const { data: emissaoAtual, error: fetchError } = await supabase
      .from("emissoes")
      .select("status, numero_emissao, versao")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("❌ [finalizar-proposta] Erro ao buscar emissão:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Incrementar versão se status mudou
    const statusMudou = emissaoAtual.status !== status;
    const novaVersao = (emissaoAtual.versao || 1) + (statusMudou ? 1 : 0);

    // Atualizar status e versão
    const { data: emissao, error: updateError } = await supabase
      .from("emissoes")
      .update({
        status,
        versao: novaVersao,
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

    // Registrar no histórico com versão
    if (statusMudou) {
      await supabase.from("historico_emissoes").insert({
        id_emissao: id,
        status_anterior: emissaoAtual.status,
        status_novo: status,
        tipo_alteracao: "status",
        versao: novaVersao,
        dados_anteriores: { status: emissaoAtual.status },
        dados_alterados: { status },
        motivo: `Status alterado: ${emissaoAtual.status} → ${status}`,
      });
    }

    console.log(`✅ [finalizar-proposta] Status atualizado de "${emissaoAtual.status}" para "${status}" (v${novaVersao})`);

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
