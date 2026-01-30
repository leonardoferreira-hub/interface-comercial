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

// Mapeamento de papel para colunas da tabela custos
const papelToColumn: Record<string, { upfront?: string; recorrente?: string; recorrencia?: string }> = {
  "Agente Fiduciário": { 
    upfront: "fee_agente_fiduciario_upfront", 
    recorrente: "fee_agente_fiduciario_recorrente",
    recorrencia: "fee_agente_fiduciario_recorrencia"
  },
  "Securitizadora": { 
    upfront: "fee_securitizadora_upfront", 
    recorrente: "fee_securitizadora_recorrente",
    recorrencia: "fee_securitizadora_recorrencia"
  },
  "Custodiante Lastro": { 
    upfront: "fee_custodiante_lastro_upfront", 
    recorrente: "fee_custodiante_lastro_recorrente",
    recorrencia: "fee_custodiante_lastro_recorrencia"
  },
  "Liquidante": { 
    upfront: "fee_liquidante_upfront", 
    recorrente: "fee_liquidante_recorrente",
    recorrencia: "fee_liquidante_recorrencia"
  },
  "Escriturador": { 
    upfront: "fee_escriturador_upfront", 
    recorrente: "fee_escriturador_recorrente",
    recorrencia: "fee_escriturador_recorrencia"
  },
  "Escriturador NC": { 
    upfront: "fee_escriturador_nc_upfront", 
    recorrente: "fee_escriturador_nc_recorrente",
    recorrencia: "fee_escriturador_nc_recorrencia"
  },
  "Contabilidade": { 
    recorrente: "fee_contabilidade_recorrente",
    recorrencia: "fee_contabilidade_recorrencia"
  },
  "Auditoria": { 
    recorrente: "fee_auditoria_recorrente",
    recorrencia: "fee_auditoria_recorrencia"
  },
  "Servicer": { 
    upfront: "fee_servicer_upfront", 
    recorrente: "fee_servicer_recorrente",
    recorrencia: "fee_servicer_recorrencia"
  },
  "Gerenciador Obra": { 
    upfront: "fee_gerenciador_obra_upfront", 
    recorrente: "fee_gerenciador_obra_recorrente",
    recorrencia: "fee_gerenciador_obra_recorrencia"
  },
  "Coordenador Líder": { upfront: "fee_coordenador_lider_upfront" },
  "Assessor Legal": { upfront: "fee_assessor_legal_upfront" },
  "Taxa CVM": { upfront: "taxa_fiscalizacao_oferta_upfront" },
  "Taxa ANBIMA": { upfront: "taxa_anbima_upfront" },
};

