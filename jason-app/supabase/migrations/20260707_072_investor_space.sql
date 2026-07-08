-- Espace « Investisseur immobilier » (Phase 2).
-- Un 4e espace dans le système multi-espaces (hôte / photographe / ménage).
-- L'investisseur analyse des projets d'acquisition LCD avant d'acheter :
-- il sauvegarde ses estimations (+ PDF bancaire) sous forme de « projets ».

-- ── Flag investisseur sur le profil ────────────────────────────────────────
-- Activé à l'inscription (carte « Investisseur ») ou quand un hôte bascule
-- en mode investisseur pour analyser un nouveau bien. Un même compte peut
-- être hôte ET investisseur (le pont acquisition → exploitation).
alter table public.profiles
  add column if not exists is_investor boolean not null default false;

-- ── Projets d'acquisition ──────────────────────────────────────────────────
create table if not exists public.investor_projects (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  nom            text not null,                 -- libellé libre (ex: "T2 Cité Carcassonne")
  -- Paramètres d'entrée de l'estimation (permettent de recalculer/rouvrir)
  pays           text not null default 'FR',
  ville          text,
  type_logement  text not null default 't2',
  nb_chambres    smallint not null default 2,
  mode           text not null default 'toute-annee',
  -- Hypothèses financières (optionnelles)
  prix_achat     integer,
  mensualite     integer,
  -- Snapshot du résultat au moment de la sauvegarde (revenus, charges, ratios)
  -- pour affichage rapide sans recalcul, et traçabilité de ce qui a été présenté.
  snapshot       jsonb,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists investor_projects_user_idx
  on public.investor_projects (user_id, created_at desc);

alter table public.investor_projects enable row level security;

drop policy if exists "investor_projects_select_own" on public.investor_projects;
create policy "investor_projects_select_own"
  on public.investor_projects for select using (auth.uid() = user_id);

drop policy if exists "investor_projects_insert_own" on public.investor_projects;
create policy "investor_projects_insert_own"
  on public.investor_projects for insert with check (auth.uid() = user_id);

drop policy if exists "investor_projects_update_own" on public.investor_projects;
create policy "investor_projects_update_own"
  on public.investor_projects for update using (auth.uid() = user_id);

drop policy if exists "investor_projects_delete_own" on public.investor_projects;
create policy "investor_projects_delete_own"
  on public.investor_projects for delete using (auth.uid() = user_id);
