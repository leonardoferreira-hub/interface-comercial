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
        .from("categorias")
        .select("id")
        .eq("codigo", categoria)
        .single();
      categoriaId = cat?.id;
      console.log(`📌 [criar-emissao] Categoria "${categoria}" -> ID: ${categoriaId}`);
    }

    if (veiculo) {
      const { data: veic } = await supabase
        .from("veiculos")
        .select("id")
        .eq("nome", veiculo)
        .single();
      veiculoId = veic?.id;
      console.log(`📌 [criar-emissao] Veículo "${veiculo}" -> ID: ${veiculoId}`);
    }

    if (oferta) {
      const { data: of } = await supabase
        .from("tipos_oferta")
        .select("id")
        .eq("nome", oferta)
        .single();
      tipoOfertaId = of?.id;
      console.log(`📌 [criar-emissao] Oferta "${oferta}" -> ID: ${tipoOfertaId}`);
    }

    if (lastro) {
      const { data: las } = await supabase
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
