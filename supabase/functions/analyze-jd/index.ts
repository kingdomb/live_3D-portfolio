import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { jobDescription } = await req.json()
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
      .eq('function_name', 'analyze-jd')
      .gt('created_at', yesterday);

    // LIMIT: 5 Analyses per day per IP
    if (count && count > 5) {
      throw new Error("Daily analysis limit reached (5/day). Please try again tomorrow.");
    }

    await supabaseClient.from('request_logs').insert({ ip_address: clientIP, function_name: 'analyze-jd' });
    // --- RATE LIMIT CHECK END ---

    // 1. Fetch ALL Context
    const { data: profile } = await supabaseClient.from('candidate_profile').select('*').single()
    const { data: skills } = await supabaseClient.from('skills').select('*')
    const { data: gaps } = await supabaseClient.from('gaps_weaknesses').select('*')
    const { data: experiences } = await supabaseClient.from('experiences').select('*')

    const candidateName = profile?.name || "The candidate";

    // 2. Map experiences to be readable for the AI
    const experienceText = experiences?.map(e => ({
        company: e.company_name,
        role: e.title,
        what_he_did: e.description,
        challenges: e.challenges_faced, 
        why_left: e.why_left
    }));

    // --- UPDATED PROMPT: STRATEGIC TALENT AGENT ---
    const systemPrompt = `
      You are a Strategic Talent Agent and Career Advocate for ${candidateName}.
      
      YOUR GOAL: Find the "Path to Yes". 
      - Most JDs are wishlists. If ${candidateName} meets 50-55% of the core requirements, or has strong TRANSFERABLE skills, consider him a "Strong Fit".
      - Do not be a literal keyword matcher. Look for underlying competency.
      
      EVALUATION LOGIC:
      1. TRANSFERABLE SKILLS: If the JD asks for a specific tool (e.g., "Databricks") but ${candidateName} has deep experience in a parallel technology (e.g., "PostgreSQL/Vector/Redis"), count this as a MATCH, noting he can ramp up quickly.
      2. SENIORITY: Recognize that "Release Management" and "Full Stack Architecture" are senior-level traits. If he has led pipelines or teams, credit him for Leadership.
      3. AI AGILITY: ${candidateName} uses AI to bridge syntax gaps (e.g., coding in Python/C# using models). Do not disqualify him for language syntax if he understands the architecture.

      CRITICAL INSTRUCTION: Speak about ${candidateName} in the THIRD PERSON (e.g. "${candidateName} brings...", "His experience in...").

      Analyze based on this data:
      Candidate Profile: ${profile?.elevator_pitch}
      Candidate Experience: ${JSON.stringify(experienceText)}
      Candidate Skills: ${JSON.stringify(skills)}
      Candidate Gaps: ${JSON.stringify(gaps)}
      
      Output JSON ONLY:
      {
        "verdict": "strong_fit" | "worth_conversation" | "probably_not",
        "headline": " persuasive headline focusing on his strengths",
        "opening": "Direct 1-2 sentence assessment highlighting his transferable value.",
        "gaps": [{ "requirement": "JD requirement", "gap_title": "Short title", "explanation": "Briefly mention the gap, but pivot to how he overcomes it (e.g., 'Lacks Databricks, but deep SQL/Vector expertise allows for fast ramp-up')." }],
        "transfers": "Highlight specifically which of his skills solve the JD's biggest problems.",
        "recommendation": "Strategic advice on how to pitch himself for this role."
      }
    `

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929', 
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Analyze this JD:\n\n${jobDescription}` }]
    })

    // Clean the response
    let rawText = response.content[0].text;
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(rawText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})