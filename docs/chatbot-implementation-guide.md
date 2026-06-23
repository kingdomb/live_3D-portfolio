# AI Chatbot Implementation Guide

A complete implementation guide for adding a floating AI chatbot to any service site using Supabase Edge Functions, the Anthropic Claude API, and React. Works for any business type — law firm, plumber, cleaning service, portfolio, agency, etc.

The table names and content change per business. The architecture, code, and deployment process are identical for all of them.

---

## Architecture Overview

```
User Browser (React)
    └── ChatInterface.jsx
            └── supabase.functions.invoke('chat')
                    └── Supabase Edge Function (Deno)
                            ├── Rate limit check       → request_logs
                            ├── Fetch all context      → Promise.all([
                            │       business_profile, services, capabilities,
                            │       limitations, client_fit, testimonials,
                            │       faq_responses, ai_instructions ])
                            ├── buildSystemPrompt()
                            └── Claude API → return reply
```

**Key insight:** The AI IS the product. Everything else is UI to invoke it. The quality of answers depends entirely on the depth of context in the database — not the code.

---

## Adapting for Your Industry

Before touching any code, decide what your tables will be called and what goes in them. The table names in this guide are **generic**. Rename them to match your business.

| Generic Table | Portfolio Site | Law Firm | Plumber | Cleaning Service |
|---|---|---|---|---|
| `business_profile` | `candidate_profile` | `firm_profile` | `business_profile` | `business_profile` |
| `services` | `experiences` | `practice_areas` | `services` | `service_packages` |
| `capabilities` | `skills` | `case_types` | `specialties` | `capabilities` |
| `limitations` | `gaps_weaknesses` | `referral_types` | `out_of_scope` | `exclusions` |
| `client_fit` | `values_culture` | `ideal_client` | `service_area` | `client_fit` |
| `testimonials` | `testimonials` | `case_results` | `testimonials` | `testimonials` |
| `faq_responses` | `faq_responses` | `faq_responses` | `faq_responses` | `faq_responses` |
| `ai_instructions` | `ai_instructions` | `ai_instructions` | `ai_instructions` | `ai_instructions` |
| `request_logs` | `request_logs` | `request_logs` | `request_logs` | `request_logs` |

---

## What Goes in Each Table — By Industry

### `business_profile` (one row, the AI's core identity)

| Field | Portfolio | Law Firm | Plumber | Cleaning Service |
|---|---|---|---|---|
| Name | Candidate name | Firm name | Business name | Business name |
| Title/Tagline | Job title | Practice focus | "Licensed & Insured" | "Residential & Commercial" |
| Main pitch | Career summary | What types of clients you help | What you fix / service area | What you clean / how it works |
| What you want | Target roles | Ideal case types | Preferred job types | Preferred clients |
| What you avoid | Roles that don't fit | Cases you decline | Jobs you refer out | Situations you don't handle |
| Contact | LinkedIn | Consultation booking link | Phone / emergency line | Booking link |

---

### `services` (one row per offering)

| Field | Portfolio | Law Firm | Plumber | Cleaning Service |
|---|---|---|---|---|
| Name | Company / role | Practice area | Service type | Package name |
| Description | What you did | What cases you handle | What the service includes | What's included |
| Timeline | Employment dates | Typical case duration | How long jobs take | Frequency / visit duration |
| Price range | N/A | Fee structure | Typical cost range | Pricing |
| Best for | N/A | Who this practice area helps | Job type / home size | Client type |
| Private context | Why joined/left, honest challenges | Case win/loss rates, complexity notes | Common problems found, gotchas | Notes on difficult properties |

---

### `capabilities` (skills / strengths)

| Field | All business types |
|---|---|
| Name | Skill or capability name |
| Category | `strong` / `moderate` / `gap` |
| Notes | Honest assessment — "Good but only residential, not commercial" |

---

### `limitations` (what you DON'T do — critical for honest AI)

This table makes the AI valuable. The AI can only be honest about limitations it knows about. Be explicit.

| Examples by type | |
|---|---|
| **Portfolio** | "No mobile development experience", "Don't want management-only roles" |
| **Law firm** | "We don't handle criminal cases", "No contingency for contract disputes" |
| **Plumber** | "We don't service commercial buildings", "No new construction plumbing" |
| **Cleaning** | "We don't do biohazard cleanup", "No homes with more than 4 pets" |

