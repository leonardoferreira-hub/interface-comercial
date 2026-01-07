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

    console.log(`📄 [gerar-pdf] Gerando PDF para emissão: ${id}`);

    // Buscar emissão completa
    const { data: emissao, error: emissaoError } = await supabase
      .from("emissoes")
      .select(`
        *,
        categorias:categoria(id, codigo, nome),
        veiculos:veiculo(id, codigo, nome),
        tipos_oferta:tipo_oferta(id, codigo, nome),
        lastros:lastro(id, codigo, nome)
      `)
      .eq("id", id)
      .single();

    if (emissaoError) {
      console.error("❌ [gerar-pdf] Erro ao buscar emissão:", emissaoError);
      return new Response(
        JSON.stringify({ success: false, error: emissaoError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar séries
    const { data: series } = await supabase
      .from("series")
      .select("*")
      .eq("id_emissao", id)
      .order("numero", { ascending: true });

    // Buscar custos
    const { data: custos } = await supabase
      .from("custos_emissao")
      .select(`
        *,
        custos_linhas(*)
      `)
      .eq("id_emissao", id)
      .single();

    // Formatar valores
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value || 0);
    };

    const formatDate = (date: string) => {
      if (!date) return "-";
      return new Date(date).toLocaleDateString("pt-BR");
    };

    // Gerar HTML do PDF
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotação ${emissao.numero_emissao}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1a365d; padding-bottom: 20px; }
    .header h1 { color: #1a365d; font-size: 28px; margin-bottom: 10px; }
    .header .numero { color: #666; font-size: 16px; }
    .section { margin-bottom: 30px; }
    .section-title { color: #1a365d; font-size: 18px; font-weight: 600; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .field { margin-bottom: 10px; }
    .field-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 14px; font-weight: 500; color: #1a202c; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f7fafc; color: #1a365d; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    td { font-size: 14px; }
    .total-row { background: #edf2f7; font-weight: 600; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-rascunho { background: #fef3c7; color: #92400e; }
    .status-enviada { background: #dbeafe; color: #1e40af; }
    .status-aprovada { background: #d1fae5; color: #065f46; }
    .highlight { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
    .highlight-title { font-size: 14px; color: #0369a1; margin-bottom: 10px; }
    .highlight-value { font-size: 24px; font-weight: 700; color: #1a365d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Proposta de Cotação</h1>
      <div class="numero">${emissao.numero_emissao}</div>
      <div style="margin-top: 10px;">
        <span class="status status-${emissao.status || 'rascunho'}">${emissao.status || 'Rascunho'}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Dados da Operação</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Nome da Operação</div>
          <div class="field-value">${emissao.nome_operacao || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">Demandante</div>
          <div class="field-value">${emissao.demandante_proposta || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">Categoria</div>
          <div class="field-value">${emissao.categorias?.nome || emissao.categoria || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">Tipo de Oferta</div>
          <div class="field-value">${emissao.tipos_oferta?.nome || emissao.oferta || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">Veículo</div>
          <div class="field-value">${emissao.veiculos?.nome || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">Lastro</div>
          <div class="field-value">${emissao.lastros?.nome || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">Volume Total</div>
          <div class="field-value">${formatCurrency(emissao.volume)}</div>
        </div>
        <div class="field">
          <div class="field-label">Data de Criação</div>
          <div class="field-value">${formatDate(emissao.criado_em)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Dados da Empresa</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Razão Social</div>
          <div class="field-value">${emissao.empresa_razao_social || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">Nome Fantasia</div>
          <div class="field-value">${emissao.empresa_nome_fantasia || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">CNPJ</div>
          <div class="field-value">${emissao.empresa_cnpj || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">Destinatária</div>
          <div class="field-value">${emissao.empresa_destinataria || '-'}</div>
        </div>
      </div>
    </div>

    ${series && series.length > 0 ? `
    <div class="section">
      <div class="section-title">Séries</div>
      <table>
        <thead>
          <tr>
            <th>Série</th>
            <th>Valor</th>
            <th>% Volume</th>
            <th>Taxa de Juros</th>
            <th>Vencimento</th>
          </tr>
        </thead>
        <tbody>
          ${series.map(s => `
          <tr>
            <td>Série ${s.numero}</td>
            <td>${formatCurrency(s.valor_emissao)}</td>
            <td>${s.percentual_volume ? s.percentual_volume + '%' : '-'}</td>
            <td>${s.taxa_juros ? s.taxa_juros + '% a.a.' : '-'}</td>
            <td>${formatDate(s.data_vencimento)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${custos ? `
    <div class="section">
      <div class="section-title">Custos da Operação</div>
      ${custos.custos_linhas && custos.custos_linhas.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Prestador / Papel</th>
            <th>Upfront</th>
            <th>Recorrente</th>
            <th>Periodicidade</th>
          </tr>
        </thead>
        <tbody>
          ${custos.custos_linhas.map((l: any) => `
          <tr>
            <td>${l.papel}</td>
            <td>${formatCurrency(l.valor_upfront_bruto || l.preco_upfront)}</td>
            <td>${formatCurrency(l.valor_recorrente_bruto || l.preco_recorrente)}</td>
            <td>${l.periodicidade || '-'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}
      
      <div class="highlight">
        <div class="grid">
          <div>
            <div class="highlight-title">Total Upfront</div>
            <div class="highlight-value">${formatCurrency(custos.total_upfront)}</div>
          </div>
          <div>
            <div class="highlight-title">Total Primeiro Ano</div>
            <div class="highlight-value">${formatCurrency(custos.total_primeiro_ano)}</div>
          </div>
          <div>
            <div class="highlight-title">Total Mensal</div>
            <div class="highlight-value">${formatCurrency(custos.total_mensal)}</div>
          </div>
          <div>
            <div class="highlight-title">Total Anual (Anos Subsequentes)</div>
            <div class="highlight-value">${formatCurrency(custos.total_anos_subsequentes)}</div>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p>Documento gerado automaticamente em ${formatDate(new Date().toISOString())}</p>
      <p>Este documento é uma cotação e não representa compromisso de contratação.</p>
    </div>
  </div>
</body>
</html>
    `;

    console.log(`✅ [gerar-pdf] HTML gerado com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          html,
          emissao,
          series,
          custos,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [gerar-pdf] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
