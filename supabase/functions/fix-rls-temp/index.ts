import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'public' }
    });

    // Executar SQL para corrigir RLS
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_text: `
        ALTER TABLE compliance.investidores DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON compliance.investidores TO anon, authenticated;
        GRANT ALL ON compliance.emissao_investidores TO anon, authenticated;
        GRANT USAGE ON SCHEMA compliance TO anon, authenticated;
      `
    });

    if (error) {
      // Tentar desabilitar RLS de outra forma
      const result = await supabase.from('investidores').select('count').limit(1);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          note: "RPC not available. Try running SQL directly in dashboard."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
