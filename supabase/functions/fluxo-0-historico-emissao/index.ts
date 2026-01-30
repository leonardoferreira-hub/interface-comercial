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
