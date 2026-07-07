-- Déclarations obligatoires des voyageurs (SIBA PT, fiche police FR,
-- SES Hospedajes ES…). Une ligne est créée automatiquement à la signature
-- d'un contrat quand le pays du logement exige une déclaration pour la
-- nationalité du voyageur. L'hôte la marque « faite » depuis le dashboard.

create table if not exists public.guest_declarations (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  contract_id            uuid references public.contracts(id) on delete cascade,
  sejour_id              uuid references public.sejours(id) on delete set null,
  voyageur_id            uuid references public.voyageurs(id) on delete set null,
  -- Snapshot dénormalisé : le widget doit rester lisible même si le
  -- voyageur ou le logement est supprimé ensuite.
  voyageur_nom           text not null,
  voyageur_nationalite   text,
  logement_nom           text,
  logement_pays          text not null default 'FR',
  date_arrivee           date not null,
  deadline_at            timestamptz not null,
  statut                 text not null default 'a_faire'
                         check (statut in ('a_faire', 'faite', 'ignoree')),
  declared_at            timestamptz,
  created_at             timestamptz not null default now()
);

-- Une seule déclaration par contrat (idempotence du hook de signature).
-- Index non partiel : les NULL sont distincts en Postgres, et un index
-- plein permet l'inférence ON CONFLICT (contract_id) côté PostgREST.
create unique index if not exists guest_declarations_contract_uidx
  on public.guest_declarations (contract_id);

-- Une seule déclaration par séjour : dédoublonne les flux contrat (qui
-- porte aussi le sejour_id) et séjour direct (Airbnb/Booking sans contrat).
create unique index if not exists guest_declarations_sejour_uidx
  on public.guest_declarations (sejour_id);

create index if not exists guest_declarations_user_statut_idx
  on public.guest_declarations (user_id, statut, deadline_at);

alter table public.guest_declarations enable row level security;

drop policy if exists "guest_declarations_select_own" on public.guest_declarations;
create policy "guest_declarations_select_own"
  on public.guest_declarations for select
  using (auth.uid() = user_id);

drop policy if exists "guest_declarations_insert_own" on public.guest_declarations;
create policy "guest_declarations_insert_own"
  on public.guest_declarations for insert
  with check (auth.uid() = user_id);

drop policy if exists "guest_declarations_update_own" on public.guest_declarations;
create policy "guest_declarations_update_own"
  on public.guest_declarations for update
  using (auth.uid() = user_id);

drop policy if exists "guest_declarations_delete_own" on public.guest_declarations;
create policy "guest_declarations_delete_own"
  on public.guest_declarations for delete
  using (auth.uid() = user_id);