---

### `client_fit` (who is ideal, what environment works best)

| Examples by type | |
|---|---|
| **Portfolio** | Remote-first teams, startup to Series C, engineering-led culture |
| **Law firm** | Personal injury clients with clear liability, not complex corporate disputes |
| **Plumber** | Residential homeowners in [zip codes], existing customers get priority |
| **Cleaning** | Airbnb hosts needing turnover cleans, recurring residential clients |

---

### `testimonials` (social proof the AI can cite)

The AI uses these when visitors ask "are you any good?", "do you have references?", or "can you share examples of your work?" This table is critical for service businesses where trust is the main buying factor.

| Field | All business types |
|---|---|
| `client_name` | First name or "A client in [City]" for privacy |
| `result_summary` | One sentence: what outcome did you deliver? |
| `quote` | Their exact words or a paraphrase |
| `service_type` | Which service this relates to |

| Examples by type | |
|---|---|
| **Portfolio** | "Hired within 2 weeks of launch", "Recruiter said most prepared candidate they'd seen" |
| **Law firm** | "Settled for $340K after initial offer of $40K", "Case dismissed after 3 months" |
| **Plumber** | "Fixed emergency leak same day, saved hardwood floors", "Saved $3K vs. competitor quote" |
| **Cleaning** | "5-star Airbnb reviews every week since starting service", "Never missed a turnover in 8 months" |

---

### `faq_responses` (pre-written answers to common questions)

Pre-answer the questions you get asked most. The AI uses these verbatim.

| Examples by type | |
|---|---|
| **Portfolio** | "What's your biggest weakness?", "Why did you leave your last role?" |
| **Law firm** | "Do you offer free consultations?", "How do you charge?" |
| **Plumber** | "Do you do emergency calls?", "Are you licensed and insured?" |
| **Cleaning** | "Do you bring your own supplies?", "Are your cleaners background checked?" |

---

### `ai_instructions` (custom behavioral rules)

Write instructions that control how the AI handles edge cases. Loaded dynamically — change them without redeploying.

| Examples by type | |
|---|---|
| **Portfolio** | "If there are 3+ major gaps, recommend they move on", "Don't hedge — be direct" |
| **Law firm** | "Never give specific legal advice — direct to consultation", "Always mention free initial consultation" |
| **Plumber** | "Always mention we offer free estimates", "For emergencies mention 24/7 availability" |
| **Cleaning** | "If they ask about pet hair, ask how many pets first before quoting", "Mention satisfaction guarantee on every pricing question" |

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
2. Create a strong database password and **save it somewhere**
3. Choose a region close to you — wait 1-2 minutes to initialize

### 2b. Get Your Credentials

**Settings (gear icon) → API**

| Key | Where used |
|---|---|
| **Project URL** | Frontend `.env` and GitHub Secrets |
| **anon public key** | Frontend `.env` and GitHub Secrets |
| **service role key** | Edge Function only — never in the browser |

### 2c. Disable Email Confirmation

**Authentication → Providers → Email → turn OFF "Confirm email" → Save**

This avoids needing to verify email every time you test the admin login.

### 2d. Environment Variables

`.env` (add to `.gitignore`):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2e. Supabase Client

`src/lib/supabaseClient.js`:

