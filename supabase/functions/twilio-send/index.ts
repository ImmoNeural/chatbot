// ============================================
// EDGE FUNCTION: Enviar WhatsApp via Twilio
// ============================================
// Envia mensagens do WhatsApp usando a API do Twilio
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
    // Obter credenciais do Twilio das variáveis de ambiente
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER') // formato: whatsapp:+14155238886

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Credenciais do Twilio não configuradas')
    }

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

    // Parsear body da requisição
    const { to, message, lead_id } = await req.json()

    if (!to || !message) {
      throw new Error('Campos "to" e "message" são obrigatórios')
    }

    // Formatar número para WhatsApp (adicionar prefixo se não tiver)
    let toNumber = to.replace(/\D/g, '') // Remove não-dígitos
    if (!toNumber.startsWith('+')) {
      toNumber = '+' + toNumber
    }
    const whatsappTo = `whatsapp:${toNumber}`

    console.log(`📤 Enviando mensagem para ${whatsappTo}`)

    // Enviar mensagem via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`

    const formData = new URLSearchParams()
    formData.append('From', twilioPhoneNumber)
    formData.append('To', whatsappTo)
    formData.append('Body', message)

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('❌ Erro Twilio:', twilioData)
      throw new Error(twilioData.message || 'Erro ao enviar mensagem via Twilio')
    }

    console.log('✅ Mensagem enviada:', twilioData.sid)

    // Salvar mensagem enviada no banco de dados
    const { data: savedMessage, error: saveError } = await supabaseClient
      .from('mensagens_whatsapp')
      .insert({
        message_sid: twilioData.sid,
        lead_id: lead_id || null,
        telefone: toNumber,
        nome_perfil: 'Sistema CRM',
        mensagem: message,
        direcao: 'enviada',
        tipo: 'texto',
        status: twilioData.status,
        raw_data: twilioData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar mensagem:', saveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_sid: twilioData.sid,
        status: twilioData.status,
        to: toNumber,
        saved: !saveError
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Erro:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
