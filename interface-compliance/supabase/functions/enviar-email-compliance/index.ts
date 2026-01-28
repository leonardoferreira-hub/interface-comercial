import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface ComplianceItem {
  id: string;
  documento: string;
  tipo_documento: string;
  nome_entidade: string;
  tipo_entidade: string;
  status: string;
  operacao: {
    numero_emissao: string;
    nome_operacao: string;
    pmo: {
      nome: string;
      email: string;
    };
  };
}

interface EmailGroup {
  [email: string]: ComplianceItem[];
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar compliance pendentes agrupados por PMO
    const { data: pendentes, error } = await supabase
      .schema('estruturacao')
      .from('compliance_checks')
      .select(`
        *,
        operacao:operacoes(
          numero_emissao,
          nome_operacao,
          pmo:user_profiles(nome, email)
        )
      `)
      .eq('status', 'pendente');

    if (error) {
      throw error;
    }

    if (!pendentes || pendentes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum compliance pendente encontrado' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Agrupar por PMO
    const porPmo: EmailGroup = pendentes.reduce((acc: EmailGroup, item: ComplianceItem) => {
      const pmoEmail = item.operacao?.pmo?.email;
      if (pmoEmail) {
        if (!acc[pmoEmail]) acc[pmoEmail] = [];
        acc[pmoEmail].push(item);
      }
      return acc;
    }, {});

    // Enviar e-mails
    const envios = [];
    for (const [email, items] of Object.entries(porPmo)) {
      const pmoNome = items[0]?.operacao?.pmo?.nome || 'PMO';

      // Criar HTML da lista de compliance
      const listaHtml = items.map(item => `
        <li style="margin-bottom: 15px;">
          <strong>Operação:</strong> ${item.operacao.numero_emissao} - ${item.operacao.nome_operacao}<br>
          <strong>Documento:</strong> ${item.tipo_documento} ${item.documento}<br>
          <strong>Entidade:</strong> ${item.nome_entidade || 'Não informada'} (${item.tipo_entidade || 'N/A'})<br>
        </li>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin-top: 0;">Compliance Pendente - Ação Necessária</h2>
            <p>Olá <strong>${pmoNome}</strong>,</p>
            <p>Você tem <strong>${items.length}</strong> verificação(ões) de compliance pendente(s) que requerem sua atenção:</p>
          </div>

          <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
            <ul style="list-style-type: none; padding: 0;">
              ${listaHtml}
            </ul>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
            <p>Este é um e-mail automático da Plataforma de Gestão de Securitização.</p>
            <p>Por favor, não responda a este e-mail.</p>
          </div>
        </body>
        </html>
      `;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Estruturação <estruturacao@suasecuritizadora.com.br>',
          to: email,
          subject: `Compliance Pendente - ${items.length} verificação(ões) aguardando`,
          html: htmlContent
        })
      });

      const result = await response.json();
      envios.push({ email, status: response.status, result });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `E-mails enviados com sucesso`,
        envios: envios.length,
        detalhes: envios
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