```js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

---

## 3. Database Schema

Run these in **Supabase Dashboard → SQL Editor**. Replace generic table names with your business-specific names from the mapping above.

---

### Table 1: `business_profile`

```sql
create table business_profile (
  id uuid primary key default uuid_generate_v4(),

  -- Core identity
  business_name text not null,
  tagline text,
  main_pitch text,          -- What you do and why people should care. 2-3 paragraphs.
  full_story text,          -- The longer narrative. How you got here, your approach.

  -- Fit signals
  ideal_for text,           -- Who is a great client/employer/customer
  not_ideal_for text,       -- Who should look elsewhere (be honest)

  -- Contact
  contact_email text,
  contact_phone text,
  booking_url text,
  location text,

  -- Social / links
  website_url text,
  linkedin_url text,
  github_url text,

  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

---

### Table 2: `services`

One row per service, product, practice area, or role. Rename this table to match your business (e.g., `practice_areas`, `service_packages`, `experiences`).

```sql
create table services (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references business_profile(id),

  -- Public-facing info
  service_name text not null,
  description text,            -- What's included, what problem it solves
  typical_timeline text,       -- e.g. "2-4 weeks", "Same day", "3-month cases"
  price_range text,            -- e.g. "$150/hr", "$200-$500", "Starting at $99/mo"
  best_for text,               -- Who this specific service is ideal for
  bullet_points text[],        -- Key selling points

  -- Private context (AI only — honest notes)
  private_notes text,          -- What makes this service tricky, common problems,
                               -- things you don't advertise but are true

  display_order int default 0,
  created_at timestamp default now()
);
```

**Portfolio equivalent fields:** `company_name`, `title`, `start_date`, `end_date`, `why_joined`, `why_left`, `actual_contributions`, `challenges_faced`, `lessons_learned`, `manager_would_say`

---

### Table 3: `capabilities`

Honest self-assessment of what you're strong at, moderate at, or weak/gap on.

```sql
create table capabilities (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references business_profile(id),
  name text not null,
  category text,          -- 'strong', 'moderate', or 'gap'
  honest_notes text,      -- "Great at residential, never done commercial"
  evidence text,          -- Years, certifications, examples
  created_at timestamp default now()
);
```

---

### Table 4: `limitations`

What you don't do, won't do, or aren't the right fit for. **This table is what makes the AI trustworthy.** The AI can only be honest about limitations it knows about — document them thoroughly.

```sql
create table limitations (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references business_profile(id),
  limitation_type text,      -- 'skill', 'service', 'geography', 'client_type', 'role_type'
  description text not null, -- What the limitation is
  why_not text,              -- Why you don't handle this
  referral_note text,        -- Who to refer to instead (optional)
  created_at timestamp default now()
);
```

---

### Table 5: `client_fit`

What kind of client/project/environment you work best in, and what you struggle with.

```sql
create table client_fit (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references business_profile(id),
  ideal_client text,
  not_a_fit_for text,
  working_style text,
  requirements text,         -- "Must have X before we start"
  dealbreakers text,
  how_handle_conflict text,
  how_handle_ambiguity text,
  created_at timestamp default now()
);
```

---

### Table 6: `testimonials`

Social proof the AI can cite when visitors ask about results, references, or reliability. Critical for service businesses where trust drives the buying decision.

```sql
create table testimonials (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references business_profile(id),
  client_name text,          -- First name or "A client in [City]" for privacy
  result_summary text,       -- One sentence: "Completed Airbnb turnover in 90 minutes"
  quote text,                -- Their words, or a paraphrase
  service_type text,         -- Which service this relates to
  created_at timestamp default now()
);
```

---

### Table 7: `faq_responses`

Pre-written answers to common questions. The AI uses these verbatim when a question matches.

```sql
create table faq_responses (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references business_profile(id),
  question text not null,
  answer text not null,
  is_common boolean default false,
  created_at timestamp default now()
);
```

---

### Table 7: `ai_instructions`

Custom behavioral rules written in plain English. The AI loads and follows these on every request. Change them any time without redeploying.

```sql
create table ai_instructions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references business_profile(id),
  instruction_type text,    -- 'honesty', 'tone', 'boundaries', 'sales'
  instruction text not null,
  priority integer default 0,
  created_at timestamp default now()
);
```

---

### Table 8: `request_logs`

Rate limiting. Required.

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

```sql
create or replace function keep_alive()
returns void as $$ begin end; $$ language plpgsql security definer;
```

---

## 4. Row Level Security (RLS)

Enable RLS on all tables. Create public views that strip private/sensitive fields. The Edge Function reads private data via the service role key — visitors never can.

```sql
-- Enable RLS on all tables
alter table business_profile enable row level security;
alter table services enable row level security;
alter table capabilities enable row level security;
alter table limitations enable row level security;
alter table client_fit enable row level security;
alter table testimonials enable row level security;
alter table faq_responses enable row level security;
alter table ai_instructions enable row level security;
alter table request_logs enable row level security;

-- Public view: profile without sensitive contact info
create view business_profile_public as
  select id, business_name, tagline, main_pitch, full_story,
         ideal_for, not_ideal_for, location, website_url, linkedin_url
  from business_profile;

-- Public view: services without private_notes
create view services_public as
  select id, profile_id, service_name, description, typical_timeline,
         price_range, best_for, bullet_points, display_order
  from services;

-- Public view: capabilities without honest_notes and evidence
create view capabilities_public as
  select id, profile_id, name, category
  from capabilities;

-- Anonymous users can read public views
create policy "Public read" on business_profile for select using (true);
create policy "Public read" on services for select using (true);
create policy "Public read" on capabilities for select using (true);
create policy "Public read" on limitations for select using (true);
create policy "Public read" on testimonials for select using (true);
create policy "Public read" on faq_responses for select using (true);

-- Authenticated admin has full access
create policy "Admin access" on business_profile for all using (auth.role() = 'authenticated');
```

---

## 5. Edge Function

### 5a. Set Secrets

**Supabase Dashboard → Project Settings → Edge Functions → Secrets → Add Secret**

| Secret Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from console.anthropic.com |

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

### 5b. Deploy

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy chat
```

### 5c. Edge Function Code

`supabase/functions/chat/index.ts` — replace generic table names with yours:

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
    // Replace table names here with your business-specific names
    const [
      { data: profile },
      { data: services },
      { data: capabilities },
      { data: limitations },
      { data: clientFit },
      { data: testimonials },
      { data: faqs },
      { data: instructions }
    ] = await Promise.all([
      supabase.from('business_profile').select('*').single(),
      supabase.from('services').select('*').order('display_order'),
      supabase.from('capabilities').select('*'),
      supabase.from('limitations').select('*'),
      supabase.from('client_fit').select('*').single(),
      supabase.from('testimonials').select('*'),
      supabase.from('faq_responses').select('*'),
      supabase.from('ai_instructions').select('*').order('priority', { ascending: false })
    ])

    const systemPrompt = buildSystemPrompt(
      profile, services, capabilities, limitations, clientFit, testimonials, faqs, instructions
    )

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

function buildSystemPrompt(profile, services, capabilities, limitations, clientFit, testimonials, faqs, instructions) {
  // Customize this persona description for your business type.
  // Portfolio: "You are an AI agent for a job candidate named..."
  // Law firm: "You are an AI assistant for [Firm Name], a law firm specializing in..."
  // Plumber: "You are an AI assistant for [Business], a licensed plumbing service..."
  // Cleaning: "You are an AI assistant for [Business], a residential cleaning service..."

  return `
You are an AI assistant for ${profile?.business_name}. ${profile?.tagline || ''}
Your job is to help visitors understand our services, answer their questions honestly,
and determine if we are a good fit for their needs.

## CUSTOM INSTRUCTIONS
${instructions?.map(i => `- ${i.instruction}`).join('\n') || '- Be honest and direct'}

## HONESTY DIRECTIVE
You must be direct and honest. Your job is NOT to sell to everyone.
Your job is to help people quickly determine if there is a genuine fit. This means:
- If we don't offer something they need, SAY SO DIRECTLY
- If they're not a good fit, tell them politely but clearly
- Never hedge or use weasel words
- Honesty builds trust. Overselling wastes everyone's time.
- It's acceptable to say "We're probably not the right fit for this"

## ABOUT US
${profile?.main_pitch}
${profile?.full_story || ''}

Who we work best with: ${profile?.ideal_for}
Not ideal for: ${profile?.not_ideal_for}

## OUR SERVICES
${services?.map(s => `
### ${s.service_name}
${s.description}
Timeline: ${s.typical_timeline || 'Varies'}
Price: ${s.price_range || 'Contact us for a quote'}
Best for: ${s.best_for || 'General clients'}
Key points: ${s.bullet_points?.join(', ') || ''}
`).join('\n---\n')}

## WHAT WE'RE GREAT AT
${capabilities?.filter(c => c.category === 'strong').map(c => `- ${c.name}: ${c.honest_notes || ''}`).join('\n')}

## WHAT WE DO MODERATELY WELL
${capabilities?.filter(c => c.category === 'moderate').map(c => `- ${c.name}: ${c.honest_notes || ''}`).join('\n')}

## WHAT WE DON'T DO (BE UPFRONT ABOUT THESE)
${capabilities?.filter(c => c.category === 'gap').map(c => `- ${c.name}: ${c.honest_notes || ''}`).join('\n')}

## LIMITATIONS & WHAT WE REFER OUT
${limitations?.map(l => `- ${l.description}: ${l.why_not}${l.referral_note ? ` (Refer to: ${l.referral_note})` : ''}`).join('\n')}

## IDEAL CLIENT FIT
${clientFit?.ideal_client || ''}
Not a fit for: ${clientFit?.not_a_fit_for || ''}
Our working style: ${clientFit?.working_style || ''}
Requirements: ${clientFit?.requirements || ''}
Dealbreakers: ${clientFit?.dealbreakers || ''}

## TESTIMONIALS & RESULTS
${testimonials?.map(t => `- ${t.client_name}: "${t.quote}" (${t.service_type || 'General'}) — Result: ${t.result_summary}`).join('\n')}

## PRE-WRITTEN ANSWERS TO COMMON QUESTIONS
${faqs?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}

## RESPONSE GUIDELINES
- Be professional, warm, and direct
- Keep responses concise — visitors don't want to read paragraphs
- If asked something not covered here, say "I don't have that specific info — reach out to us directly at ${profile?.contact_email || profile?.contact_phone}"
- Always mention how to contact us or book when relevant
- Guide qualified leads toward taking the next step
- Disqualify visitors who aren't a fit — it respects their time and ours
  `.trim()
}
```

---

## 6. System Prompt Customization by Industry

The `buildSystemPrompt` function's opening paragraph and tone should match your business. Replace the top section comment:

**Portfolio / Job Candidate:**
```
You are an AI agent representing [Name], a [Title].
Speak in THIRD PERSON. You are their agent, not them.
```

**Law Firm:**
```
You are an AI assistant for [Firm Name].
IMPORTANT: Never give specific legal advice. Always recommend scheduling
a consultation for specific legal questions. You can explain general
process and what to expect, but not legal strategy.
```

**Plumber:**
```
You are an AI assistant for [Business Name], a licensed plumbing company
serving [City/Region]. You help homeowners understand our services,
get rough estimates, and schedule service calls.
```

**Cleaning Service:**
```
You are an AI assistant for [Business Name]. You help clients understand
our cleaning packages, pricing, and booking process.
Always mention our satisfaction guarantee when pricing comes up.
```

---

## 7. Chat Interface Component

### Positioning

- **Trigger button**: `fixed bottom-24 right-6 z-50` — above a bottom nav bar; use `bottom-6` if no bottom nav
- **Chat window**: `fixed bottom-6 right-6 z-50` — anchored bottom-right corner
- **Width**: `w-full max-w-[380px]` — full width on mobile, capped at 380px
- **Height**: `h-[500px]` — fixed with internal scroll

### Component

Customize `SUGGESTED_QUESTIONS` and the opening `content` message for your business.

`src/components/ChatInterface.jsx`:

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// Customize these for your business type:
// Law firm: "Do you handle free consultations?", "What's your fee structure?"
// Plumber: "Do you do emergency calls?", "Are you licensed and insured?"
// Cleaning: "Do you bring supplies?", "How do you price jobs?"
// Portfolio: "What's your biggest weakness?", "Why did you leave your last role?"
const SUGGESTED_QUESTIONS = [
  "What services do you offer?",
  "How much does it cost?",
  "How do I get started?",
  "Are you available in my area?",
];

export default function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      // Customize this opening line:
      content: "Hi! I can answer questions about our services, pricing, and availability. What would you like to know?",
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
        {/* Customize this label: */}
        <span className="font-bold hidden md:inline">Ask a Question</span>
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
                {/* Customize this header title: */}
                <h3 className="text-white font-bold">AI Assistant</h3>
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

              {/* Suggested questions — shown only on first open */}
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

### Add to Root of App

```jsx
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

## 8. Making the AI Honest (Not Sycophantic)

Claude defaults to being helpful and agreeable. For service sites this becomes a problem — it will oversell. You must explicitly override this.

**Five techniques:**

1. **Say it directly in the system prompt** — "Your job is NOT to sell to everyone."
2. **Give it permission to disqualify** — "If we don't handle X, tell them directly and suggest who might."
3. **Fill the `limitations` table thoroughly** — the AI can only be honest about what it knows.
4. **Use `ai_instructions` for edge cases** — "If they need commercial service, tell them we only do residential."
5. **Test with bad-fit questions** — ask questions where honest answer is "no" and verify it says no.

**Example — Plumber:**
```
Visitor: "Do you install commercial fire suppression systems?"

GOOD: "That's outside what we handle — we're a residential plumber.
For commercial fire systems you'd want a licensed fire protection contractor."

BAD: "While we primarily focus on residential, our team has strong
plumbing fundamentals that could potentially be applied to commercial..."
```

---

## 9. Keep-Alive: GitHub Actions Workflow

Supabase free tier pauses projects after **7 days of no database activity**. Pinging `/auth/v1/health` does NOT count as activity — you need real database requests.

`.github/workflows/keep_alive.yml`:

```yaml
name: Supabase Keep Alive

on:
  schedule:
    - cron: '0 0 */5 * *'  # Every 5 days — safely under 7-day threshold
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
            "${{ secrets.SUPABASE_URL }}/rest/v1/business_profile?limit=1" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}")
          echo "Table query status: $STATUS"
