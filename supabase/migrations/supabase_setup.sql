-- ============================================================================
-- live_3D-portfolio.v1 — Supabase schema reference
--
-- PURPOSE: This is a living snapshot of what's ACTUALLY deployed in the
-- Supabase project (bjzsuuykyjbcvtzflsjn), reconstructed by introspecting
-- information_schema.columns and pg_policies on 2026-08-25. It exists so
-- future work (by you or Claude) doesn't have to re-query the live DB to
-- know the schema.
--
-- These CREATE TABLE / policy statements already exist in the live database
-- — do NOT re-run this file against a project that already has these tables.
-- It's documentation, not a fresh-install script (unlike dmv-queen's
-- supabase_setup.sql, which IS meant to be run top-to-bottom on a new
-- project).
--
-- IMPORTANT: Whenever a table/column/policy is added or changed in the
-- Supabase dashboard, update this file in the same change so it stays
-- accurate. This file should be committed to git.
--
-- Conventions used throughout this project (match dmv-queen where noted):
--   - ids: uuid primary key default uuid_generate_v4()   [same as dmv-queen]
--   - timestamps: plain `timestamp` (no timezone), default now()  [same as dmv-queen]
--   - RLS: enabled on every table; public SELECT via `using (true)`,
--     writes gated on `(select auth.role()) = 'authenticated'`
--   - Two policy-naming styles currently coexist (harmless, just cosmetic):
--     candidate_profile/experiences/education use "Admin Insert/Update/Delete"
--     + "Public Read Access"; skills/gaps_weaknesses use "Enable insert/
--     update/delete for authenticated users only" + "Enable read access for
--     all users". Prefer the "Admin ..." style for anything new.
--   - request_logs has RLS enabled with NO anon policies at all — it's
--     written/read only by edge functions using the service role key
--     (which bypasses RLS), matching dmv-queen's pattern for internal-only
--     tables like ai_instructions/client_fit.
-- ============================================================================

create extension if not exists "uuid-ossp";


-- ============================================================================
-- TABLES
-- ============================================================================

-- The single candidate row. Consumed by analyze-jd and the /admin panel.
create table public.candidate_profile (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text,
  title text,
  target_titles text[],
  target_company_stages text[],
  elevator_pitch text,
  career_narrative text,
  looking_for text,
  not_looking_for text,
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

-- Work history. One row per job.
create table public.experiences (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.candidate_profile(id),
  company_name text,
  title text,
  title_progression text,
  start_date date,
  end_date date,
  is_current boolean default false,
  bullet_points text[],
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
  created_at timestamp default now(),
  description text
);

-- Skills matrix (strong / moderate / gap), used by analyze-jd.
create table public.skills (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.candidate_profile(id),
  skill_name text,
  category text default 'strong',   -- 'strong' | 'moderate' | 'gap'
  honest_notes text,
  created_at timestamp default now()
);

-- Explicit gaps/weaknesses ("the honest stuff"), used by analyze-jd.
create table public.gaps_weaknesses (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.candidate_profile(id),
  description text,
  why_its_a_gap text,
  created_at timestamp default now()
);

-- Degrees/certifications. Added 2026-08-25 — analyze-jd previously had no
-- education data at all and would hallucinate degree status from job titles.
create table public.education (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.candidate_profile(id),
  institution text,
  degree text not null,              -- e.g. "Master of Science", "Bachelor of Science"
  field_of_study text,               -- e.g. "Software Engineering", "Computer Science - Web Development"
  status text not null default 'completed' check (status in ('completed', 'in_progress')),
  start_year int,
  completion_year int,
  honors text,
  display_order int default 0,
  created_at timestamp default now()
);

-- Rate-limit tracking for analyze-jd (5 requests/IP/day). Internal only —
-- written and read exclusively by the edge function via the service role key.
create table public.request_logs (
  id uuid primary key default uuid_generate_v4(),
  ip_address text,
  function_name text,
  created_at timestamp default now()
);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.candidate_profile enable row level security;
alter table public.experiences enable row level security;
alter table public.skills enable row level security;
alter table public.gaps_weaknesses enable row level security;
alter table public.education enable row level security;
alter table public.request_logs enable row level security;
-- request_logs gets NO anon policy on purpose — only analyze-jd's service
-- role key touches it.

-- candidate_profile
create policy "Public Read Access" on public.candidate_profile
  for select using (true);
create policy "Admin Insert" on public.candidate_profile
  for insert with check ((select auth.role()) = 'authenticated');
create policy "Admin Update" on public.candidate_profile
  for update using ((select auth.role()) = 'authenticated');
create policy "Admin Delete" on public.candidate_profile
  for delete using ((select auth.role()) = 'authenticated');

-- experiences
create policy "Public Read Access" on public.experiences
  for select using (true);
create policy "Admin Insert" on public.experiences
  for insert with check ((select auth.role()) = 'authenticated');
create policy "Admin Update" on public.experiences
  for update using ((select auth.role()) = 'authenticated');
create policy "Admin Delete" on public.experiences
  for delete using ((select auth.role()) = 'authenticated');

-- skills
create policy "Enable read access for all users" on public.skills
  for select using (true);
create policy "Enable insert for authenticated users only" on public.skills
  for insert with check ((select auth.role()) = 'authenticated');
create policy "Enable update for authenticated users only" on public.skills
  for update using ((select auth.role()) = 'authenticated');
create policy "Enable delete for authenticated users only" on public.skills
  for delete using ((select auth.role()) = 'authenticated');

-- gaps_weaknesses
create policy "Enable read access for all users" on public.gaps_weaknesses
  for select using (true);
create policy "Enable insert for authenticated users only" on public.gaps_weaknesses
  for insert with check ((select auth.role()) = 'authenticated');
create policy "Enable update for authenticated users only" on public.gaps_weaknesses
  for update using ((select auth.role()) = 'authenticated');
create policy "Enable delete for authenticated users only" on public.gaps_weaknesses
  for delete using ((select auth.role()) = 'authenticated');

-- education
create policy "Public Read Access" on public.education
  for select using (true);
create policy "Admin Insert" on public.education
  for insert with check ((select auth.role()) = 'authenticated');
create policy "Admin Update" on public.education
  for update using ((select auth.role()) = 'authenticated');
create policy "Admin Delete" on public.education
  for delete using ((select auth.role()) = 'authenticated');


-- ============================================================================
-- Verify with, e.g.:
--   select name, title from candidate_profile;
--   select company_name, title from experiences order by display_order;
--   select degree, field_of_study, status, completion_year from education;
-- ============================================================================
