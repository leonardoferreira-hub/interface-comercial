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

interface Serie {
  numero: number;
  valor_emissao: number;
  prazo?: number;
}

// Funções de cálculo de custos variáveis (inline para evitar chamadas HTTP internas)

function calcularCustodiab3Cr(volume: number): number {
  return volume * (0.000800 / 100);
}

function calcularCustodiab3Cra(volume: number): number {
  return volume * (0.000300 / 100);
}

function calcularCustodiab3Deb(volume: number): number {
  const faixas = [
    { limite: 100_000_000, aliquota: 0.000167 / 100 },
    { limite: 500_000_000, aliquota: 0.000100 / 100 },
    { limite: 1_000_000_000, aliquota: 0.000067 / 100 },
    { limite: Infinity, aliquota: 0.000033 / 100 },
  ];

  let valorTotal = 0;
  let volumeRestante = volume;
  let limiteAnterior = 0;

  for (const faixa of faixas) {
    if (volumeRestante <= 0) break;
    const faixaMaxima = faixa.limite - limiteAnterior;
    const volumeNaFaixa = Math.min(volumeRestante, faixaMaxima);
    valorTotal += volumeNaFaixa * faixa.aliquota;
    volumeRestante -= volumeNaFaixa;
    limiteAnterior = faixa.limite;
  }

  return valorTotal;
}

function calcularAnbimaCri(volume: number): number {
  const valorCalculado = volume * (0.003968 / 100);
  return Math.max(1416.00, Math.min(2830.00, valorCalculado));
}

function calcularTaxaCvm(volume: number): number {
  return volume * (0.03 / 100);
}

function calcularAnbimaTodos(volume: number): number {
  const valorCalculado = volume * (0.002778 / 100);
  return Math.max(9919.00, Math.min(69436.00, valorCalculado));
}

function calcularRegistrob3Cr(series: Serie[], volume: number): number {
  const faixas = [
    { limite: 500_000_000, aliquota: 0.0030 / 100 },
    { limite: 1_000_000_000, aliquota: 0.0020 / 100 },
    { limite: 5_000_000_000, aliquota: 0.0010 / 100 },
    { limite: Infinity, aliquota: 0.0005 / 100 },
  ];

  const seriesParaCalculo = series.length > 0 ? series : [{ numero: 1, valor_emissao: volume }];
  let valorTotalGeral = 0;

  for (const serie of seriesParaCalculo) {
    let valorSerie = 0;
    let volumeRestante = serie.valor_emissao;
    let limiteAnterior = 0;

    for (const faixa of faixas) {
      if (volumeRestante <= 0) break;
      const faixaMaxima = faixa.limite - limiteAnterior;
      const volumeNaFaixa = Math.min(volumeRestante, faixaMaxima);
      valorSerie += volumeNaFaixa * faixa.aliquota;
      volumeRestante -= volumeNaFaixa;
      limiteAnterior = faixa.limite;
    }

    valorTotalGeral += valorSerie;
  }

  return valorTotalGeral;
}

function calcularRegistrob3DebPub(series: Serie[], volume: number, prazoGeral: number = 1): number {
  const faixas = [
    { limite: 100_000_000, aliquota: 0.0020 / 100 },
    { limite: 500_000_000, aliquota: 0.0015 / 100 },
    { limite: 1_000_000_000, aliquota: 0.0010 / 100 },
    { limite: Infinity, aliquota: 0.0005 / 100 },
  ];

  const seriesParaCalculo = series.length > 0 ? series : [{ numero: 1, valor_emissao: volume, prazo: prazoGeral }];
  let valorTotalGeral = 0;

  for (const serie of seriesParaCalculo) {
    const prazo = serie.prazo || prazoGeral || 1;
    let valorBase = 0;
    let volumeRestante = serie.valor_emissao;
    let limiteAnterior = 0;

    for (const faixa of faixas) {
      if (volumeRestante <= 0) break;
      const faixaMaxima = faixa.limite - limiteAnterior;
      const volumeNaFaixa = Math.min(volumeRestante, faixaMaxima);
      valorBase += volumeNaFaixa * faixa.aliquota;
      volumeRestante -= volumeNaFaixa;
      limiteAnterior = faixa.limite;
    }

    valorTotalGeral += valorBase * prazo;
  }

  return valorTotalGeral;
}

