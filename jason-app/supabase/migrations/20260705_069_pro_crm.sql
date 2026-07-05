-- ═══════════════════════════════════════════════════════════════════
-- Mini-CRM des pros annuaire (photographes + équipes ménage).
--
-- Chaque pro gère son carnet de clients potentiels/actifs depuis une
-- page dédiée "Mes clients" : coordonnées complètes (téléphone !),
-- logement concerné, statut (prospect → client → fidèle), notes libres.
-- Une demande reçue peut être convertie en client en un clic
-- (source_contact_id garde le lien avec la demande d'origine).
--
-- Table unique multi-métiers (owner_kind + owner_id) plutôt que deux
-- tables jumelles : un seul composant UI, une seule policy.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Table pro_clients ─────────────────────────────────────────────
create table if not exists public.pro_clients (
  id uuid primary key default gen_random_uuid(),
  owner_kind text not null check (owner_kind in ('photographer', 'cleaner')),
  owner_id uuid not null,
  nom text not null,
  email text,
  telephone text,
  ville text,
  logement text,                          -- nom / adresse du bien concerné
  statut text not null default 'prospect'
    check (statut in ('prospect', 'client', 'fidele')),
  notes text,
  source_contact_id uuid,                 -- demande d'origine (photographer_contacts / cleaner_contacts)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pro_clients_owner_idx
  on public.pro_clients (owner_kind, owner_id, created_at desc);

alter table public.pro_clients enable row level security;

-- ── 2. RLS : le pro gère uniquement SON carnet ───────────────────────
drop policy if exists "Pros manage own clients" on public.pro_clients;
create policy "Pros manage own clients"
  on public.pro_clients
  for all
  to authenticated
  using (
    (owner_kind = 'photographer' and owner_id in (select id from public.photographers where user_id = auth.uid()))
    or
    (owner_kind = 'cleaner' and owner_id in (select id from public.cleaners where user_id = auth.uid()))
  )
  with check (
    (owner_kind = 'photographer' and owner_id in (select id from public.photographers where user_id = auth.uid()))
    or
    (owner_kind = 'cleaner' and owner_id in (select id from public.cleaners where user_id = auth.uid()))
  );

-- ── 3. Suppression des demandes par le pro ───────────────────────────
drop policy if exists "Pros delete own photographer contacts" on public.photographer_contacts;
create policy "Pros delete own photographer contacts"
  on public.photographer_contacts
  for delete
  to authenticated
  using (
    photographer_id in (
      select id from public.photographers where user_id = auth.uid()
    )
  );

drop policy if exists "Pros delete own cleaner contacts" on public.cleaner_contacts;
create policy "Pros delete own cleaner contacts"
  on public.cleaner_contacts
  for delete
  to authenticated
  using (
    cleaner_id in (
      select id from public.cleaners where user_id = auth.uid()
    )
  );

-- ── 4. updated_at automatique ────────────────────────────────────────
create or replace function public.pro_clients_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pro_clients_touch on public.pro_clients;
create trigger pro_clients_touch
  before update on public.pro_clients
  for each row execute function public.pro_clients_touch_updated_at();
