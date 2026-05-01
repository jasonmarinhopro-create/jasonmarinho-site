-- ─────────────────────────────────────────────────────────────────────
-- Migration : Fiche incident par séjour
-- Permet à l'hôte de tracer les incidents privés d'un séjour
-- (linge taché, casse, dégradation, retard restitution, etc.)
-- Différent de chez_nous_reports qui est public/communautaire.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.sejour_incidents (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  sejour_id          uuid not null references public.sejours(id) on delete cascade,
  type               text not null check (type in (
    'linge_tache',
    'casse',
    'salete',
    'degradation',
    'vol',
    'retard_restitution',
    'plainte_voisin',
    'autre'
  )),
  description        text,
  photo_url          text,
  caution_montant    numeric(10,2),
  statut             text not null default 'ouvert' check (statut in (
    'ouvert',
    'resolu',
    'rembourse',
    'annule'
  )),
  notes_internes     text,
  created_at         timestamptz not null default now(),
  resolved_at        timestamptz,
  updated_at         timestamptz not null default now()
);

create index if not exists sejour_incidents_user_idx
  on public.sejour_incidents (user_id, created_at desc);

create index if not exists sejour_incidents_sejour_idx
  on public.sejour_incidents (sejour_id, created_at desc);

create index if not exists sejour_incidents_open_idx
  on public.sejour_incidents (user_id)
  where statut = 'ouvert';

-- ─── RLS ───
alter table public.sejour_incidents enable row level security;

drop policy if exists "sejour_incidents_select_own" on public.sejour_incidents;
create policy "sejour_incidents_select_own"
  on public.sejour_incidents for select
  using (auth.uid() = user_id);

drop policy if exists "sejour_incidents_insert_own" on public.sejour_incidents;
create policy "sejour_incidents_insert_own"
  on public.sejour_incidents for insert
  with check (auth.uid() = user_id);

drop policy if exists "sejour_incidents_update_own" on public.sejour_incidents;
create policy "sejour_incidents_update_own"
  on public.sejour_incidents for update
  using (auth.uid() = user_id);

drop policy if exists "sejour_incidents_delete_own" on public.sejour_incidents;
create policy "sejour_incidents_delete_own"
  on public.sejour_incidents for delete
  using (auth.uid() = user_id);

comment on table  public.sejour_incidents is 'Incidents privés liés à un séjour : suivi opérationnel pour l''hôte';
comment on column public.sejour_incidents.type            is 'Catégorie de l''incident';
comment on column public.sejour_incidents.statut          is 'Statut de résolution';
comment on column public.sejour_incidents.caution_montant is 'Montant à appliquer / appliqué sur la caution';
