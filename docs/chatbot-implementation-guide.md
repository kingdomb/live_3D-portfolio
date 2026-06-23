# AI Chatbot Implementation Guide

A complete implementation guide for adding a floating AI chatbot to any service site using Supabase Edge Functions, the Anthropic Claude API, and React. Based on the production implementation in this portfolio repo.

---

## Architecture Overview

```
User Browser (React)
    └── ChatInterface.jsx
            └── supabase.functions.invoke('chat')
                    └── Supabase Edge Function (Deno)
                            ├── Rate limit check (request_logs table)
                            ├── Fetch context from DB (your service data)
                            └── Call Claude API → return reply
```

The chatbot reads its knowledge from your Supabase database. To change what the bot knows, you update the database — no code changes required.

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
2. Save your **Project URL** and **anon public key** (Settings → API)
3. Save your **service role key** — this is used only inside the Edge Function, never in the browser

### 2b. Environment Variables

Create a `.env` file at your project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Add both to `.gitignore`. These values are safe for the browser (anon key has RLS restrictions).

### 2c. Supabase Client

`src/lib/supabaseClient.js`:

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 3. Database Schema

Run the following SQL in your Supabase SQL editor (Dashboard → SQL Editor).

### Core Table: `service_profile`

Stores the primary identity and pitch of your service — this becomes the AI's core knowledge.

```sql
create table service_profile (
  id uuid primary key default gen_random_uuid(),
  business_name text,
  tagline text,
  elevator_pitch text,        -- 2-3 paragraph description of what you do
  ideal_client text,          -- Who is your target customer?
  not_a_fit_for text,         -- Who should NOT contact you?
  contact_email text,
  created_at timestamptz default now()
);
```

**What to put here:**
- `elevator_pitch`: A detailed summary of your service, value proposition, and differentiators. Write it the way you'd explain it to a prospective client in 2 minutes. The AI uses this as its primary knowledge source.
- `ideal_client`: Describe the customers you want — industry, size, problem type. The AI uses this to qualify leads.
- `not_a_fit_for`: Be honest. If you don't serve certain industries or budgets, say so. The AI will handle disqualification gracefully.

---

### Supporting Table: `services`

Each row is a discrete service offering.

```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references service_profile(id),
  service_name text,
  description text,           -- Full explanation of what's included
  typical_timeline text,      -- e.g. "2-4 weeks"
  price_range text,           -- e.g. "$1,500–$3,000" or "starting at $500/mo"
  best_for text,              -- Who this specific service is ideal for
  display_order int default 0,
  created_at timestamptz default now()
);
```

**What to put here:**
One row per service you offer. The AI will reference these when a visitor asks "what do you do?" or "how much does X cost?" Be specific — vague descriptions produce vague answers.

---

### Supporting Table: `faqs`

Common questions the AI should answer confidently and consistently.

```sql
create table faqs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references service_profile(id),
  question text,
  answer text,
  created_at timestamptz default now()
);
```

**What to put here:**
Think of every question a prospect asks before deciding to reach out. Price objections, timeline questions, "do you work with X industry?", "what makes you different?", etc. The AI will use these verbatim when matched.

---

### Supporting Table: `testimonials`

Social proof the AI can cite when visitors ask about results.

```sql
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references service_profile(id),
  client_name text,           -- First name or company name only
  result_summary text,        -- One sentence: "Reduced onboarding time by 40%"
  quote text,
  created_at timestamptz default now()
);
```

---

### Required Table: `request_logs`

Used by the Edge Function to enforce per-IP rate limits. Do not skip this.

```sql
create table request_logs (
  id uuid primary key default gen_random_uuid(),
  ip_address text,
  function_name text,
  created_at timestamptz default now()
);
```

---

### Row Level Security (RLS)

Enable RLS on all tables. The Edge Function uses the service role key (which bypasses RLS), so you can lock down public access entirely:

```sql
-- Enable RLS on all tables
alter table service_profile enable row level security;
alter table services enable row level security;
alter table faqs enable row level security;
alter table testimonials enable row level security;
alter table request_logs enable row level security;

-- No public read policies needed — the Edge Function handles all reads
-- Add admin policies here if you build an admin panel
```

---

### Create the `keep_alive` Function

Run this to support the keep-alive workflow (explained in Section 6):

```sql
create or replace function keep_alive()
returns void as $$ begin end; $$ language plpgsql security definer;
```

---

## 4. Edge Function

### 4a. Set Secrets

In your Supabase dashboard go to **Project Settings → Edge Functions → Secrets** and add:

| Secret Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) |

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase — do not set them manually.

### 4b. Deploy the Function

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login and link your project
supabase login
supabase link --project-ref your-project-ref

# Deploy
supabase functions deploy chat
```

### 4c. Edge Function Code

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Rate limit: 20 messages per IP per day
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { count } = await supabaseClient
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

    await supabaseClient.from('request_logs').insert({ ip_address: clientIP, function_name: 'chat' })

    // Fetch context from your database
    const { data: profile } = await supabaseClient.from('service_profile').select('*').single()
    const { data: services } = await supabaseClient.from('services').select('*').order('display_order')
    const { data: faqs } = await supabaseClient.from('faqs').select('*')
    const { data: testimonials } = await supabaseClient.from('testimonials').select('*')

    const businessName = profile?.business_name || 'this business'

    // Customize this system prompt for your use case
    const systemPrompt = `
      You are an AI assistant for ${businessName}. You help website visitors understand our services,
      answer questions, and determine if we are a good fit for their needs.

      RULES:
      - Be professional, warm, and direct
      - Never invent information not present in the data below
      - If asked something you don't know, say "That's a great question — reach out to us directly at ${profile?.contact_email} for specifics"
      - Guide qualified leads toward making contact
      - Politely disqualify visitors who are not a fit (based on not_a_fit_for data)

      BUSINESS CONTEXT:
      About Us: ${profile?.elevator_pitch}
      Ideal Client: ${profile?.ideal_client}
      Not a Fit For: ${profile?.not_a_fit_for}

      OUR SERVICES:
      ${JSON.stringify(services)}

      FREQUENTLY ASKED QUESTIONS:
      ${JSON.stringify(faqs)}

      TESTIMONIALS:
      ${JSON.stringify(testimonials)}
    `

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
```

