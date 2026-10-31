-- 3e métier de l'annuaire : « Dépannage et maintenance » (31/10/2026,
-- docs/claude/projet-maintenance.md). Même modèle que cleaners (fiche vitrine,
-- formules, villes couvertes, photos, clientèles, brouillon, Stripe), sans les
-- colonnes propres au ménage, avec celles du dépannage : spécialités,
-- disponibilités (soir, week-end, urgence), délai d'intervention, prix du
-- déplacement. Aucun contrôle SIRET ou assurance (décision de Jason : la
-- barrière de l'abonnement suffit) ; le SIRET reste un champ libre affiché.

create table if not exists public.depannage_pros (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  pseudo text,
  ville text not null,
  zone_couverte text,
  bio text,
  telephone text,
  telephone_public boolean not null default false,
  site_url text,
  instagram_handle text,
  reseaux jsonb not null default '{}'::jsonb,
  logo_url text,
  portfolio_photos text[] not null default '{}'::text[],
  formules jsonb not null default '[]'::jsonb,
  villes_couvertes text[] not null default '{}'::text[],
  deroule jsonb not null default '[]'::jsonb,
  clienteles text[] not null default '{}'::text[],
  langues text[],
  siret text,
  specialites text[] not null default '{}'::text[],
  disponibilites text[] not null default '{}'::text[],
  delai_intervention text check (delai_intervention is null or delai_intervention = any (array['jour_meme', '24h', '48h', 'semaine'])),
  deplacement_prix integer check (deplacement_prix is null or deplacement_prix between 0 and 500),
  tarif_heure integer,
  slug text unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  tier text not null default 'standard' check (tier = any (array['fondateur', 'standard'])),
  status text not null default 'pending_validation' check (status = any (array['pending_validation', 'approved_pending_payment', 'pending_payment', 'active', 'rejected', 'cancelled', 'hidden'])),
  is_public boolean not null default false,
  validated_at timestamptz,
  validated_by uuid references public.profiles(id),
  rejection_reason text,
  views_count integer not null default 0,
  contacts_count integer not null default 0,
  site_clicks_count integer not null default 0,
  instagram_clicks_count integer not null default 0,
  user_id uuid references auth.users(id) on delete set null,
  fiche_draft jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists depannage_pros_status_idx on public.depannage_pros (status);
create index if not exists depannage_pros_ville_idx on public.depannage_pros (ville) where is_public = true;
create index if not exists depannage_pros_tier_active_count_idx on public.depannage_pros (tier) where status = 'active';
create unique index if not exists depannage_pros_user_id_unique_idx on public.depannage_pros (user_id) where user_id is not null;

alter table public.depannage_pros enable row level security;

drop policy if exists "Pros read own depannage row" on public.depannage_pros;
create policy "Pros read own depannage row" on public.depannage_pros
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Pros update own depannage row" on public.depannage_pros;
create policy "Pros update own depannage row" on public.depannage_pros
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Demandes reçues par le bouton « Contacter » de la fiche
create table if not exists public.depannage_contacts (
  id uuid primary key default gen_random_uuid(),
  depannage_id uuid not null references public.depannage_pros(id) on delete cascade,
  contact_email text not null,
  contact_name text,
  contact_phone text,
  message text,
  source_url text,
  status text not null default 'nouvelle' check (status = any (array['nouvelle', 'repondue', 'devis_envoye', 'gagnee', 'perdue'])),
  pro_notes text,
  created_at timestamptz not null default now()
);

create index if not exists depannage_contacts_pro_idx on public.depannage_contacts (depannage_id, created_at desc);
create index if not exists depannage_contacts_status_idx on public.depannage_contacts (depannage_id, status);

alter table public.depannage_contacts enable row level security;

drop policy if exists "Pros read own depannage contacts" on public.depannage_contacts;
create policy "Pros read own depannage contacts" on public.depannage_contacts
  for select to authenticated using (depannage_id in (select id from public.depannage_pros where user_id = (select auth.uid())));
drop policy if exists "Pros update own depannage contacts" on public.depannage_contacts;
create policy "Pros update own depannage contacts" on public.depannage_contacts
  for update to authenticated using (depannage_id in (select id from public.depannage_pros where user_id = (select auth.uid())))
  with check (depannage_id in (select id from public.depannage_pros where user_id = (select auth.uid())));
drop policy if exists "Pros delete own depannage contacts" on public.depannage_contacts;
create policy "Pros delete own depannage contacts" on public.depannage_contacts
  for delete to authenticated using (depannage_id in (select id from public.depannage_pros where user_id = (select auth.uid())));

-- Fiches publiques (même règle que public_cleaners_view : active, publique, avec adresse)
create or replace view public.public_depannage_view as
select id, slug, full_name, pseudo, ville, zone_couverte, bio, tarif_heure,
       specialites, disponibilites, delai_intervention, deplacement_prix,
       langues, siret, site_url, instagram_handle,
       case when telephone_public then telephone else null end as telephone,
       tier, views_count, contacts_count, created_at, logo_url, reseaux,
       portfolio_photos, formules, villes_couvertes, deroule, clienteles
from public.depannage_pros
where status = 'active' and is_public = true and slug is not null;

grant select on public.public_depannage_view to anon, authenticated;
