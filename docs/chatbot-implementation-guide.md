# AI Chatbot Implementation Guide

A complete implementation guide for adding a floating AI chatbot to any service site using Supabase Edge Functions, the Anthropic Claude API, and React. Based on the production implementation in this portfolio repo.

---

## Architecture Overview

```
User Browser (React)
    └── ChatInterface.jsx
            └── supabase.functions.invoke('chat')
                    └── Supabase Edge Function (Deno)
                            ├── Rate limit check       → request_logs
                            ├── Fetch all context      → Promise.all([
                            │       candidate_profile, experiences, skills,
                            │       gaps_weaknesses, values_culture,
                            │       faq_responses, ai_instructions ])
                            ├── buildSystemPrompt()
                            └── Claude API → return reply
```

**Key insight:** The AI IS the product. Everything else is UI to invoke it. The quality of your answers depends entirely on the depth of context you put in the database — not the code.

---

## 1. Required Packages

```bash
npm install @supabase/supabase-js framer-motion react-markdown
```

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client — invokes Edge Functions and handles auth |
| `framer-motion` | Smooth open/close animation for the chat window |
| `react-markdown` | Renders the AI's markdown-formatted replies properly |

---

## 2. Supabase Project Setup

### 2a. Create a Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Name it (e.g., `my-portfolio` or `yourname-site`)
3. Create a strong database password and **save it somewhere**
4. Choose a region close to you
5. Wait 1-2 minutes for it to initialize

### 2b. Get Your Credentials

In your Supabase project: **Settings (gear icon) → API**

Save these three values:

| Key | Where used |
|---|---|
| **Project URL** | Frontend `.env` and GitHub Secrets |
| **anon public key** | Frontend `.env` and GitHub Secrets |
| **service role key** | Edge Function only — never in the browser |

### 2c. Disable Email Confirmation (for easier testing)

1. Supabase Dashboard → **Authentication → Providers**
2. Click **Email**
3. Turn **OFF** "Confirm email"
4. Click **Save**

This means you won't need to verify email when creating your admin account.

### 2d. Environment Variables

Create a `.env` file at your project root (add to `.gitignore`):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2e. Supabase Client

`src/lib/supabaseClient.js`:

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 3. Database Schema

Run the following SQL in your Supabase SQL editor (**Dashboard → SQL Editor**). All tables use `uuid` primary keys and reference a central profile row.

---

### Table 1: `candidate_profile`

The primary identity and context for the AI. One row per deployment.

