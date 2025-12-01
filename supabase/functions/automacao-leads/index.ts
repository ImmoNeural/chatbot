// ============================================
// EDGE FUNCTION: Automação de Leads
// ============================================
// Executa diariamente via cron para:
// - Mover leads qualificados → Em Nutrição
// - Marcar leads sem resposta → Perdido
// - Marcar oportunidades inativas → Perdido
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🤖 Iniciando automação de leads...')

    // Executar a função SQL de automação
    const { data, error } = await supabaseClient.rpc('executar_automacao_leads')

    if (error) {
      console.error('❌ Erro ao executar automação:', error)
      throw error
    }

    console.log('✅ Automação executada com sucesso:', data)

    // Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automação executada com sucesso',
        resultado: data,
        executado_em: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        executado_em: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