```

**GitHub Secrets to add** (Repository → Settings → Secrets → Actions):

| Secret | Value |
|---|---|
| `SUPABASE_URL` | Your project URL |
| `SUPABASE_ANON_KEY` | Your anon public key |

---

## 10. Keep-Alive: Local Push Timer

GitHub disables scheduled workflows on repos with **no push activity for 60 days**. This local systemd timer pushes a small commit every 30 days.

### The Script

`~/.local/bin/repo-keep-alive.sh`:

```bash
#!/bin/bash

REPO="/path/to/your/repo"           # ← Update this
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

`Persistent=true` — if the machine was off when the timer should have fired, it runs immediately on next boot or wake-up.

### Enable It

```bash
systemctl --user daemon-reload
systemctl --user enable --now repo-keep-alive.timer
systemctl --user status repo-keep-alive.timer      # verify active
systemctl --user start repo-keep-alive.service     # test manually
cat ~/.local/share/repo-keep-alive.log             # view log
```

Track the file in git. If `*.txt` is in `.gitignore`:

```
*.txt
!keep_alive_count.txt
```

---

## 11. Complete Checklist

### Supabase Setup
- [ ] Create Supabase project, save credentials
- [ ] Disable email confirmation (Authentication → Providers → Email)
- [ ] Run all 9 table SQL scripts in SQL Editor (rename tables for your business)
- [ ] Create `keep_alive()` SQL function
- [ ] Enable RLS on all tables
- [ ] Create public views that strip private/sensitive fields
- [ ] Add `ANTHROPIC_API_KEY` to Edge Functions → Secrets

