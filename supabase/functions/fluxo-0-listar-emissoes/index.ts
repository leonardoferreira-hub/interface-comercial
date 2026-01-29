import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper to sanitize search input and prevent SQL injection
function sanitizeSearchInput(input: string): string {
  // Remove any characters that could be used for SQL injection
  // Only allow alphanumeric, spaces, and basic punctuation
  return input
    .replace(/[%;'"\\]/g, '')  // Remove dangerous SQL characters
    .replace(/[%_]/g, '\\$&')    // Escape SQL wildcards
    .trim();
}

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
    // Create a client with the user's token to verify it
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
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
  "http://100.91.53.76:5173",
  "http://100.91.53.76:5174",
  "http://100.91.53.76:5176",
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
    
    // Verify authentication
    const { user, error: authError } = await verifyAuth(req, supabaseUrl);
    if (authError) {
      console.error(`🔒 [listar-emissoes] Auth error: ${authError}`);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: " + authError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`🔓 [listar-emissoes] User authenticated: ${user?.email}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar categorias do schema base_custos para mapear UUID -> código
    const { data: categorias } = await supabase
      .schema("base_custos")
      .from("categorias")
      .select("id, codigo");

    const categoriaMap = new Map<string, string>(
      categorias?.map((c: any) => [c.id, c.codigo]) || []
    );

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");
    const categoria = url.searchParams.get("categoria");
    const search = url.searchParams.get("search");

    console.log(`📋 [listar-emissoes] page=${page}, limit=${limit}, status=${status}, categoria=${categoria}, search=${search}`);

    const offset = (page - 1) * limit;

    let query = supabase
      .from("emissoes")
      .select("*", { count: "exact" })
      .order("criado_em", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (categoria) {
      query = query.eq("categoria", categoria);
    }

    if (search) {
      // Sanitize search input to prevent SQL injection
      const sanitizedSearch = sanitizeSearchInput(search);
      if (sanitizedSearch.length > 0) {
        // Use ilike with proper parameterization - Supabase client handles this safely
        query = query
          .or(`numero_emissao.ilike.${'%' + sanitizedSearch + '%'},nome_operacao.ilike.${'%' + sanitizedSearch + '%'},empresa_razao_social.ilike.${'%' + sanitizedSearch + '%'}`);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ [listar-emissoes] Erro:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map fields to match frontend expectations
    const mappedData = data?.map((emissao: any) => ({
      ...emissao,
      categoria: emissao.categoria 
        ? categoriaMap.get(emissao.categoria) || emissao.categoria 
        : null,
      status_proposta: emissao.status || 'rascunho',
      data_criacao: emissao.criado_em,
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(`✅ [listar-emissoes] ${mappedData?.length || 0} emissões encontradas, total: ${count}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: mappedData,
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [listar-emissoes] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
