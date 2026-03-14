-- ============================================================
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- https://app.supabase.com → SQL Editor → New query
-- ============================================================

-- 1. Table reported_guests (sécurité voyageurs)
-- ============================================================

create table if not exists public.reported_guests (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  identifier_type text check (identifier_type in ('email', 'phone', 'name')) not null,
  name text,
  incident_type text not null,
  description text,
  reporter_id uuid references public.profiles(id) on delete set null,
  reporter_city text,
  is_validated boolean default false,
  reported_at timestamptz default now()
);

alter table public.reported_guests enable row level security;

-- Drop policies if they already exist to avoid conflicts
drop policy if exists "Auth users read validated reports" on public.reported_guests;
drop policy if exists "Auth users insert reports" on public.reported_guests;

create policy "Auth users read validated reports" on public.reported_guests
  for select using (auth.role() = 'authenticated' and is_validated = true);

create policy "Auth users insert reports" on public.reported_guests
  for insert with check (auth.uid() = reporter_id);


-- 2. Table suggestions (suggestions de formations et partenaires)
-- ============================================================

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('formation', 'partner')) not null,
  message text not null,
  user_id uuid references public.profiles(id) on delete set null,
  user_email text,
  created_at timestamptz default now()
);

alter table public.suggestions enable row level security;

drop policy if exists "Auth users insert suggestions" on public.suggestions;
drop policy if exists "Auth users read own suggestions" on public.suggestions;

create policy "Auth users insert suggestions" on public.suggestions
  for insert with check (auth.uid() = user_id);

create policy "Auth users read own suggestions" on public.suggestions
  for select using (auth.uid() = user_id);
