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
    const { id, ...updateData } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da emissão é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📝 [atualizar-emissao] ID: ${id}, dados:`, JSON.stringify(updateData));

    // Resolver referências se necessário (tabelas no schema base_custos)
    if (updateData.categoria && typeof updateData.categoria === "string") {
      const { data: cat } = await supabase
        .schema("base_custos")
        .from("categorias")
        .select("id")
        .eq("codigo", updateData.categoria)
        .single();
      updateData.categoria = cat?.id;
    }

    if (updateData.veiculo && typeof updateData.veiculo === "string") {
      const { data: veic } = await supabase
        .schema("base_custos")
        .from("veiculos")
        .select("id")
        .eq("nome", updateData.veiculo)
        .single();
      updateData.veiculo = veic?.id;
    }

    if (updateData.oferta && typeof updateData.oferta === "string") {
      const { data: of } = await supabase
        .schema("base_custos")
        .from("tipos_oferta")
        .select("id")
        .eq("nome", updateData.oferta)
        .single();
      updateData.tipo_oferta = of?.id;
    }

    if (updateData.lastro && typeof updateData.lastro === "string") {
      const { data: las } = await supabase
        .schema("base_custos")
        .from("lastros")
        .select("id")
        .eq("nome", updateData.lastro)
        .single();
      updateData.lastro = las?.id;
    }

    // Atualizar emissão
    const { data: emissao, error: emissaoError } = await supabase
      .from("emissoes")
      .update({
        ...updateData,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (emissaoError) {
      console.error("❌ [atualizar-emissao] Erro:", emissaoError);
      return new Response(
        JSON.stringify({ success: false, error: emissaoError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar séries se fornecidas
    if (updateData.series && Array.isArray(updateData.series)) {
      // Deletar séries existentes
      await supabase.from("series").delete().eq("id_emissao", id);

      // Inserir novas séries
      const seriesData = updateData.series.map((serie: any, index: number) => ({
        id_emissao: id,
        numero: index + 1,
        valor_emissao: serie.valor_emissao || 0,
        percentual_volume: serie.percentual_volume || 0,
        taxa_juros: serie.taxa_juros || null,
        data_vencimento: serie.data_vencimento || null,
      }));

      const { error: seriesError } = await supabase.from("series").insert(seriesData);

      if (seriesError) {
        console.error("❌ [atualizar-emissao] Erro ao atualizar séries:", seriesError);
      } else {
        console.log(`✅ [atualizar-emissao] ${seriesData.length} séries atualizadas`);
      }
    }

    console.log(`✅ [atualizar-emissao] Emissão atualizada: ${emissao.numero_emissao}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: emissao,
        message: "Emissão atualizada com sucesso",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [atualizar-emissao] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