```sql
create table candidate_profile (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  title text,
  target_titles text[],
  target_company_stages text[],
  elevator_pitch text,
  career_narrative text,
  looking_for text,
  not_looking_for text,
  management_style text,
  work_style text,
  salary_min integer,
  salary_max integer,
  availability_status text,
  availability_date date,
  location text,
  remote_preference text,
  github_url text,
  linkedin_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

**What to put here:**
- `elevator_pitch`: 2-3 sentences — how you'd introduce yourself
- `career_narrative`: Your full story. How you got here, what drives you. Write 2-3 paragraphs. This is the AI's backbone.
- `looking_for` / `not_looking_for`: Be specific. The AI will use these to qualify or disqualify opportunities honestly.
- `target_titles` / `target_company_stages`: Arrays help the AI give precise answers about role fit.

---

### Table 2: `experiences`

One row per job. Split into public data (what visitors see) and private AI context (what powers honest answers).

```sql
create table experiences (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidate_profile(id),

  -- Public (visible on site)
  company_name text not null,
  title text not null,
  title_progression text,
  start_date date,
  end_date date,
  is_current boolean default false,
  bullet_points text[],

  -- Private (AI context only — the honest stuff)
  why_joined text,
  why_left text,
  actual_contributions text,
  proudest_achievement text,
  would_do_differently text,
  challenges_faced text,
  lessons_learned text,
  manager_would_say text,
  reports_would_say text,
  quantified_impact jsonb,

  display_order integer,
  created_at timestamp default now()
);
```

**What to put in the private fields:**
- `why_joined` / `why_left`: Be honest. "The team was toxic" or "I was laid off" is fine — the AI handles honesty better than hedging.
- `actual_contributions`: What did YOU specifically do vs. the team?
- `manager_would_say`: How would your manager actually describe your performance?
- `challenges_faced`: What was genuinely hard or where did you fall short?
- `quantified_impact`: JSON with real numbers — `{"revenue": "$2M", "team_size": 5, "uptime_improvement": "40%"}`

> The private fields are never directly readable by visitors. Only the Edge Function (service role) can access them to build the AI's context.

---

### Table 3: `skills`

Honest self-assessment by category.

```sql
create table skills (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidate_profile(id),
  skill_name text not null,
  category text,           -- 'strong', 'moderate', or 'gap'
  self_rating integer,     -- 1-5
  evidence text,           -- Projects, years, certifications
  honest_notes text,       -- e.g. "Good but rusty, haven't used in 2 years"
  years_experience decimal,
  last_used date,
  created_at timestamp default now()
);
```

**What to put here:** Be ruthlessly honest about `category`. If it goes in "gap" it makes the AI valuable. Things that are genuinely weak, rarely used, or only theoretical belong in gap — not moderate.

---

### Table 4: `gaps_weaknesses`

Explicit weaknesses. **This table is critical.** The AI can only be honest about gaps it knows about.

```sql
create table gaps_weaknesses (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidate_profile(id),
  gap_type text,             -- 'skill', 'experience', 'environment', 'role_type'
  description text not null,
  why_its_a_gap text,
  interest_in_learning boolean default false,
  created_at timestamp default now()
);
```

**What to put here:**
- Known skill gaps ("No Java experience")
- Types of roles that would be bad fits ("Pure management with no IC work")
- Work environments you'd struggle in ("No-process startup chaos")
- Honest weaknesses ("I struggle in highly ambiguous environments with no structure")

---

### Table 5: `values_culture`

What you need to thrive and what would make you miserable. The AI uses this to assess cultural fit.

```sql
create table values_culture (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidate_profile(id),
  must_haves text,
  dealbreakers text,
  management_style_preferences text,
  team_size_preferences text,
  how_handle_conflict text,
  how_handle_ambiguity text,
  how_handle_failure text,
  created_at timestamp default now()
);
```

**What to put here:** Write these as you'd answer them in an interview. "I need a manager who gives feedback directly and doesn't micromanage. I thrive in teams of 3-8 engineers. I struggle when there's no clear ownership."

---

### Table 6: `faq_responses`

Pre-written answers to common questions. The AI uses these verbatim when relevant, ensuring consistency on important topics.

```sql
create table faq_responses (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidate_profile(id),
  question text not null,
  answer text not null,
  is_common_question boolean default false,
  created_at timestamp default now()
);
```

**Suggested starter questions to pre-answer:**
- "Tell me about yourself"
- "What's your biggest weakness?"
- "Why are you leaving your current role?"
- "Where do you see yourself in 5 years?"
- "Tell me about a time you failed"

Write honest answers. These go directly into the AI's context.

---

### Table 7: `ai_instructions`

Custom behavioral rules you write for the AI. Loaded dynamically — change the behavior without redeploying.

```sql
create table ai_instructions (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references candidate_profile(id),
  instruction_type text,   -- 'honesty', 'tone', 'boundaries'
  instruction text not null,
  priority integer default 0,
  created_at timestamp default now()
);
```

**Example instructions to add:**
- "Never oversell me"
- "If the role requires X and I don't have it, say so directly"
- "Use phrases like 'I'm probably not your person' when appropriate"
- "Don't hedge — be direct"
- "It's okay to recommend they not hire me"
- "If there are 3+ major gaps, tell them honestly that I'm not a fit"

---

### Table 8: `request_logs`

Used by the Edge Function to enforce per-IP rate limits. Required.

```sql
create table request_logs (
  id uuid primary key default uuid_generate_v4(),
  ip_address text,
  function_name text,
  created_at timestamp default now()
);
```

---

### `keep_alive` Function

Required for the keep-alive workflow:

```sql
create or replace function keep_alive()
returns void as $$ begin end; $$ language plpgsql security definer;
```

---

## 4. Row Level Security (RLS)

Enable RLS on all tables, then create public views that expose only non-sensitive fields. The Edge Function uses the service role key (bypasses RLS) to read private context, while anonymous visitors can only read sanitized data.

```sql
-- Enable RLS on all tables
alter table candidate_profile enable row level security;
alter table experiences enable row level security;
alter table skills enable row level security;
alter table gaps_weaknesses enable row level security;
alter table values_culture enable row level security;
alter table faq_responses enable row level security;
alter table ai_instructions enable row level security;
alter table request_logs enable row level security;

