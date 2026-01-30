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
    console.log("📝 [criar-emissao] Payload recebido:", JSON.stringify(body));

    const {
      demandante_proposta,
      empresa_destinataria,
      categoria,
      oferta,
      veiculo,
      volume,
      nome_operacao,
      empresa_razao_social,
      empresa_nome_fantasia,
      empresa_cnpj,
      lastro,
      series,
    } = body;

    // Buscar IDs das referências
    let categoriaId = null;
    let veiculoId = null;
    let tipoOfertaId = null;
    let lastroId = null;

    if (categoria) {
      const { data: cat } = await supabase
        .schema("base_custos")
        .from("categorias")
        .select("id")
        .eq("codigo", categoria)
        .single();
      categoriaId = cat?.id;
      console.log(`📌 [criar-emissao] Categoria "${categoria}" -> ID: ${categoriaId}`);
    }

    if (veiculo) {
      const { data: veic } = await supabase
        .schema("base_custos")
        .from("veiculos")
        .select("id")
        .eq("nome", veiculo)
        .single();
      veiculoId = veic?.id;
      console.log(`📌 [criar-emissao] Veículo "${veiculo}" -> ID: ${veiculoId}`);
    }

    if (oferta) {
      const { data: of } = await supabase
        .schema("base_custos")
        .from("tipos_oferta")
        .select("id")
        .eq("nome", oferta)
        .single();
      tipoOfertaId = of?.id;
      console.log(`📌 [criar-emissao] Oferta "${oferta}" -> ID: ${tipoOfertaId}`);
    }

    if (lastro) {
      const { data: las } = await supabase
        .schema("base_custos")
        .from("lastros")
        .select("id")
        .eq("nome", lastro)
        .single();
      lastroId = las?.id;
      console.log(`📌 [criar-emissao] Lastro "${lastro}" -> ID: ${lastroId}`);
    }

    // Gerar número da emissão
    const { data: numeroData, error: numeroError } = await supabase.rpc("gerar_numero_emissao");
    
    if (numeroError) {
      console.error("❌ [criar-emissao] Erro ao gerar número:", numeroError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao gerar número da emissão" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const numeroEmissao = numeroData;
    console.log(`🔢 [criar-emissao] Número gerado: ${numeroEmissao}`);

    // Criar emissão
    const { data: emissao, error: emissaoError } = await supabase
      .from("emissoes")
      .insert({
        numero_emissao: numeroEmissao,
        demandante_proposta,
        empresa_destinataria,
        categoria: categoriaId,
        oferta,
        veiculo: veiculoId,
        tipo_oferta: tipoOfertaId,
        volume: volume || 0,
        nome_operacao,
        empresa_razao_social,
        empresa_nome_fantasia,
        empresa_cnpj,
        lastro: lastroId,
        status: "rascunho",
      })
      .select()
      .single();

    if (emissaoError) {
      console.error("❌ [criar-emissao] Erro ao criar emissão:", emissaoError);
      return new Response(
        JSON.stringify({ success: false, error: emissaoError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [criar-emissao] Emissão criada: ${emissao.id}`);

    // Criar séries se existirem
    if (series && Array.isArray(series) && series.length > 0) {
      const seriesData = series.map((serie: any, index: number) => ({
        id_emissao: emissao.id,
        numero: index + 1,
        valor_emissao: serie.valor_emissao || 0,
        prazo: serie.prazo || null,
        percentual_volume: serie.percentual_volume || 0,
        taxa_juros: serie.taxa_juros || null,
        data_vencimento: serie.data_vencimento || null,
      }));

      const { error: seriesError } = await supabase
        .from("series")
        .insert(seriesData);

      if (seriesError) {
        console.error("❌ [criar-emissao] Erro ao criar séries:", seriesError);
      } else {
        console.log(`✅ [criar-emissao] ${seriesData.length} séries criadas`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: emissao,
        message: `Emissão ${numeroEmissao} criada com sucesso`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [criar-emissao] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
