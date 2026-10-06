# AI Facts Audit: "Ask AI About Bernard" and "Honest Fit Assessment"

Read-only audit, 2026-10-06, branch `copy-reposition`. No code was changed in any audited file.

## Scope

| Feature | Client code | Prompt / server code |
|---|---|---|
| Ask AI About Bernard | `src/components/ChatInterface.jsx` | `supabase/functions/chat/index.ts` |
| Honest Fit Assessment (JD analyzer) | `src/components/JDAnalyzer.jsx` | `supabase/functions/analyze-jd/index.ts` |

**Important limitation:** both prompts get most of their facts at runtime from Supabase tables:
`candidate_profile`, `experiences`, `skills`, `gaps_weaknesses` and `education`. The table structure is in
`supabase/migrations/supabase_setup.sql`. The **rows are not in this repo**, so this audit could not check them.
The findings below cover only text hard-coded in the repo. The live rows still need a separate check
(see "Not audited" at the end).

## Verified fact list used for comparison

1. Delivery & Release Management is the priority track. AI architecture is equally real and must not be understated.
2. Saia (Nov 2020 - Mar 2023): sole Release Manager, 6+ pipelines, ITIL protocol built and rolled out, RFCs and CAB, Sunday off-hours deployments, one emergency rollback, Go/No-Go, React Native app for 5,000+ users.
3. Major Media Group: owned by Bernard. Fully remote. Multi-agent AI platform for a law firm, built from requirements through deployment, deployed on Supabase with RLS. Shadow Mode and Chaos Engine are his.
4. 3Sixty Dental: Anatomical Guide is a **physical** surgical guide, not software. Also delivered proprietary implant-planning software to dental offices (HIPAA).
5. Uses Claude, ChatGPT and Gemini for coding, planning, documentation and research. Does **not** use local LLMs daily. Not claimed: GitHub Copilot, Cursor, Jira administration, Tableau/Power BI/Looker.
6. Never claim: "zero downtime", "10+ years", P&L or client-acquisition ownership, or any metric not listed.

## Findings

### Contradictions (hard-coded text that conflicts with the fact list)

| # | File:line | What the code says | Conflicts with | Severity |
|---|---|---|---|---|
| C1 | `supabase/functions/analyze-jd/index.ts:99` | "He manages P&L, sales, client acquisition, and strategy. This COUNTS as 'Business Ownership' …" | Fact 6 (never claim P&L or client-acquisition ownership) | **High.** This is an explicit instruction, so the model will repeat it as fact. |
| C2 | `supabase/functions/analyze-jd/index.ts:100` | "He uses 'Local LLMs' and 'AI Agent Orchestration' daily." | Fact 5 (does not use local LLMs daily) | **High** |
| C3 | `supabase/functions/analyze-jd/index.ts:104` | Rule 2 example: if the JD asks for a tool "he uses a parallel one (e.g., … 'Local LLMs'), count it as a MATCH" | Fact 5. It repeats the local-LLM claim and tells the model to count a tool he doesn't use as a match. | **High** |
| C4 | `supabase/functions/analyze-jd/index.ts:106` | Rule 4 example: "He doesn't have an MBA, but he ran his own **profitable** tech consultancy" | Fact 6 (no unlisted metrics or financial claims). Profitability isn't in the verified list. | **Medium.** It's an example, but models often copy examples word for word. |

### Unsupported claims or framing (not a direct contradiction, but invites unverified output)

| # | File:line | Issue | Related fact |
|---|---|---|---|
| U1 | `supabase/functions/analyze-jd/index.ts:104` | "he uses AI to bridge syntax gaps" (Python/C#) is hard-coded and not in the verified list. The list only says he uses Claude/ChatGPT/Gemini for coding, planning, docs and research. Using "Claude CLI" as an example of a tool he lacks is also questionable, since he uses Claude. | Fact 5 |
| U2 | `supabase/functions/analyze-jd/index.ts:95` | Meeting "50-55% of the core requirements" counts as a "Strong Fit". That inflates the verdict and conflicts with the widget's "Honest" framing. This is a design choice, not a factual error. | — |
| U3 | `supabase/functions/analyze-jd/index.ts:74-80` and `supabase/functions/chat/index.ts:61-67` | Neither function sends `start_date`, `end_date`, `bullet_points`, `actual_contributions` or `quantified_impact` to the model. Only `company_name`, `title`, `description`, `challenges_faced` and `why_left` are sent. Without dates the model has to guess tenure, which makes claims like "10+ years" more likely. Without bullets, verified Saia facts (6+ pipelines, ITIL, CAB, rollback, Go/No-Go) only reach the model if they're also in `description`. | Facts 2, 6 |
| U4 | `supabase/functions/analyze-jd/index.ts:89-126` (whole prompt) | The prompt never says that Delivery & Release Management is the priority track. Release Management is only mentioned as a "senior-level trait" (line 105). Nothing pins down that the Anatomical Guide is physical, which makes the old "launched Anatomical Guide … implant-planning software" mix-up likely if the DB still has old wording. | Facts 1, 4 |
| U5 | `supabase/functions/chat/index.ts:53-71` | The chat prompt has no fact guardrails: no "never claim" list, and no rule against inventing metrics, tools or tenure. It does have a "records don't mention that" fallback (line 70). It also doesn't load `education` or `gaps_weaknesses`, so it can't answer degree questions (Master's) and has no list of things not to claim. | Facts 5, 6 |
| U6 | `supabase/functions/chat/index.ts:60`, `supabase/functions/analyze-jd/index.ts:113` | Both prompts send only `elevator_pitch` from `candidate_profile`. `title` and `target_titles`, where the new "Delivery & Release Management \| Enterprise AI Strategist & Architect" positioning would live, are never sent. | Fact 1 |

### Client components

| File | Result |
|---|---|
| `src/components/ChatInterface.jsx` | No factual claims about Bernard. The greeting (line 12) and labels are generic. No issues. |
| `src/components/JDAnalyzer.jsx` | No factual claims about Bernard. It only displays whatever the server returns. No issues. |

### Checked and clear

- Searching the repo for "zero downtime", "10+ years", "Copilot", "Cursor", "Jira", "Tableau", "Power BI", "Looker" and "Ollama" found nothing in either AI feature. The only "CoPilot" hit is the CoPilot GPS integration in the Saia experience bullet (`src/constants/index.js`), which is your own approved copy and refers to a GPS product, not GitHub Copilot.

## Not audited (needs a follow-up)

The live Supabase rows. Suggested checks, in the Admin panel or SQL editor:

- `candidate_profile.elevator_pitch`, `title`, `target_titles`: do they reflect the new positioning?
- `experiences.title` and `experiences.description` for all three jobs: do they match the new site copy? Is the Anatomical Guide described as physical? Is Major Media Group free of P&L/client-acquisition wording?
- `skills`: any rows for Copilot, Cursor, Jira, Tableau, Power BI, Looker or local LLMs?
- `gaps_weaknesses`: does it list the "not claimed" tools so the analyzer reports them as gaps?
- Anywhere: "zero downtime", "10+ years", or metrics not in the verified list.

## Suggested fixes (not applied; out of scope for this task)

1. Delete or rewrite `analyze-jd/index.ts:99-100` so they match facts 3 and 5. Remove "Local LLMs" from line 104 and "profitable" from line 106.
2. Add a shared "verified facts / never claim" block to both prompts.
3. Send experience dates and `bullet_points` (or `actual_contributions`) to both prompts. Send `education` and `gaps_weaknesses` to `chat`.
4. Send `candidate_profile.title` / `target_titles` so the model knows that Release & Delivery leads.
