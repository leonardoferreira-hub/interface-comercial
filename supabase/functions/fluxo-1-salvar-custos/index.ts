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
    const { id_emissao, custos, totais } = body;

    if (!id_emissao) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da emissão é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`💰 [salvar-custos] Emissão: ${id_emissao}, custos: ${custos?.length || 0}`);

    // Verificar se já existe custos_emissao para esta emissão
    const { data: existingCustos } = await supabase
      .from("custos_emissao")
      .select("id")
      .eq("id_emissao", id_emissao)
      .single();

    let custosEmissaoId: string;

    if (existingCustos) {
      // Atualizar custos existentes
      const { data: updated, error: updateError } = await supabase
        .from("custos_emissao")
        .update({
          total_upfront: totais?.total_upfront || 0,
          total_mensal: totais?.total_mensal || 0,
          total_anual: totais?.total_anual || 0,
          total_primeiro_ano: totais?.total_primeiro_ano || 0,
          total_anos_subsequentes: totais?.total_anos_subsequentes || 0,
          atualizado_em: new Date().toISOString(),
          calculado_em: new Date().toISOString(),
        })
        .eq("id", existingCustos.id)
        .select()
        .single();

      if (updateError) {
        console.error("❌ [salvar-custos] Erro ao atualizar custos_emissao:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      custosEmissaoId = existingCustos.id;

      // Deletar linhas existentes
      await supabase.from("custos_linhas").delete().eq("id_custos_emissao", custosEmissaoId);
    } else {
      // Criar novo custos_emissao
      const { data: created, error: createError } = await supabase
        .from("custos_emissao")
        .insert({
          id_emissao,
          total_upfront: totais?.total_upfront || 0,
          total_mensal: totais?.total_mensal || 0,
          total_anual: totais?.total_anual || 0,
          total_primeiro_ano: totais?.total_primeiro_ano || 0,
          total_anos_subsequentes: totais?.total_anos_subsequentes || 0,
          calculado_em: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ [salvar-custos] Erro ao criar custos_emissao:", createError);
        return new Response(
          JSON.stringify({ success: false, error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      custosEmissaoId = created.id;
    }

    // Inserir linhas de custos
    if (custos && Array.isArray(custos) && custos.length > 0) {
      const linhasData = custos.map((custo: any) => ({
        id_custos_emissao: custosEmissaoId,
        papel: custo.papel,
        id_prestador: custo.id_prestador || null,
        tipo_preco: custo.tipo_preco || null,
        preco_upfront: custo.preco_upfront || 0,
        preco_recorrente: custo.preco_recorrente || 0,
        periodicidade: custo.periodicidade || null,
        gross_up: custo.gross_up || 0,
        valor_upfront_bruto: custo.valor_upfront_bruto || 0,
        valor_recorrente_bruto: custo.valor_recorrente_bruto || 0,
      }));

      const { error: linhasError } = await supabase
        .from("custos_linhas")
        .insert(linhasData);

      if (linhasError) {
        console.error("❌ [salvar-custos] Erro ao inserir linhas:", linhasError);
        return new Response(
          JSON.stringify({ success: false, error: linhasError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`✅ [salvar-custos] ${linhasData.length} linhas de custos salvas`);
    }

    console.log(`✅ [salvar-custos] Custos salvos para emissão ${id_emissao}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: { id: custosEmissaoId },
        message: "Custos salvos com sucesso",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [salvar-custos] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
