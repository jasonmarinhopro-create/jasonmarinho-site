-- ─────────────────────────────────────────────────────────────────────
-- Migration : Audit Google Business Profile (LCD)
-- Date : 2026-04-26
-- ─────────────────────────────────────────────────────────────────────

-- ─── TABLE 1 : sessions d'audit ───
create table if not exists public.audit_gbp_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  business_name text,                   -- Nom de la fiche GBP saisi par le user (optionnel)
  city          text,                   -- Ville (optionnel)
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,            -- NULL tant que l'audit n'est pas terminé
  score_global  int,                    -- 0-100, NULL si non complété
  scores_by_pillar jsonb,               -- { identite: 80, photos: 45, avis: 90, ... }
  answers       jsonb not null default '{}'::jsonb  -- Toutes les réponses sérialisées
);

create index if not exists audit_gbp_sessions_user_idx
  on public.audit_gbp_sessions (user_id, started_at desc);

create index if not exists audit_gbp_sessions_completed_idx
  on public.audit_gbp_sessions (user_id, completed_at desc nulls last);

-- ─── RLS ───
alter table public.audit_gbp_sessions enable row level security;

-- Le user peut voir, créer et modifier ses propres audits
drop policy if exists "audit_gbp_sessions_select_own" on public.audit_gbp_sessions;
create policy "audit_gbp_sessions_select_own"
  on public.audit_gbp_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "audit_gbp_sessions_insert_own" on public.audit_gbp_sessions;
create policy "audit_gbp_sessions_insert_own"
  on public.audit_gbp_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "audit_gbp_sessions_update_own" on public.audit_gbp_sessions;
create policy "audit_gbp_sessions_update_own"
  on public.audit_gbp_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "audit_gbp_sessions_delete_own" on public.audit_gbp_sessions;
create policy "audit_gbp_sessions_delete_own"
  on public.audit_gbp_sessions for delete
  using (auth.uid() = user_id);