-- Public view: profile without salary, email, or private notes
create view candidate_profile_public as
  select id, name, title, target_titles, elevator_pitch, career_narrative,
         looking_for, location, remote_preference, linkedin_url, github_url
  from candidate_profile;

-- Public view: experiences without private AI context
create view experiences_public as
  select id, candidate_id, company_name, title, title_progression,
         start_date, end_date, is_current, bullet_points, display_order
  from experiences;

-- Public view: skills without honest_notes and evidence
create view skills_public as
  select id, candidate_id, skill_name, category, self_rating
  from skills;

-- Anonymous users can read public views only
create policy "Public can read profile" on candidate_profile
  for select using (true);

-- Authenticated admin has full access
create policy "Admin full access" on candidate_profile
  for all using (auth.role() = 'authenticated');
```

> The private fields (`why_left`, `challenges_faced`, `honest_notes`, etc.) are never directly readable by visitors. The Edge Function reads them server-side using the service role key to build the AI's context.

---

## 5. Edge Function

### 5a. Set Secrets

Supabase Dashboard → **Project Settings → Edge Functions → Secrets → Add Secret**:

| Secret Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) |

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do not set them manually.

### 5b. Deploy

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy chat
```

### 5c. Edge Function Code

`supabase/functions/chat/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { message, history } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Rate limit: 20 messages per IP per day
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('request_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIP)
      .eq('function_name', 'chat')
      .gt('created_at', yesterday)

    if (count && count > 20) {
      return new Response(
        JSON.stringify({ reply: "You've reached the daily chat limit. Please try again tomorrow!" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    await supabase.from('request_logs').insert({ ip_address: clientIP, function_name: 'chat' })

    // Fetch all context in parallel
    const [
      { data: profile },
      { data: experiences },
      { data: skills },
      { data: gaps },
      { data: values },
      { data: faqs },
      { data: instructions }
    ] = await Promise.all([
      supabase.from('candidate_profile').select('*').single(),
      supabase.from('experiences').select('*').order('display_order'),
      supabase.from('skills').select('*'),
      supabase.from('gaps_weaknesses').select('*'),
      supabase.from('values_culture').select('*').single(),
      supabase.from('faq_responses').select('*'),
      supabase.from('ai_instructions').select('*').order('priority', { ascending: false })
    ])

    const systemPrompt = buildSystemPrompt(profile, experiences, skills, gaps, values, faqs, instructions)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...(history || []),
        { role: 'user', content: message }
      ]
    })

    return new Response(
      JSON.stringify({ reply: response.content[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildSystemPrompt(profile, experiences, skills, gaps, values, faqs, instructions) {
  return `
You are an AI assistant representing ${profile?.name}, a ${profile?.title}.
You speak in the THIRD PERSON. Refer to ${profile?.name} as "${profile?.name}" or "he/she/they".
NEVER use "I", "me", or "my". You are NOT the candidate — you are their AI agent.

## YOUR CORE DIRECTIVE
${instructions?.map(i => `- ${i.instruction}`).join('\n') || '- Be honest and direct'}

You must be BRUTALLY HONEST. Your job is NOT to sell ${profile?.name} to everyone.
Your job is to help people quickly determine if there's a genuine fit. This means:
- If they ask about something ${profile?.name} can't do, SAY SO DIRECTLY
- Never hedge or use weasel words
- It's perfectly acceptable to say "${profile?.name} is probably not the right person for this"
- Honesty builds trust. Overselling wastes everyone's time.

