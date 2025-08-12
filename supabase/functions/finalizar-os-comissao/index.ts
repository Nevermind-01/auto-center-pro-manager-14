import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with the user's authorization
    const authHeader = req.headers.get('Authorization');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
        auth: {
          persistSession: false,
        },
      }
    );

    // Get request body as text first
    const bodyText = await req.text();
    console.log('📥 Request body received:', bodyText?.substring(0, 200) + '...');
    
    if (!bodyText) {
      console.error('❌ Request body is empty');
      return new Response(
        JSON.stringify({ 
          error: 'Request body é obrigatório',
          success: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse JSON from text
    let requestBody;
    try {
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      console.error('❌ Body recebido:', bodyText);
      return new Response(
        JSON.stringify({ 
          error: 'Payload JSON inválido: ' + parseError.message,
          success: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { payload } = requestBody;
    
    if (!payload) {
      console.error('❌ Payload não fornecido no request body:', requestBody);
      return new Response(
        JSON.stringify({ 
          error: 'Payload é obrigatório no request body',
          success: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🚀 Recebida solicitação para finalizar OS com comissão');

    // Verify authentication using the client
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Erro de autenticação:', userError?.message || 'User not found');
      return new Response(
        JSON.stringify({ 
          error: 'Usuário não autenticado',
          success: false 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Usuário autenticado:', user.id);
    console.log('📋 Chamando RPC finalizar_os_com_comissao');

    // Call the RPC function
    const { data, error } = await supabase.rpc('rpc_finalizar_os_com_comissao', { payload });

    if (error) {
      console.error('❌ Erro no RPC:', error.message);
      throw error;
    }

    console.log('✅ RPC executado com sucesso:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Erro na edge function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});