---

## 5. Chat Interface Component

### Positioning

The chat window uses Tailwind's `fixed` positioning:

- **Trigger button**: `fixed bottom-24 right-6 z-50` — sits above a bottom nav bar if present; change `bottom-24` to `bottom-6` if you have no bottom nav
- **Chat window**: `fixed bottom-6 right-6 z-50` — anchored to the bottom-right corner
- **Width**: `w-full max-w-[380px]` — full width on small screens, capped at 380px on larger ones
- **Height**: `h-[500px]` — fixed height with internal scroll; reduce to `h-[420px]` for mobile-first layouts

### Component

`src/components/ChatInterface.jsx`:

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      // Customize this opening message for your business
      content: "Hi! I'm an AI assistant. Ask me anything about our services!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
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

  return (
    <>
      {/* Floating trigger button — hidden when chat is open */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 z-50 p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all ${
          isOpen ? 'hidden' : 'bg-teal-500 text-black'
        }`}
      >
        <span className="text-2xl">🤖</span>
        {/* Label hides on mobile, shows on md+ screens */}
        <span className="font-bold hidden md:inline">Ask a Question</span>
      </motion.button>

      {/* Chat window — animated in/out */}
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
            <form onSubmit={handleSend} className="p-3 bg-gray-800 border-t border-gray-700">
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

Import and drop `<ChatInterface />` at the root layout level so it floats above all pages:

```jsx
// App.jsx or your root layout
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

## 6. Keep-Alive: GitHub Actions Workflow

Supabase free tier projects pause after **7 days of no database activity**. This workflow pings the project every 5 days using real database requests.

`.github/workflows/keep_alive.yml`:

```yaml
name: Supabase Keep Alive

on:
  schedule:
    - cron: '0 0 */5 * *'  # Every 5 days — 2-day buffer under the 7-day threshold
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
            "${{ secrets.SUPABASE_URL }}/rest/v1/service_profile?limit=1" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}")
          echo "Table query status: $STATUS"
```

**Add secrets in GitHub:** Repository → Settings → Secrets and variables → Actions → New repository secret

| Secret | Value |
|---|---|
| `SUPABASE_URL` | Your project URL |
| `SUPABASE_ANON_KEY` | Your anon public key |

> **Why not just ping `/auth/v1/health`?** That endpoint is a service health check — it does not touch the database, so Supabase does not count it as activity.

---

## 7. Keep-Alive: Local Push Timer

GitHub disables scheduled workflows on repos with **no push activity for 60 days**. This local systemd timer pushes a small commit every 30 days to prevent that.

### 7a. The Script

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

### 7b. The Systemd Service

`~/.config/systemd/user/repo-keep-alive.service`:

```ini
[Unit]
Description=Push keep-alive commit to repo

[Service]
Type=oneshot
Environment="GIT_SSH_COMMAND=ssh -i /home/YOUR_USER/.ssh/id_ed25519 -o BatchMode=yes -o StrictHostKeyChecking=accept-new"
ExecStart=/home/YOUR_USER/.local/bin/repo-keep-alive.sh
```

### 7c. The Systemd Timer

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

`Persistent=true` means if the laptop was off when the timer should have fired, it runs immediately on next boot.

### 7d. Enable the Timer

```bash
systemctl --user daemon-reload
systemctl --user enable --now repo-keep-alive.timer

# Verify it's active
systemctl --user status repo-keep-alive.timer

# Test manually
systemctl --user start repo-keep-alive.service

# View logs
cat ~/.local/share/repo-keep-alive.log
```

### 7e. Track the File in Git

Add to `.gitignore` if `*.txt` is ignored:

```
*.txt
!keep_alive_count.txt
```

Commit an empty `keep_alive_count.txt` to the repo initially so git tracks it.

---

## 8. Adapting the System Prompt

The system prompt in the Edge Function is where you shape the bot's personality and knowledge boundaries. Key things to customize:

- **Persona**: Replace "AI assistant" with a name specific to your brand
- **Goal**: Tell the bot what success looks like (schedule a call, fill out a form, make a purchase)
- **Fallback**: Give it a real email or link to redirect questions it can't answer
- **Tone**: Specify how formal or casual the responses should be
- **Disqualification**: Tell it explicitly when to say "we're probably not the right fit"

---

## 9. Summary Checklist

- [ ] Supabase project created and `.env` configured
- [ ] Database tables created via SQL editor
- [ ] `keep_alive()` SQL function created
- [ ] RLS enabled on all tables
- [ ] `ANTHROPIC_API_KEY` secret added in Supabase Edge Functions settings
- [ ] Edge Function deployed with `supabase functions deploy chat`
- [ ] `ChatInterface.jsx` added to root of app
- [ ] GitHub Actions workflow committed and pushed
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` added to GitHub Secrets
- [ ] Local keep-alive timer installed and enabled
- [ ] Database populated with your service data
