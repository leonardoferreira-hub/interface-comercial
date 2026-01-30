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

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Auth disabled for development
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { emissao_id, cnpj, razao_social, endereco, nome, email } = body;

    if (!emissao_id) {
      return new Response(
        JSON.stringify({ success: false, error: "emissao_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📄 [gerar-proposta-pdf] Gerando PDF para emissão: ${emissao_id}`);

    // Fetch emissao data
    const { data: emissao, error: emissaoError } = await supabase
      .from("emissoes")
      .select("*")
      .eq("id", emissao_id)
      .single();

    if (emissaoError || !emissao) {
      console.error("❌ Emissão não encontrada:", emissaoError);
      return new Response(
        JSON.stringify({ success: false, error: "Emissão não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch series
    const { data: series } = await supabase
      .from("series")
      .select("*")
      .eq("id_emissao", emissao_id)
      .order("numero");

    // Fetch custos
    const { data: custosEmissao } = await supabase
      .from("custos_emissao")
      .select("*, custos_linhas(*)")
      .eq("id_emissao", emissao_id)
      .single();

    // Helper functions
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value || 0);
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("pt-BR");
    };

    // Use provided data or fallback to emissao data
    const empresaCnpj = cnpj || emissao.empresa_cnpj || "";
    const empresaRazaoSocial = razao_social || emissao.empresa_razao_social || emissao.empresa_destinataria || "";
    const empresaEndereco = endereco || emissao.empresa_endereco || "";
    const contatoNome = nome || emissao.contato_nome || "";
    const contatoEmail = email || emissao.contato_email || "";

    // Build costs HTML
    let custosHtml = "";
    if (custosEmissao?.custos_linhas && custosEmissao.custos_linhas.length > 0) {
      const upfront: any[] = [];
      const recorrentes: any[] = [];

      custosEmissao.custos_linhas.forEach((linha: any) => {
        if (linha.preco_upfront > 0 || linha.valor_upfront_bruto > 0) {
          upfront.push({
            papel: linha.papel,
            valor: linha.valor_upfront_bruto || linha.preco_upfront,
          });
        }
        if (linha.preco_recorrente > 0 || linha.valor_recorrente_bruto > 0) {
          recorrentes.push({
            papel: linha.papel,
            valor: linha.valor_recorrente_bruto || linha.preco_recorrente,
            periodicidade: linha.periodicidade || "Anual",
          });
        }
      });

      if (upfront.length > 0) {
        const totalUpfront = upfront.reduce((sum, c) => sum + c.valor, 0);
        custosHtml += `
          <h3 style="margin-top: 30px; color: #1a1a2e;">Despesas Up Front (Flat)</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Prestador</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${upfront.map(c => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${c.papel}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formatCurrency(c.valor)}</td>
                </tr>
              `).join("")}
              <tr style="background: #f0f0f0; font-weight: bold;">
                <td style="padding: 10px; border: 1px solid #ddd;">TOTAL</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formatCurrency(totalUpfront)}</td>
              </tr>
            </tbody>
          </table>
        `;
      }

      if (recorrentes.length > 0) {
        const totalRecorrente = recorrentes.reduce((sum, c) => sum + c.valor, 0);
        custosHtml += `
          <h3 style="margin-top: 30px; color: #1a1a2e;">Despesas Recorrentes</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Prestador</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Periodicidade</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${recorrentes.map(c => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${c.papel}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${c.periodicidade}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formatCurrency(c.valor)}</td>
                </tr>
              `).join("")}
              <tr style="background: #f0f0f0; font-weight: bold;">
                <td style="padding: 10px; border: 1px solid #ddd;" colspan="2">TOTAL</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formatCurrency(totalRecorrente)}</td>
              </tr>
            </tbody>
          </table>
        `;
      }
    }

    // Build series HTML
    let seriesHtml = "";
    if (series && series.length > 0) {
      seriesHtml = `
        <h3 style="margin-top: 30px; color: #1a1a2e;">Séries da Emissão</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Série</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Volume</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Prazo (anos)</th>
            </tr>
          </thead>
          <tbody>
            ${series.map((s: any) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Série ${s.numero}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formatCurrency(s.valor_emissao)}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${s.prazo || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    // Generate HTML
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta - ${emissao.numero_emissao}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #1a1a2e;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1a1a2e;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 5px 0 0;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      color: #1a1a2e;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .field {
      margin-bottom: 10px;
    }
    .field-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    .field-value {
      font-weight: 600;
      color: #1a1a2e;
    }
    .summary {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .summary-row:last-child {
      border-bottom: none;
      font-weight: bold;
      font-size: 18px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Proposta Comercial</h1>
    <p>${emissao.numero_emissao} | Gerada em ${formatDate(new Date().toISOString())}</p>
  </div>

  ${empresaRazaoSocial ? `
  <div class="section">
    <h2 class="section-title">Destinatário</h2>
    <div class="field">
      <div class="field-label">Razão Social</div>
      <div class="field-value">${empresaRazaoSocial}</div>
    </div>
    ${empresaCnpj ? `
    <div class="field">
      <div class="field-label">CNPJ</div>
      <div class="field-value">${empresaCnpj}</div>
    </div>
    ` : ""}
    ${empresaEndereco ? `
    <div class="field">
      <div class="field-label">Endereço</div>
      <div class="field-value">${empresaEndereco}</div>
    </div>
    ` : ""}
    ${contatoNome ? `
    <div class="field">
      <div class="field-label">Contato</div>
      <div class="field-value">${contatoNome} ${contatoEmail ? `(${contatoEmail})` : ""}</div>
    </div>
    ` : ""}
  </div>
  ` : ""}

  <div class="section">
    <h2 class="section-title">Dados da Emissão</h2>
    <div class="grid">
      <div class="field">
        <div class="field-label">Demandante</div>
        <div class="field-value">${emissao.demandante_proposta || "-"}</div>
      </div>
      <div class="field">
        <div class="field-label">Categoria</div>
        <div class="field-value">${emissao.categoria || "-"}</div>
      </div>
      <div class="field">
        <div class="field-label">Tipo de Oferta</div>
        <div class="field-value">${emissao.tipo_oferta || emissao.oferta || "-"}</div>
      </div>
      <div class="field">
        <div class="field-label">Veículo</div>
        <div class="field-value">${emissao.veiculo || "-"}</div>
      </div>
      <div class="field">
        <div class="field-label">Volume Total</div>
        <div class="field-value">${formatCurrency(emissao.volume)}</div>
      </div>
      <div class="field">
        <div class="field-label">Quantidade de Séries</div>
        <div class="field-value">${series?.length || 0}</div>
      </div>
    </div>
  </div>

  ${seriesHtml}

  ${custosHtml}

  <div class="summary">
    <h3 style="margin-top: 0; color: #1a1a2e;">Resumo</h3>
    <div class="summary-row">
      <span>Volume da Emissão</span>
      <span>${formatCurrency(emissao.volume)}</span>
    </div>
    ${custosEmissao ? `
    <div class="summary-row">
      <span>Total Upfront</span>
      <span>${formatCurrency(custosEmissao.total_upfront || 0)}</span>
    </div>
    <div class="summary-row">
      <span>Total 1º Ano</span>
      <span>${formatCurrency(custosEmissao.total_primeiro_ano || 0)}</span>
    </div>
    ` : ""}
  </div>

  <div class="footer">
    <p>Esta proposta tem validade de 30 dias a partir da data de emissão.</p>
    <p>Documento gerado automaticamente pelo sistema Quote Maker Pro.</p>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #1a1a2e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
      Imprimir / Salvar PDF
    </button>
  </div>
</body>
</html>
    `.trim();

    console.log(`✅ [gerar-proposta-pdf] PDF gerado para: ${emissao.numero_emissao}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: { html },
        message: "PDF gerado com sucesso",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [gerar-proposta-pdf] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
