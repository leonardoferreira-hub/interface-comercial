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
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da emissão é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 [detalhes-emissao] Buscando emissão ID: ${id}`);

    // Buscar emissão
    const { data: emissao, error: emissaoError } = await supabase
      .from("emissoes")
      .select("*")
      .eq("id", id)
      .single();

    if (emissaoError) {
      console.error("❌ [detalhes-emissao] Erro ao buscar emissão:", emissaoError);
      return new Response(
        JSON.stringify({ success: false, error: emissaoError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar nomes de referência do schema base_custos
    let categoriaInfo = null;
    let veiculoInfo = null;
    let tipoOfertaInfo = null;
    let lastroInfo = null;

    if (emissao.categoria) {
      const { data } = await supabase
        .schema("base_custos")
        .from("categorias")
        .select("id, codigo, nome")
        .eq("id", emissao.categoria)
        .single();
      categoriaInfo = data;
    }

    if (emissao.veiculo) {
      const { data } = await supabase
        .schema("base_custos")
        .from("veiculos")
        .select("id, codigo, nome")
        .eq("id", emissao.veiculo)
        .single();
      veiculoInfo = data;
    }

    if (emissao.tipo_oferta) {
      const { data } = await supabase
        .schema("base_custos")
        .from("tipos_oferta")
        .select("id, codigo, nome")
        .eq("id", emissao.tipo_oferta)
        .single();
      tipoOfertaInfo = data;
    }

    if (emissao.lastro) {
      const { data } = await supabase
        .schema("base_custos")
        .from("lastros")
        .select("id, codigo, nome")
        .eq("id", emissao.lastro)
        .single();
      lastroInfo = data;
    }

    // Buscar séries
    const { data: series, error: seriesError } = await supabase
      .from("series")
      .select("*")
      .eq("id_emissao", id)
      .order("numero", { ascending: true });

    if (seriesError) {
      console.error("❌ [detalhes-emissao] Erro ao buscar séries:", seriesError);
    }

    // Buscar custos da emissão
    const { data: custos, error: custosError } = await supabase
      .from("custos_emissao")
      .select(`
        *,
        custos_linhas(*)
      `)
      .eq("id_emissao", id)
      .single();

    if (custosError && custosError.code !== "PGRST116") {
      console.error("❌ [detalhes-emissao] Erro ao buscar custos:", custosError);
    }

    // Buscar dados da empresa
    const { data: dadosEmpresa, error: empresaError } = await supabase
      .from("dados_empresa")
      .select("*")
      .eq("id_emissao", id)
      .single();

    if (empresaError && empresaError.code !== "PGRST116") {
      console.error("❌ [detalhes-emissao] Erro ao buscar dados empresa:", empresaError);
    }

    console.log(`✅ [detalhes-emissao] Emissão encontrada: ${emissao.numero_emissao}, ${series?.length || 0} séries`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...emissao,
          status_proposta: emissao.status || 'rascunho',
          data_criacao: emissao.criado_em,
          categoria_info: categoriaInfo,
          veiculo_info: veiculoInfo,
          tipo_oferta_info: tipoOfertaInfo,
          lastro_info: lastroInfo,
          series: series || [],
          custos: custos || null,
          dados_empresa: dadosEmpresa || null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [detalhes-emissao] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
