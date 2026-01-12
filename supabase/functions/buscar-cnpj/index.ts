import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const url = new URL(req.url);
    let cnpj = url.searchParams.get("cnpj");

    if (!cnpj) {
      // Try to get from body
      const body = await req.json().catch(() => ({}));
      cnpj = body.cnpj;
    }

    if (!cnpj) {
      return new Response(
        JSON.stringify({ success: false, error: "CNPJ é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean CNPJ - remove all non-numeric characters
    const cnpjLimpo = cnpj.replace(/\D/g, "");

    if (cnpjLimpo.length !== 14) {
      return new Response(
        JSON.stringify({ success: false, error: "CNPJ deve ter 14 dígitos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 [buscar-cnpj] Buscando CNPJ: ${cnpjLimpo}`);

    // Try BrasilAPI first
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
        headers: { "Accept": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Format CNPJ
        const cnpjFormatado = cnpjLimpo.replace(
          /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
          "$1.$2.$3/$4-$5"
        );

        // Format address
        const endereco = [
          data.logradouro,
          data.numero,
          data.complemento,
          data.bairro,
          `${data.municipio}/${data.uf}`,
          data.cep ? `CEP: ${data.cep}` : null,
        ]
          .filter(Boolean)
          .join(", ");

        console.log(`✅ [buscar-cnpj] Encontrado: ${data.razao_social}`);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              cnpj: cnpjFormatado,
              razao_social: data.razao_social,
              nome_fantasia: data.nome_fantasia || data.razao_social,
              endereco,
              logradouro: data.logradouro,
              numero: data.numero,
              complemento: data.complemento,
              bairro: data.bairro,
              cidade: data.municipio,
              estado: data.uf,
              cep: data.cep,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (apiError) {
      console.warn(`⚠️ [buscar-cnpj] Erro na BrasilAPI:`, apiError);
    }

    // If BrasilAPI fails, try ReceitaWS
    try {
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`, {
        headers: { "Accept": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.status === "ERROR") {
          throw new Error(data.message || "CNPJ não encontrado");
        }

        // Format CNPJ
        const cnpjFormatado = cnpjLimpo.replace(
          /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
          "$1.$2.$3/$4-$5"
        );

        // Format address
        const endereco = [
          data.logradouro,
          data.numero,
          data.complemento,
          data.bairro,
          `${data.municipio}/${data.uf}`,
          data.cep ? `CEP: ${data.cep}` : null,
        ]
          .filter(Boolean)
          .join(", ");

        console.log(`✅ [buscar-cnpj] Encontrado (ReceitaWS): ${data.nome}`);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              cnpj: cnpjFormatado,
              razao_social: data.nome,
              nome_fantasia: data.fantasia || data.nome,
              endereco,
              logradouro: data.logradouro,
              numero: data.numero,
              complemento: data.complemento,
              bairro: data.bairro,
              cidade: data.municipio,
              estado: data.uf,
              cep: data.cep,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (apiError) {
      console.warn(`⚠️ [buscar-cnpj] Erro na ReceitaWS:`, apiError);
    }

    // Both APIs failed - return 200 with success: false (not 404)
    console.log(`❌ [buscar-cnpj] CNPJ não encontrado: ${cnpjLimpo}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: "CNPJ não encontrado nas bases públicas. Preencha manualmente.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("💥 [buscar-cnpj] Exceção:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
