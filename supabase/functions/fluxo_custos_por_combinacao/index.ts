import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de combinação para tabela de custos
const tabelaCustos: Record<string, string> = {
  "DEB_oferta_privada_pura": "custos_deb_oferta_privada_pura",
  "DEB_oferta_privada_cetipada": "custos_deb_oferta_privada_cetipada",
  "DEB_oferta_publica": "custos_deb_oferta_publica",
  "CR_oferta_privada_pura": "custos_cr_oferta_privada_pura",
  "CR_oferta_privada_cetipada": "custos_cr_oferta_privada_cetipada",
  "CR_oferta_publica": "custos_cr_oferta_publica",
  "CRI_origem": "custos_cri_origem",
  "CRI_destinacao": "custos_cri_destinacao",
  "CRA_origem": "custos_cra_origem",
  "CRA_destinacao": "custos_cra_destinacao",
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
    const categoria = url.searchParams.get("categoria");
    const oferta = url.searchParams.get("oferta");
    const veiculo = url.searchParams.get("veiculo");
    const volume = parseFloat(url.searchParams.get("volume") || "0");

    console.log(`🔍 [custos-combinacao] categoria=${categoria}, oferta=${oferta}, veiculo=${veiculo}, volume=${volume}`);

    if (!categoria) {
      return new Response(
        JSON.stringify({ success: false, error: "Categoria é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determinar qual tabela usar baseado na combinação
    let tabelaKey = "";
    
    if (categoria === "DEB" || categoria === "CR") {
      const ofertaNormalizada = oferta?.toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/á/g, "a")
        .replace(/ã/g, "a")
        .replace(/é/g, "e")
        .replace(/ú/g, "u") || "";
      tabelaKey = `${categoria}_${ofertaNormalizada}`;
    } else if (categoria === "CRI" || categoria === "CRA") {
      // Para CRI/CRA, usar lastro (origem/destinação)
      const lastro = url.searchParams.get("lastro") || "origem";
      tabelaKey = `${categoria}_${lastro.toLowerCase()}`;
    }

    const tabela = tabelaCustos[tabelaKey];
    console.log(`📊 [custos-combinacao] Tabela: ${tabela} (key: ${tabelaKey})`);

    if (!tabela) {
      console.log(`⚠️ [custos-combinacao] Combinação não encontrada, retornando vazio`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            custos: [],
            totais: {
              total_upfront: 0,
              total_recorrente: 0,
              total_primeiro_ano: 0,
            },
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar custos da tabela
    const { data: custos, error } = await supabase
      .from(tabela)
      .select(`
        *,
        prestadores:id_prestador(id, nome)
      `)
      .eq("ativo", true);

    if (error) {
      console.error(`❌ [custos-combinacao] Erro ao buscar custos:`, error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calcular totais
    let totalUpfront = 0;
    let totalRecorrente = 0;

    const custosCalculados = (custos || []).map((custo: any) => {
      let valorUpfront = custo.preco_upfront || 0;
      let valorRecorrente = custo.preco_recorrente || 0;

      // Aplicar cálculo baseado no tipo de preço
      if (custo.tipo_preco === "percentual" && volume > 0) {
        valorUpfront = (custo.preco_upfront || 0) * volume / 100;
        valorRecorrente = (custo.preco_recorrente || 0) * volume / 100;
      }

      // Aplicar gross-up se existir
      if (custo.gross_up && custo.gross_up > 0) {
        valorUpfront = valorUpfront * (1 + custo.gross_up / 100);
        valorRecorrente = valorRecorrente * (1 + custo.gross_up / 100);
      }

      totalUpfront += valorUpfront;
      totalRecorrente += valorRecorrente;

      return {
        ...custo,
        valor_upfront_calculado: valorUpfront,
        valor_recorrente_calculado: valorRecorrente,
        prestador_nome: custo.prestadores?.nome || null,
      };
    });

    // Calcular total do primeiro ano (upfront + 12 meses de recorrente mensal)
    const totalPrimeiroAno = totalUpfront + (totalRecorrente * 12);

    console.log(`✅ [custos-combinacao] ${custosCalculados.length} custos encontrados, upfront=${totalUpfront}, recorrente=${totalRecorrente}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          custos: custosCalculados,
          totais: {
            total_upfront: totalUpfront,
            total_recorrente: totalRecorrente,
            total_primeiro_ano: totalPrimeiroAno,
          },
          tabela_origem: tabela,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [custos-combinacao] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