// Custos que devem ser salvos por série (não na tabela custos global)
const custosPerSerie = ["Registro B3", "Custódia B3"];

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
    const { id_emissao, custos, totais, custos_series } = body;

    if (!id_emissao) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da emissão é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`💰 [salvar-custos] Emissão: ${id_emissao}, custos: ${custos?.length || 0}, custos_series: ${custos_series?.length || 0}`);

    // ====== BUSCAR VERSÃO ATUAL DA EMISSÃO ======
    const { data: emissaoAtual } = await supabase
      .from("emissoes")
      .select("versao, status")
      .eq("id", id_emissao)
      .single();

    const versaoAtual = emissaoAtual?.versao || 1;

    // ====== 1. SALVAR custos_emissao (totais) ======
    const { data: existingCustos } = await supabase
      .from("custos_emissao")
      .select("id, total_upfront, total_anual, total_mensal")
      .eq("id_emissao", id_emissao)
      .single();

    // Verificar se houve alteração nos totais
    const custosAnteriores = existingCustos ? {
      total_upfront: existingCustos.total_upfront,
      total_anual: existingCustos.total_anual,
      total_mensal: existingCustos.total_mensal,
    } : null;

    let custosEmissaoId: string;

    if (existingCustos) {
      const { error: updateError } = await supabase
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
        .eq("id", existingCustos.id);

      if (updateError) {
        console.error("❌ [salvar-custos] Erro ao atualizar custos_emissao:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      custosEmissaoId = existingCustos.id;
      await supabase.from("custos_linhas").delete().eq("id_custos_emissao", custosEmissaoId);
    } else {
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

    // ====== 2. SALVAR custos_linhas (detalhado normalizado) ======
    if (custos && Array.isArray(custos) && custos.length > 0) {
      const linhasData = custos.map((custo: any) => ({
        id_custos_emissao: custosEmissaoId,
        papel: custo.papel || "Não especificado",
        id_prestador: custo.id_prestador || null,
        tipo_preco: custo.tipo_preco || "fixo",
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
      } else {
        console.log(`✅ [salvar-custos] ${linhasData.length} linhas de custos salvas em custos_linhas`);
      }
    }

    // ====== 3. SALVAR tabela custos (desnormalizado por papel) ======
    if (custos && Array.isArray(custos) && custos.length > 0) {
      // Filtrar apenas custos globais (não per-série)
      const custosGlobais = custos.filter((c: any) => !custosPerSerie.includes(c.papel));

      // Montar objeto com valores zerados
      const custosRecord: Record<string, any> = { id_emissao };
      
      // Inicializar todas as colunas com 0
      Object.values(papelToColumn).forEach(mapping => {
        if (mapping.upfront) custosRecord[mapping.upfront] = 0;
        if (mapping.recorrente) custosRecord[mapping.recorrente] = 0;
        if (mapping.recorrencia) custosRecord[mapping.recorrencia] = 0;
      });

      // Preencher com valores dos custos
      custosGlobais.forEach((custo: any) => {
        const mapping = papelToColumn[custo.papel];
        if (mapping) {
          if (mapping.upfront && custo.valor_upfront_bruto) {
            custosRecord[mapping.upfront] = custo.valor_upfront_bruto;
          }
          if (mapping.recorrente && custo.valor_recorrente_bruto) {
            custosRecord[mapping.recorrente] = custo.valor_recorrente_bruto;
          }
          // Para recorrencia, usar periodicidade em meses (12 = anual, 1 = mensal)
          if (mapping.recorrencia && custo.periodicidade) {
            custosRecord[mapping.recorrencia] = custo.periodicidade === 'mensal' ? 1 : 12;
          }
        }
      });

      console.log(`📊 [salvar-custos] Custos globais para tabela custos:`, JSON.stringify(custosRecord));

      // Verificar se já existe registro na tabela custos
      const { data: existingCustosGlobal } = await supabase
        .from("custos")
        .select("id")
        .eq("id_emissao", id_emissao)
        .single();

      if (existingCustosGlobal) {
        const { error: updateCustosError } = await supabase
          .from("custos")
          .update(custosRecord)
          .eq("id_emissao", id_emissao);

        if (updateCustosError) {
          console.error("❌ [salvar-custos] Erro ao atualizar tabela custos:", updateCustosError);
        } else {
          console.log(`✅ [salvar-custos] Tabela custos atualizada`);
        }
      } else {
        const { error: insertCustosError } = await supabase
          .from("custos")
          .insert(custosRecord);

        if (insertCustosError) {
          console.error("❌ [salvar-custos] Erro ao inserir na tabela custos:", insertCustosError);
        } else {
          console.log(`✅ [salvar-custos] Tabela custos criada`);
        }
      }
    }

    // ====== 4. SALVAR custos_series (Registro B3 e Custódia B3 por série) ======
    if (custos_series && Array.isArray(custos_series) && custos_series.length > 0) {
      console.log(`📊 [salvar-custos] Salvando custos por série:`, JSON.stringify(custos_series));

      // Buscar séries da emissão
      const { data: seriesData } = await supabase
        .from("series")
        .select("id, numero, valor_emissao")
        .eq("id_emissao", id_emissao);

      if (seriesData && seriesData.length > 0) {
        for (const serieDb of seriesData) {
          const custoSerie = custos_series.find((cs: any) => cs.numero === serieDb.numero);
          
          if (custoSerie) {
            const valorTotal = (custoSerie.registro_b3 || 0) + (custoSerie.custodia_b3 || 0);
            
            // Verificar se já existe
            const { data: existingCustoSerie } = await supabase
              .from("custos_series")
              .select("id")
              .eq("id_serie", serieDb.id)
              .eq("papel", "Registro/Custódia B3")
              .single();

            if (existingCustoSerie) {
              await supabase
                .from("custos_series")
                .update({
                  registro_b3: custoSerie.registro_b3 || 0,
                  custodia_b3: custoSerie.custodia_b3 || 0,
                  valor: valorTotal,
                })
                .eq("id", existingCustoSerie.id);
            } else {
              await supabase
                .from("custos_series")
                .insert({
                  id_serie: serieDb.id,
                  papel: "Registro/Custódia B3",
                  registro_b3: custoSerie.registro_b3 || 0,
                  custodia_b3: custoSerie.custodia_b3 || 0,
                  valor: valorTotal,
                });
            }
          }
        }
        console.log(`✅ [salvar-custos] Custos por série salvos em custos_series`);
      }
    }

    // ====== 5. REGISTRAR NO HISTÓRICO ======
    const custosNovos = {
      total_upfront: totais?.total_upfront || 0,
      total_anual: totais?.total_anual || 0,
      total_mensal: totais?.total_mensal || 0,
    };

    const temAlteracao = custosAnteriores && (
      custosAnteriores.total_upfront !== custosNovos.total_upfront ||
      custosAnteriores.total_anual !== custosNovos.total_anual ||
      custosAnteriores.total_mensal !== custosNovos.total_mensal
    );

    if (temAlteracao || !existingCustos) {
      const novaVersao = versaoAtual + 1;
      
      // Atualizar versão da emissão
      await supabase
        .from("emissoes")
        .update({ versao: novaVersao, atualizado_em: new Date().toISOString() })
        .eq("id", id_emissao);

      // Registrar no histórico
      await supabase.from("historico_emissoes").insert({
        id_emissao,
        status_anterior: emissaoAtual?.status || "rascunho",
        status_novo: emissaoAtual?.status || "rascunho",
        tipo_alteracao: "custos",
        versao: novaVersao,
        dados_anteriores: custosAnteriores || {},
        dados_alterados: custosNovos,
        motivo: existingCustos ? "Custos atualizados" : "Custos calculados pela primeira vez",
      });

      console.log(`📜 [salvar-custos] Histórico salvo - v${novaVersao}`);
    }

    console.log(`✅ [salvar-custos] Todos os custos salvos para emissão ${id_emissao}`);

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