## ABOUT ${profile?.name}
${profile?.elevator_pitch}
${profile?.career_narrative}

What ${profile?.name} is looking for: ${profile?.looking_for}
What ${profile?.name} is NOT looking for: ${profile?.not_looking_for}

## WORK EXPERIENCE
${experiences?.map(exp => `
### ${exp.company_name} (${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date})
Title: ${exp.title}${exp.title_progression ? ` | Progression: ${exp.title_progression}` : ''}
Public achievements: ${exp.bullet_points?.map(b => `- ${b}`).join('\n') || 'N/A'}
PRIVATE CONTEXT (use this to answer honestly):
- Why joined: ${exp.why_joined}
- Why left: ${exp.why_left}
- What ${profile?.name} actually did: ${exp.actual_contributions}
- Proudest of: ${exp.proudest_achievement}
- Would do differently: ${exp.would_do_differently}
- Challenges: ${exp.challenges_faced}
- Lessons learned: ${exp.lessons_learned}
- Manager would say: ${exp.manager_would_say}
`).join('\n---\n')}

## SKILLS SELF-ASSESSMENT
### Strong
${skills?.filter(s => s.category === 'strong').map(s => `- ${s.skill_name}: ${s.honest_notes || s.evidence}`).join('\n')}

### Moderate
${skills?.filter(s => s.category === 'moderate').map(s => `- ${s.skill_name}: ${s.honest_notes || s.evidence}`).join('\n')}

### Gaps (BE UPFRONT ABOUT THESE)
${skills?.filter(s => s.category === 'gap').map(s => `- ${s.skill_name}: ${s.honest_notes}`).join('\n')}

## EXPLICIT GAPS & WEAKNESSES
${gaps?.map(g => `- ${g.description}: ${g.why_its_a_gap}${g.interest_in_learning ? ' (actively improving)' : ' (not interested in developing this)'}`).join('\n')}

## VALUES & CULTURE FIT
Must-haves: ${values?.must_haves}
Dealbreakers: ${values?.dealbreakers}
Management style needed: ${values?.management_style_preferences}
Team size preference: ${values?.team_size_preferences}
Handles conflict by: ${values?.how_handle_conflict}
Handles ambiguity by: ${values?.how_handle_ambiguity}

## PRE-WRITTEN ANSWERS TO COMMON QUESTIONS
${faqs?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}

## RESPONSE GUIDELINES
- Speak in third person as ${profile?.name}'s agent
- Be warm but direct
- Keep responses concise unless detail is asked for
- If you don't know something specific, say "${profile?.name}'s records don't mention that"
- When discussing gaps, own them confidently — they're features, not bugs
- If someone asks about a role that's clearly not a fit, tell them directly and explain why
  `.trim()
}
```

---

## 6. Chat Interface Component

### Positioning

- **Trigger button**: `fixed bottom-24 right-6 z-50` — sits above a bottom nav if present; change to `bottom-6` if no bottom nav
- **Chat window**: `fixed bottom-6 right-6 z-50` — anchored bottom-right corner
- **Width**: `w-full max-w-[380px]` — full width on mobile, capped at 380px on larger screens
- **Height**: `h-[500px]` — fixed with internal scroll

### Component

`src/components/ChatInterface.jsx`:

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_QUESTIONS = [
  "What's your biggest weakness?",
  "Tell me about a project that failed",
  "Why did you leave your last role?",
  "What would your last manager say about you?",
];