### Frontend Setup
- [ ] Install packages: `@supabase/supabase-js framer-motion react-markdown`
- [ ] Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Create `src/lib/supabaseClient.js`
- [ ] Add `ChatInterface.jsx` to app root
- [ ] Customize `SUGGESTED_QUESTIONS`, opening message, and header title for your business
- [ ] Customize trigger button label ("Ask AI", "Ask a Question", "Get Help Now", etc.)

### Edge Function
- [ ] Update table names in `Promise.all()` to match your business-specific names
- [ ] Customize the opening persona paragraph in `buildSystemPrompt()` for your business type
- [ ] Deploy: `supabase functions deploy chat`
- [ ] Test: open chat, ask a question, verify response

### GitHub Actions
- [ ] Commit and push `.github/workflows/keep_alive.yml`
- [ ] Update table name in the third step to match your primary table
- [ ] Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to GitHub Secrets
- [ ] Run workflow manually to verify all three steps pass

### Local Keep-Alive Timer
- [ ] Update `REPO` path in `repo-keep-alive.sh`
- [ ] Update `YOUR_USER` in the service file
- [ ] Make script executable: `chmod +x ~/.local/bin/repo-keep-alive.sh`
- [ ] Create service + timer files in `~/.config/systemd/user/`
- [ ] `systemctl --user enable --now repo-keep-alive.timer`
- [ ] Test: `systemctl --user start repo-keep-alive.service`
- [ ] Add `keep_alive_count.txt` to git, push

### Content Population
- [ ] Fill `business_profile` — especially `main_pitch`, `full_story`, `ideal_for`, `not_ideal_for`
- [ ] Add all services/offerings to `services` — include `private_notes` with honest context
- [ ] Rate capabilities honestly — put genuine weaknesses in `gap`, not `moderate`
- [ ] Fill `limitations` thoroughly — the AI can only be honest about what it knows
- [ ] Fill `client_fit` — what works, what doesn't, dealbreakers
- [ ] Add testimonials to `testimonials` — client name, result, quote, service type
- [ ] Pre-answer common questions in `faq_responses`
- [ ] Add behavioral rules to `ai_instructions`
- [ ] Test with questions where the honest answer is "no" — verify the AI says no