function calcularRegistrob3DebPriv(series: Serie[], volume: number, prazoGeral: number = 1): number {
  // 50% das taxas públicas
  const faixas = [
    { limite: 100_000_000, aliquota: 0.0010 / 100 },
    { limite: 500_000_000, aliquota: 0.00075 / 100 },
    { limite: 1_000_000_000, aliquota: 0.0005 / 100 },
    { limite: Infinity, aliquota: 0.00025 / 100 },
  ];

  const seriesParaCalculo = series.length > 0 ? series : [{ numero: 1, valor_emissao: volume, prazo: prazoGeral }];
  let valorTotalGeral = 0;

  for (const serie of seriesParaCalculo) {
    const prazo = serie.prazo || prazoGeral || 1;
    let valorBase = 0;
    let volumeRestante = serie.valor_emissao;
    let limiteAnterior = 0;

    for (const faixa of faixas) {
      if (volumeRestante <= 0) break;
      const faixaMaxima = faixa.limite - limiteAnterior;
      const volumeNaFaixa = Math.min(volumeRestante, faixaMaxima);
      valorBase += volumeNaFaixa * faixa.aliquota;
      volumeRestante -= volumeNaFaixa;
      limiteAnterior = faixa.limite;
    }

    valorTotalGeral += valorBase * prazo;
  }

  return valorTotalGeral;
}

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
    let series: Serie[] = [];

    if (req.method === "POST") {
      const body = await req.json();
      categoria = body.categoria;
      oferta = body.tipo_oferta || body.oferta;
      veiculo = body.veiculo;
      lastro = body.lastro;
      volume = parseFloat(body.volume) || 0;
      series = body.series || [];
      console.log(`📥 [custos-combinacao] POST body:`, JSON.stringify(body));
    } else {
      const url = new URL(req.url);
      categoria = url.searchParams.get("categoria");
      oferta = url.searchParams.get("oferta") || url.searchParams.get("tipo_oferta");
      veiculo = url.searchParams.get("veiculo");
      lastro = url.searchParams.get("lastro");
      volume = parseFloat(url.searchParams.get("volume") || "0");
      const seriesParam = url.searchParams.get("series");
      if (seriesParam) {
        series = JSON.parse(seriesParam);
      }
    }

    console.log(`🔍 [custos-combinacao] categoria=${categoria}, oferta=${oferta}, veiculo=${veiculo}, lastro=${lastro}, volume=${volume}, series=${series.length}`);

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
    // Acessando diretamente o schema base_custos
    if (tabela) {
      console.log(`🔎 [custos-combinacao] Buscando custos fixos em base_custos.${tabela}`);
      
      const { data: custosPrincipais, error: errorPrincipal } = await supabase
        .schema("base_custos")
        .from(tabela)
        .select("*")
        .eq("ativo", true);

      if (errorPrincipal) {
        console.error(`❌ [custos-combinacao] Erro ao buscar custos principais:`, {
          code: errorPrincipal.code,
          message: errorPrincipal.message,
          details: errorPrincipal.details,
          hint: errorPrincipal.hint
        });
      } else {
        console.log(`✅ [custos-combinacao] ${(custosPrincipais || []).length} custos FIXOS encontrados em base_custos.${tabela}`);
        if (custosPrincipais && custosPrincipais.length > 0) {
          console.log(`📋 [custos-combinacao] Papéis encontrados:`, custosPrincipais.map((c: any) => c.papel).join(', '));
        }
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
        console.log(`🔎 [custos-combinacao] Buscando custos veículo em base_custos.${tabelaVeiculo}`);
        
        const { data: custosVeiculo, error: errorVeiculo } = await supabase
          .schema("base_custos")
          .from(tabelaVeiculo)
          .select("*")
          .eq("ativo", true);

        if (errorVeiculo) {
          console.error(`❌ [custos-combinacao] Erro ao buscar custos veículo:`, {
            code: errorVeiculo.code,
            message: errorVeiculo.message,
            details: errorVeiculo.details,
            hint: errorVeiculo.hint
          });
        } else {
          console.log(`✅ [custos-combinacao] ${(custosVeiculo || []).length} custos FIXOS (veículo) encontrados em base_custos.${tabelaVeiculo}`);
          if (custosVeiculo && custosVeiculo.length > 0) {
            console.log(`📋 [custos-combinacao] Papéis veículo:`, custosVeiculo.map((c: any) => c.papel).join(', '));
          }
          todosCustos = [...todosCustos, ...(custosVeiculo || [])];
        }
      }
    }

    // 3. Calcular valores dos custos fixos
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

      totalUpfront += valorUpfront;
      totalRecorrente += valorRecorrente;

      return {
        ...custo,
        valor_upfront_calculado: valorUpfront,
        valor_recorrente_calculado: valorRecorrente,
        prestador_nome: null, // Prestadores estão em schema diferente
        tipo_custo: "fixo",
      };
    });

    // 4. Calcular custos variáveis baseado na combinação
    const custosVariaveis: any[] = [];
    const ofertaNorm = oferta?.toLowerCase() || "";
    const isOfertaPublica = ofertaNorm.includes("cvm") || ofertaNorm.includes("publica");
    const isOfertaPrivadaCetipada = ofertaNorm.includes("cetipada");
    const isOfertaPrivadaPura = ofertaNorm.includes("pura");

    if (volume > 0) {
      // CRI: custodiab3_cr (mesma que CR), anbima_cri, registrob3_cr, taxacvm, anbima_todos
      if (categoria === "CRI") {
        // Custódia B3 (mesma taxa de CR para CRI)
        const custodiaValor = calcularCustodiab3Cr(volume);
        custosVariaveis.push({
          papel: "Custódia B3",
          preco_recorrente: custodiaValor,
          valor_upfront_calculado: 0,
          valor_recorrente_calculado: custodiaValor,
          tipo_custo: "variavel",
          periodicidade: "mensal",
          formula: "0.000800% × Volume (mensal)",
        });
        totalRecorrente += custodiaValor;

        // ANBIMA CRI (específico)
        const anbimaValor = calcularAnbimaCri(volume);
        custosVariaveis.push({
          papel: "Taxa ANBIMA",
          preco_upfront: anbimaValor,
          valor_upfront_calculado: anbimaValor,
          valor_recorrente_calculado: 0,
          tipo_custo: "variavel",
          formula: "0.003968% × Volume (mín R$ 1.416, máx R$ 2.830)",
        });
        totalUpfront += anbimaValor;

        // Registro B3
        const registroValor = calcularRegistrob3Cr(series, volume);
        custosVariaveis.push({
          papel: "Registro B3",
          preco_upfront: registroValor,
          valor_upfront_calculado: registroValor,
          valor_recorrente_calculado: 0,
          tipo_custo: "variavel",
          formula: "Tabela progressiva por série",
        });
        totalUpfront += registroValor;

        // Taxa CVM
        const cvmValor = calcularTaxaCvm(volume);
        custosVariaveis.push({
          papel: "Taxa CVM",
          preco_upfront: cvmValor,
          valor_upfront_calculado: cvmValor,
          valor_recorrente_calculado: 0,
          tipo_custo: "variavel",
          formula: "0.03% × Volume",
        });
        totalUpfront += cvmValor;
      }

      // CRA: custodiab3_cra, registrob3_cr, taxacvm, anbima_todos
      if (categoria === "CRA") {
        const custodiaValor = calcularCustodiab3Cra(volume);
        custosVariaveis.push({
          papel: "Custódia B3",
          preco_recorrente: custodiaValor,
          valor_upfront_calculado: 0,
          valor_recorrente_calculado: custodiaValor,
          tipo_custo: "variavel",
          periodicidade: "mensal",
          formula: "0.000300% × Volume (mensal)",
        });
        totalRecorrente += custodiaValor;

        const anbimaValor = calcularAnbimaTodos(volume);
        custosVariaveis.push({
          papel: "Taxa ANBIMA",
          preco_upfront: anbimaValor,
          valor_upfront_calculado: anbimaValor,
          valor_recorrente_calculado: 0,
          tipo_custo: "variavel",
          formula: "0.002778% × Volume (mín R$ 9.919, máx R$ 69.436)",
        });
        totalUpfront += anbimaValor;

        const registroValor = calcularRegistrob3Cr(series, volume);
        custosVariaveis.push({
          papel: "Registro B3",
          preco_upfront: registroValor,
          valor_upfront_calculado: registroValor,
          valor_recorrente_calculado: 0,
          tipo_custo: "variavel",
          formula: "Tabela progressiva por série",
        });
        totalUpfront += registroValor;

        const cvmValor = calcularTaxaCvm(volume);
        custosVariaveis.push({
          papel: "Taxa CVM",
          preco_upfront: cvmValor,
          valor_upfront_calculado: cvmValor,
          valor_recorrente_calculado: 0,
          tipo_custo: "variavel",
          formula: "0.03% × Volume",
        });
        totalUpfront += cvmValor;
      }

      // CR: custodiab3_cr, registrob3_cr, (se público: taxacvm, anbima_todos)
      if (categoria === "CR") {
        if (isOfertaPublica || isOfertaPrivadaCetipada) {
          const custodiaValor = calcularCustodiab3Cr(volume);
          custosVariaveis.push({
            papel: "Custódia B3",
            preco_recorrente: custodiaValor,
            valor_upfront_calculado: 0,
            valor_recorrente_calculado: custodiaValor,
            tipo_custo: "variavel",
            periodicidade: "mensal",
            formula: "0.000800% × Volume (mensal)",
          });
          totalRecorrente += custodiaValor;

          const registroValor = calcularRegistrob3Cr(series, volume);
          custosVariaveis.push({
            papel: "Registro B3",
            preco_upfront: registroValor,
            valor_upfront_calculado: registroValor,
            valor_recorrente_calculado: 0,
            tipo_custo: "variavel",
            formula: "Tabela progressiva por série",
          });
          totalUpfront += registroValor;
        }

        if (isOfertaPublica) {
          const cvmValor = calcularTaxaCvm(volume);
          custosVariaveis.push({
            papel: "Taxa CVM",
            preco_upfront: cvmValor,
            valor_upfront_calculado: cvmValor,
            valor_recorrente_calculado: 0,
            tipo_custo: "variavel",
            formula: "0.03% × Volume",
          });
          totalUpfront += cvmValor;

          const anbimaValor = calcularAnbimaTodos(volume);
          custosVariaveis.push({
            papel: "Taxa ANBIMA",
            preco_upfront: anbimaValor,
            valor_upfront_calculado: anbimaValor,
            valor_recorrente_calculado: 0,
            tipo_custo: "variavel",
            formula: "0.002778% × Volume (mín R$ 9.919, máx R$ 69.436)",
          });
          totalUpfront += anbimaValor;
        }
      }

      // DEB: custodiab3_deb (se cetipado/público), registrob3_debpub/debpriv, (se público: taxacvm, anbima_todos)
      if (categoria === "DEB" || categoria === "NC") {
        if (isOfertaPublica || isOfertaPrivadaCetipada) {
          const custodiaValor = calcularCustodiab3Deb(volume);
          custosVariaveis.push({
            papel: "Custódia B3",
            preco_recorrente: custodiaValor,
            valor_upfront_calculado: 0,
            valor_recorrente_calculado: custodiaValor,
            tipo_custo: "variavel",
            periodicidade: "mensal",
            formula: "Tabela progressiva por faixas (mensal)",
          });
          totalRecorrente += custodiaValor;
        }

        if (isOfertaPublica) {
          const registroValor = calcularRegistrob3DebPub(series, volume);
          custosVariaveis.push({
            papel: "Registro B3",
            preco_upfront: registroValor,
            valor_upfront_calculado: registroValor,
            valor_recorrente_calculado: 0,
            tipo_custo: "variavel",
            formula: "Tabela progressiva × prazo por série",
          });
          totalUpfront += registroValor;

          const cvmValor = calcularTaxaCvm(volume);
          custosVariaveis.push({
            papel: "Taxa CVM",
            preco_upfront: cvmValor,
            valor_upfront_calculado: cvmValor,
            valor_recorrente_calculado: 0,
            tipo_custo: "variavel",
            formula: "0.03% × Volume",
          });
          totalUpfront += cvmValor;

          const anbimaValor = calcularAnbimaTodos(volume);
          custosVariaveis.push({
            papel: "Taxa ANBIMA",
            preco_upfront: anbimaValor,
            valor_upfront_calculado: anbimaValor,
            valor_recorrente_calculado: 0,
            tipo_custo: "variavel",
            formula: "0.002778% × Volume (mín R$ 9.919, máx R$ 69.436)",
          });
          totalUpfront += anbimaValor;
        } else if (isOfertaPrivadaCetipada) {
          const registroValor = calcularRegistrob3DebPriv(series, volume);
          custosVariaveis.push({
            papel: "Registro B3",
            preco_upfront: registroValor,
            valor_upfront_calculado: registroValor,
            valor_recorrente_calculado: 0,
            tipo_custo: "variavel",
            formula: "Tabela progressiva × prazo por série (50% taxas)",
          });
          totalUpfront += registroValor;
        }
        // Privada pura: não tem custos variáveis B3
      }
    }

    // 5. Combinar custos fixos e variáveis
    const todosOsCustos = [...custosCalculados, ...custosVariaveis];

    // Calcular total do primeiro ano (upfront + 12 meses de recorrente mensal)
    const totalPrimeiroAno = totalUpfront + (totalRecorrente * 12);

    console.log(`✅ [custos-combinacao] Total: ${todosOsCustos.length} custos (${custosCalculados.length} fixos, ${custosVariaveis.length} variáveis), upfront=${totalUpfront}, recorrente=${totalRecorrente}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          custos: todosOsCustos,
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
