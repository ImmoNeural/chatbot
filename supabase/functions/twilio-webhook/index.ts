// ============================================
// EDGE FUNCTION: Twilio WhatsApp Webhook
// ============================================
// Recebe mensagens do WhatsApp via Twilio
// Salva no Supabase e pode responder automaticamente
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para parsear dados do formulário URL-encoded do Twilio
function parseFormData(body: string): Record<string, string> {
  const params = new URLSearchParams(body)
  const result: Record<string, string> = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

// Função para gerar resposta TwiML
function generateTwiML(message?: string): string {
  if (message) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`
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

    // Parsear dados do webhook do Twilio
    const body = await req.text()
    const twilioData = parseFormData(body)

    console.log('📱 Webhook Twilio recebido:', JSON.stringify(twilioData, null, 2))

    // Extrair informações da mensagem
    const messageSid = twilioData.MessageSid || ''
    const from = twilioData.From || '' // formato: whatsapp:+5511999999999
    const to = twilioData.To || ''
    const messageBody = twilioData.Body || ''
    const numMedia = parseInt(twilioData.NumMedia || '0')
    const profileName = twilioData.ProfileName || ''

    // Extrair número de telefone limpo (sem prefixo whatsapp:)
    const phoneNumber = from.replace('whatsapp:', '')

    // Buscar lead pelo telefone
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('id, nome, telefone')
      .or(`telefone.eq.${phoneNumber},telefone.eq.${phoneNumber.replace('+', '')}`)
      .single()

    if (leadError && leadError.code !== 'PGRST116') {
      console.error('Erro ao buscar lead:', leadError)
    }

    // Salvar mensagem recebida na tabela
    const { data: savedMessage, error: saveError } = await supabaseClient
      .from('mensagens_whatsapp')
      .insert({
        message_sid: messageSid,
        lead_id: lead?.id || null,
        telefone: phoneNumber,
        nome_perfil: profileName || lead?.nome || 'Desconhecido',
        mensagem: messageBody,
        direcao: 'recebida',
        tipo: numMedia > 0 ? 'midia' : 'texto',
        raw_data: twilioData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar mensagem:', saveError)
    } else {
      console.log('✅ Mensagem salva:', savedMessage)
    }

    // Resposta automática (opcional - pode ser personalizada)
    let autoReply = ''

    // Exemplo: responder se o lead não foi encontrado
    if (!lead) {
      // Não responde automaticamente para números desconhecidos
      // Você pode personalizar isso conforme necessário
      console.log('📝 Número não encontrado no sistema:', phoneNumber)
    }

    // Retornar TwiML (mesmo vazio, Twilio precisa de resposta válida)
    return new Response(
      generateTwiML(autoReply),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/xml'
        },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Erro no webhook:', error)

    // Mesmo em erro, retornar TwiML válido para o Twilio
    return new Response(
      generateTwiML(),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/xml'
        },
        status: 200, // Twilio prefere 200 mesmo em erros
      },
    )
  }
})
