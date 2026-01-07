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
      .select(`
        *,
        categorias:categoria(id, codigo, nome),
        veiculos:veiculo(id, codigo, nome),
        tipos_oferta:tipo_oferta(id, codigo, nome),
        lastros:lastro(id, codigo, nome)
      `, { count: "exact" })
      .order("criado_em", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (categoria) {
      query = query.eq("categoria", categoria);
    }

    if (search) {
      query = query.or(`numero_emissao.ilike.%${search}%,nome_operacao.ilike.%${search}%,empresa_razao_social.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ [listar-emissoes] Erro:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(`✅ [listar-emissoes] ${data?.length || 0} emissões encontradas, total: ${count}`);

    return new Response(
      JSON.stringify({
        success: true,
        data,
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
