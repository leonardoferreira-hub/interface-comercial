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
  "DEB_oferta_cvm_160": "custos_deb_oferta_publica",
  "CR_oferta_privada_pura": "custos_cr_oferta_privada_pura",
  "CR_oferta_privada_cetipada": "custos_cr_oferta_privada_cetipada",
  "CR_oferta_publica": "custos_cr_oferta_publica",
  "CR_oferta_cvm_160": "custos_cr_oferta_publica",
  "CRI_origem": "custos_cri_origem",
  "CRI_destinacao": "custos_cri_destinacao",
  "CRA_origem": "custos_cra_origem",
  "CRA_destinacao": "custos_cra_destinacao",
};

// Mapeamento de veículo para tabela de custos adicionais
const tabelaVeiculos: Record<string, string> = {
  "veiculo_exclusivo": "custos_veiculo_exclusivo",
  "patrimonio_separado": "custos_patrimonio_separado",
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

    // Suportar GET (query params) e POST (body)
    let categoria: string | null = null;
    let oferta: string | null = null;
    let veiculo: string | null = null;
    let lastro: string | null = null;
    let volume = 0;

    if (req.method === "POST") {
      const body = await req.json();
      categoria = body.categoria;
      oferta = body.tipo_oferta || body.oferta;
      veiculo = body.veiculo;
      lastro = body.lastro;
      volume = parseFloat(body.volume) || 0;
      console.log(`📥 [custos-combinacao] POST body:`, JSON.stringify(body));
    } else {
      const url = new URL(req.url);
      categoria = url.searchParams.get("categoria");
      oferta = url.searchParams.get("oferta") || url.searchParams.get("tipo_oferta");
      veiculo = url.searchParams.get("veiculo");
      lastro = url.searchParams.get("lastro");
      volume = parseFloat(url.searchParams.get("volume") || "0");
    }

    console.log(`🔍 [custos-combinacao] categoria=${categoria}, oferta=${oferta}, veiculo=${veiculo}, lastro=${lastro}, volume=${volume}`);

    if (!categoria) {
      return new Response(
        JSON.stringify({ success: false, error: "Categoria é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determinar qual tabela usar baseado na combinação
    let tabelaKey = "";
    
    if (categoria === "DEB" || categoria === "CR" || categoria === "NC") {
      const ofertaNormalizada = oferta?.toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/á/g, "a")
        .replace(/ã/g, "a")
        .replace(/é/g, "e")
        .replace(/ú/g, "u") || "";
      
      // NC usa mesma tabela que DEB
      const categoriaTabela = categoria === "NC" ? "DEB" : categoria;
      tabelaKey = `${categoriaTabela}_${ofertaNormalizada}`;
    } else if (categoria === "CRI" || categoria === "CRA") {
      // Para CRI/CRA, usar lastro (origem/destinação)
      const lastroNormalizado = lastro?.toLowerCase() || "origem";
      tabelaKey = `${categoria}_${lastroNormalizado}`;
    }

    const tabela = tabelaCustos[tabelaKey];
    console.log(`📊 [custos-combinacao] Tabela principal: ${tabela} (key: ${tabelaKey})`);

    // Array para armazenar todos os custos
    let todosCustos: any[] = [];

    // 1. Buscar custos da tabela principal (categoria + oferta/lastro)
    if (tabela) {
      const { data: custosPrincipais, error: errorPrincipal } = await supabase
        .from(tabela)
        .select(`
          *,
          prestadores:id_prestador(id, nome)
        `)
        .eq("ativo", true);

      if (errorPrincipal) {
        console.error(`❌ [custos-combinacao] Erro ao buscar custos principais:`, errorPrincipal);
      } else {
        console.log(`✅ [custos-combinacao] ${(custosPrincipais || []).length} custos encontrados na tabela ${tabela}`);
        todosCustos = [...(custosPrincipais || [])];
      }
    } else {
      console.log(`⚠️ [custos-combinacao] Tabela principal não encontrada para key: ${tabelaKey}`);
    }

    // 2. Buscar custos do veículo (se aplicável)
    if (veiculo && (categoria === "DEB" || categoria === "CR" || categoria === "NC")) {
      const veiculoNormalizado = veiculo.toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/í/g, "i")
        .replace(/ô/g, "o");
      
      const tabelaVeiculo = tabelaVeiculos[veiculoNormalizado];
      console.log(`🚗 [custos-combinacao] Tabela veículo: ${tabelaVeiculo} (key: ${veiculoNormalizado})`);

      if (tabelaVeiculo) {
        const { data: custosVeiculo, error: errorVeiculo } = await supabase
          .from(tabelaVeiculo)
          .select(`
            *,
            prestadores:id_prestador(id, nome)
          `)
          .eq("ativo", true);

        if (errorVeiculo) {
          console.error(`❌ [custos-combinacao] Erro ao buscar custos veículo:`, errorVeiculo);
        } else {
          console.log(`✅ [custos-combinacao] ${(custosVeiculo || []).length} custos encontrados na tabela ${tabelaVeiculo}`);
          todosCustos = [...todosCustos, ...(custosVeiculo || [])];
        }
      }
    }

    // 3. Calcular valores
    let totalUpfront = 0;
    let totalRecorrente = 0;

    const custosCalculados = todosCustos.map((custo: any) => {
      let valorUpfront = custo.preco_upfront || 0;
      let valorRecorrente = custo.preco_recorrente || 0;

      // Aplicar cálculo baseado no tipo de preço
      if (custo.tipo_preco === "percentual" && volume > 0) {
        valorUpfront = (custo.preco_upfront || 0) * volume / 100;
        valorRecorrente = (custo.preco_recorrente || 0) * volume / 100;
      }

      // NÃO aplicar gross-up aqui - o frontend calcula o valor bruto
      // O backend retorna apenas o valor líquido e o gross_up para cálculo no front

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

    console.log(`✅ [custos-combinacao] Total: ${custosCalculados.length} custos, upfront=${totalUpfront}, recorrente=${totalRecorrente}`);

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
          tabela_origem: tabela || "nenhuma",
          combinacao: {
            categoria,
            oferta,
            veiculo,
            lastro,
            volume,
          },
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
