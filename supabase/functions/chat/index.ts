import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"

// FIX: Define headers here instead of importing them
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { message, history } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- RATE LIMIT CHECK START ---
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count } = await supabaseClient
      .from('request_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIP)
      .eq('function_name', 'chat')
      .gt('created_at', yesterday);

    // LIMIT: 20 Chats per day per IP
    if (count && count > 20) {
      return new Response(JSON.stringify({ reply: "You have reached the daily chat limit. Please try again tomorrow!" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await supabaseClient.from('request_logs').insert({ ip_address: clientIP, function_name: 'chat' });
    // --- RATE LIMIT CHECK END ---

    // 1. Fetch Context
    const { data: profile } = await supabaseClient.from('candidate_profile').select('*').single()
    const { data: experiences } = await supabaseClient.from('experiences').select('*')
    const { data: skills } = await supabaseClient.from('skills').select('*')

    const candidateName = profile?.name || "Bernard";

    // 2. Build Prompt (Third Person Perspective)
    const systemPrompt = `
      You are an AI assistant for a Recruiter. You are answering questions about a candidate named ${candidateName}.
      
      CRITICAL RULE: Speak in the THIRD PERSON. Refer to him as "${candidateName}" or "he". 
      NEVER use "I", "me", or "my". You are NOT the candidate.
      
      Here is ${candidateName}'s background data:
      - Bio: ${profile?.elevator_pitch}
      - Experience: ${JSON.stringify(experiences.map(e => ({
          company: e.company_name,
          role: e.title,
          duties: e.description,        
          challenges: e.challenges_faced, 
          why_left: e.why_left          
      })))} 
      - Skills: ${JSON.stringify(skills)}

      Tone: Professional, honest, and direct, pleasant, and positive. If the answer isn't in the data, say "${candidateName}'s records don't mention that."
    `

    // 3. Call Claude (Using the working model ID)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...(history || []), // Handle empty history safely
        { role: 'user', content: message }
      ]
    })

    return new Response(JSON.stringify({ reply: response.content[0].text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})