export default function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm an AI agent. Ask me anything — including the tough questions.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (messageText) => {
    const text = messageText || input;
    if (!text.trim()) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 z-50 p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all ${
          isOpen ? 'hidden' : 'bg-teal-500 text-black'
        }`}
      >
        <span className="text-2xl">🤖</span>
        <span className="font-bold hidden md:inline">Ask AI</span>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-[380px] h-[500px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h3 className="text-white font-bold">AI Agent</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-teal-600 text-white rounded-br-none'
                        : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                    }`}
                  >
                    <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                      <ReactMarkdown
                        components={{
                          strong: ({ node, ...props }) => (
                            <span className="text-teal-400 font-bold" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc pl-4 space-y-1 my-2" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="mb-2 last:mb-0" {...props} />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pre-seeded suggested questions — shown only on first open */}
              {showSuggestions && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-gray-500 text-center">Try asking:</p>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="w-full text-left text-xs text-gray-300 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2 hover:bg-gray-700 hover:border-teal-500 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-700">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-gray-800 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-teal-500 text-black p-2 rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ➤
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

### Adding to Your App

```jsx
// App.jsx or root layout
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <>
      {/* your routes/pages */}
      <ChatInterface />
    </>
  );
}
```

---

## 7. Making the AI Actually Honest

The hardest part isn't the tech — it's getting the AI to NOT be sycophantic. By default, Claude wants to be helpful and agreeable. You have to explicitly override this.

**Five techniques that work:**

1. **Explicit anti-sycophancy in system prompt** — "Never oversell. It's okay to say I'm not the right person."
2. **Give it permission to reject** — "If there are 3+ major gaps, recommend they not hire me."
3. **Provide the gaps explicitly** — The AI can only be honest about gaps it knows about. Document your weaknesses thoroughly in `gaps_weaknesses`.
4. **Test with bad-fit scenarios** — Ask it questions where the honest answer is "no" and verify it says no.
5. **Use `ai_instructions` table** — Write rules like "Don't hedge — be direct" and load them dynamically.

**Example of correct honesty vs. sycophancy:**

```
Question: "We need someone with 5+ years of mobile development"

GOOD response: "[Name] doesn't have mobile development experience.
Their background is entirely backend and infrastructure. You probably
want someone who can hit the ground running — they're not your person
for this role."

BAD response: "While [Name] hasn't done mobile specifically, their
strong engineering fundamentals would allow them to pick it up quickly..."
```

The bad response hedges. The good response qualifies the lead and respects everyone's time.

---

## 8. Keep-Alive: GitHub Actions Workflow

Supabase free tier pauses projects after **7 days of no database activity**. This workflow runs every 5 days using real database requests (not just a health check ping, which doesn't count as activity).

`.github/workflows/keep_alive.yml`:

```yaml
name: Supabase Keep Alive

on:
  schedule:
    - cron: '0 0 */5 * *'
  workflow_dispatch:

jobs:
  ping_supabase:
    runs-on: ubuntu-latest
    steps:
      - name: Ping PostgREST schema endpoint
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            "${{ secrets.SUPABASE_URL }}/rest/v1/" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}")
          echo "PostgREST schema endpoint status: $STATUS"

      - name: Call keep_alive RPC function
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
            "${{ secrets.SUPABASE_URL }}/rest/v1/rpc/keep_alive" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}')
          echo "RPC keep_alive status: $STATUS"

      - name: Query a live table
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            "${{ secrets.SUPABASE_URL }}/rest/v1/candidate_profile?limit=1" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}")
          echo "Table query status: $STATUS"
```

**Add secrets in GitHub:** Repository → Settings → Secrets and variables → Actions

| Secret | Value |
|---|---|
| `SUPABASE_URL` | Your project URL |
| `SUPABASE_ANON_KEY` | Your anon public key |

---

## 9. Keep-Alive: Local Push Timer

GitHub disables scheduled workflows on repos with **no push activity for 60 days**. This local systemd timer pushes a small commit every 30 days to prevent that.

### The Script

`~/.local/bin/repo-keep-alive.sh`:

```bash
#!/bin/bash

REPO="/path/to/your/repo"           # Update this
FILE="$REPO/keep_alive_count.txt"
LOG="$HOME/.local/share/repo-keep-alive.log"

exec >> "$LOG" 2>&1
echo "[$(date)] Starting keep-alive push"

LAST=$(tail -1 "$FILE" 2>/dev/null)
COUNT=$(( ${LAST:-0} + 1 ))
echo "$COUNT" >> "$FILE"

cd "$REPO"
git add keep_alive_count.txt
git commit -m "ci: keep-alive push #$COUNT"
git push origin main

echo "[$(date)] Done (push #$COUNT)"
```

```bash
chmod +x ~/.local/bin/repo-keep-alive.sh
```

### The Systemd Service

`~/.config/systemd/user/repo-keep-alive.service`:

```ini
[Unit]
Description=Push keep-alive commit to repo

[Service]
Type=oneshot
Environment="GIT_SSH_COMMAND=ssh -i /home/YOUR_USER/.ssh/id_ed25519 -o BatchMode=yes -o StrictHostKeyChecking=accept-new"
ExecStart=/home/YOUR_USER/.local/bin/repo-keep-alive.sh
```

### The Systemd Timer

`~/.config/systemd/user/repo-keep-alive.timer`:

```ini
[Unit]
Description=Run repo keep-alive every 30 days

[Timer]
OnUnitInactiveSec=30d
Persistent=true

[Install]
WantedBy=timers.target
```

`Persistent=true` means if the laptop was off when the timer should have fired, it runs immediately on next boot/wake.

### Enable It

```bash
systemctl --user daemon-reload
systemctl --user enable --now repo-keep-alive.timer

# Verify
systemctl --user status repo-keep-alive.timer

# Test manually
systemctl --user start repo-keep-alive.service

# View logs
cat ~/.local/share/repo-keep-alive.log
```

### Track the File in Git

If `*.txt` is in `.gitignore`, add an exception:

```
*.txt
!keep_alive_count.txt
```

Commit an empty `keep_alive_count.txt` initially so git tracks the file.

---

## 10. Complete Checklist

### Supabase Setup
- [ ] Create Supabase project
- [ ] Disable email confirmation (Authentication → Providers → Email)
- [ ] Run all 8 table SQL scripts in SQL Editor
- [ ] Create `keep_alive()` SQL function
- [ ] Enable RLS on all tables
- [ ] Create public views (`candidate_profile_public`, `experiences_public`, `skills_public`)
- [ ] Add `ANTHROPIC_API_KEY` to Edge Functions → Secrets

### Frontend Setup
- [ ] Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Install packages: `@supabase/supabase-js framer-motion react-markdown`
- [ ] Create `src/lib/supabaseClient.js`
- [ ] Add `ChatInterface.jsx` to root of app
- [ ] Customize suggested questions and opening message for your use case

### Edge Function
- [ ] Deploy with `supabase functions deploy chat`
- [ ] Test: open chat, ask a question, verify response

### GitHub Actions
- [ ] Commit and push `.github/workflows/keep_alive.yml`
- [ ] Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to GitHub Secrets
- [ ] Run workflow manually to verify all three steps return expected status codes

### Local Keep-Alive Timer
- [ ] Create `~/.local/bin/repo-keep-alive.sh` (update `REPO` path)
- [ ] Create service and timer files in `~/.config/systemd/user/`
- [ ] `chmod +x` the script
- [ ] `systemctl --user enable --now repo-keep-alive.timer`
- [ ] Test manually with `systemctl --user start repo-keep-alive.service`
- [ ] Verify `keep_alive_count.txt` is committed and in git

### Content Population (in your Admin Panel)
- [ ] Fill out `candidate_profile` — especially `career_narrative` and `elevator_pitch`
- [ ] Add all experiences with **deep private context** — don't skip the `why_joined`/`why_left`/`challenges_faced` fields
- [ ] Rate every skill honestly — put genuinely weak skills in `gap`, not `moderate`
- [ ] Fill `gaps_weaknesses` — the AI can only be honest about gaps it knows about
- [ ] Fill `values_culture` — what you need to thrive, what would make you miserable
- [ ] Pre-answer common questions in `faq_responses`
- [ ] Add anti-sycophancy rules to `ai_instructions`
- [ ] Test with questions where the honest answer is "no" and verify the AI says no
