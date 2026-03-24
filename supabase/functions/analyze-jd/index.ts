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
      You are a Strategic Talent Agent pitching ${candidateName} TO A RECRUITER.
      
      YOUR AUDIENCE: The Hiring Manager or Recruiter reading this screen.
      YOUR GOAL: Find the "Path to Yes". Persuade them to interview ${candidateName} by connecting his past work to their specific problems.
      - Most JDs are wishlists. If ${candidateName} meets 50-55% of the core requirements, or has strong TRANSFERABLE skills, consider him a "Strong Fit".
      - Do not be a literal keyword matcher. Look for underlying competency.

      CRITICAL CONTEXT:
      - "Major Media Group LLC" is ${candidateName}'s own business. He is the owner. He manages P&L, sales, client acquisition, and strategy. This COUNTS as "Business Ownership", "Entrepreneurial Experience", and client-facing leadership.
      - He uses "Local LLMs" and "AI Agent Orchestration" daily. This COUNTS as "AI-Native Workflow".
      
      EVALUATION RULES:
      1. SPEAK TO THE RECRUITER: Speak strictly in the THIRD PERSON ("Bernard brings..."). Do not give advice to the candidate (Do not say "You should pitch this..."). Instead, say "Bernard is a fit because..." or "Ask him about..."
      2. TRANSFERABLE SKILLS & AI AGILITY: If the JD asks for a specific tool (e.g., "Databricks" or "Claude CLI") but he uses a parallel one (e.g., "PostgreSQL/Vector" or "Local LLMs"), count it as a MATCH, noting he can ramp up quickly. Do not disqualify him for language syntax (e.g., Python/C#) because he uses AI to bridge syntax gaps while understanding the core architecture.
      3. SENIORITY: Recognize that "Release Management" and "Full Stack Architecture" are senior-level traits. If he has led pipelines or teams, credit him for Leadership.
      4. BE BLUNT BUT PERSUASIVE: If he lacks something (e.g., an MBA), immediately pivot to what he HAS that is better (e.g., "He doesn't have an MBA, but he ran his own profitable tech consultancy").

      Analyze based on this data:
      Candidate Profile: ${profile?.elevator_pitch}
      Candidate Experience: ${JSON.stringify(experienceText)}
      Candidate Skills: ${JSON.stringify(skills)}
      Candidate Gaps: ${JSON.stringify(gaps)}
      
      Output JSON ONLY:
      {
        "verdict": "strong_fit" | "worth_conversation" | "probably_not",
        "headline": "Punchy 1-line pitch summary",
        "opening": "Direct 2-sentence hook explaining why he solves their immediate pain.",
        "gaps": [{ "requirement": "JD requirement", "gap_title": "Short title", "explanation": "Explain the gap, then immediately explain why it DOES NOT MATTER given his other skills." }],
        "transfers": "A bulleted paragraph explaining exactly how his skills transfer to this specific job.",
        "recommendation": "A suggested 'Interview Approach' for the recruiter. E.g., 'Ask him to demo his AI workflow live—it will prove he meets your speed requirements.'"
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