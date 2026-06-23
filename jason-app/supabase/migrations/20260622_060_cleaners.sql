-- ════════════════════════════════════════════════════════════════════
-- Annuaire ménage LCD — table + view publique + RLS
-- ════════════════════════════════════════════════════════════════════
-- Réplique le pattern de la table `photographers` (migration 058) pour
-- les équipes de ménage spécialisées location courte durée.
--
-- Spécificités vs photographes :
--   - tarif_forfait_min/max : forfait par turnover (€)
--   - tarif_heure : tarif horaire optionnel (€/h)
--   - prestations : array de services (ménage, linge, repassage, etc.)
--   - equipe_type : solo / duo / equipe_3_5 / equipe_6_plus
--   - logements_geres : capacité actuelle (nb de logements LCD gérés)
--   - delai_reservation : réactivité (jour_meme / 24h / 48h / 72h)
--   - assurance_rc_pro : couvert RC pro (rassurant pour l'hôte)
--   - siret : SIRET optionnel (preuve de pro, peut être affiché)
--   - langues : array de langues parlées (utile pour check-in voyageur)
--
-- Pricing identique photographes : 39,98 €/an à vie pour 20 fondateurs,
-- puis 79,98 €/an. Stripe Subscription mode (cf. dispatch.ts).
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.cleaners (
  id uuid primary key default gen_random_uuid(),

  -- ── Identité publique ────────────────────────────────────────────
  email text not null unique,
  full_name text not null,                -- nom du gérant ou de l'équipe
  pseudo text,                            -- nom commercial / marque (ex: "Bee Clean Marseille")
  ville text not null,
  zone_couverte text,                     -- ex: "Lyon + 30km"
  bio text,                               -- présentation libre
  telephone text,
  site_url text,                          -- site web (optionnel — beaucoup n'en ont pas)
  instagram_handle text,                  -- @beeclean.lcd

  -- ── Tarification ─────────────────────────────────────────────────
  tarif_forfait_min integer,              -- forfait turnover bas €
  tarif_forfait_max integer,              -- forfait turnover haut €
  tarif_heure integer,                    -- tarif horaire optionnel €/h

  -- ── Prestations & capacité ───────────────────────────────────────
  prestations text[],                     -- ['menage_standard', 'gestion_linge', 'repassage', 'reapprovisionnement', 'etat_des_lieux_photo', 'petite_maintenance', 'nettoyage_exterieur', 'gestion_dechets']
  equipe_type text                        -- solo / duo / equipe_3_5 / equipe_6_plus
    check (equipe_type is null or equipe_type in ('solo', 'duo', 'equipe_3_5', 'equipe_6_plus')),
  logements_geres integer,                -- nb logements LCD actuellement gérés (capacité/expérience)
  delai_reservation text                  -- réactivité min
    check (delai_reservation is null or delai_reservation in ('jour_meme', '24h', '48h', '72h')),
  langues text[],                         -- ['fr', 'en', 'es', ...]

  -- ── Gages professionnels ─────────────────────────────────────────
  assurance_rc_pro boolean default false,
  siret text,                             -- optionnel, format 14 chars

  -- ── URL publique ─────────────────────────────────────────────────
  slug text unique,

  -- ── Stripe Subscription ──────────────────────────────────────────
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  tier text not null default 'standard'
    check (tier in ('fondateur', 'standard')),

  -- ── Modération & cycle de vie ────────────────────────────────────
  status text not null default 'pending_validation'
    check (status in ('pending_validation', 'approved_pending_payment', 'active', 'rejected', 'cancelled')),
  is_public boolean not null default false,
  validated_at timestamptz,
  validated_by uuid references public.profiles(id),
  rejection_reason text,

  -- ── Stats ────────────────────────────────────────────────────────
  views_count integer not null default 0,
  contacts_count integer not null default 0,

  -- ── Timestamps ───────────────────────────────────────────────────
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cleaners_status_idx
  on public.cleaners (status);

create index if not exists cleaners_is_public_idx
  on public.cleaners (is_public)
  where is_public = true;

create index if not exists cleaners_slug_idx
  on public.cleaners (slug)
  where slug is not null;

create index if not exists cleaners_ville_idx
  on public.cleaners (ville)
  where is_public = true;

create index if not exists cleaners_tier_active_count_idx
  on public.cleaners (tier)
  where status = 'active';

-- ── View publique : annuaire ménage ────────────────────────────────
drop view if exists public.public_cleaners_view;
create view public.public_cleaners_view as
select
  id, slug, full_name, pseudo, ville, zone_couverte, bio,
  tarif_forfait_min, tarif_forfait_max, tarif_heure,
  prestations, equipe_type, logements_geres, delai_reservation, langues,
  assurance_rc_pro, siret,
  site_url, instagram_handle, telephone,
  tier, views_count, contacts_count, created_at
from public.cleaners
where status = 'active'
  and is_public = true
  and slug is not null;

comment on view public.public_cleaners_view is
  'Annuaire public des équipes de ménage LCD actives. Lue par le build script du site statique.';

-- ── RLS ───────────────────────────────────────────────────────────
alter table public.cleaners enable row level security;
-- Aucune policy : tout passe par service_role (serverless functions et
-- server actions admin). Identique au modèle photographers.

-- ── Table contacts_log ────────────────────────────────────────────
create table if not exists public.cleaner_contacts (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  contact_email text not null,
  contact_name text,
  message text,
  source_url text,
  created_at timestamptz not null default now()
);

create index if not exists cleaner_contacts_cleaner_idx
  on public.cleaner_contacts (cleaner_id, created_at desc);

alter table public.cleaner_contacts enable row level security;

-- ── RPCs compteurs ────────────────────────────────────────────────
create or replace function public.increment_cleaner_contacts(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.cleaners
     set contacts_count = contacts_count + 1
   where id = p_id;
$$;

revoke all on function public.increment_cleaner_contacts(uuid) from public;
revoke all on function public.increment_cleaner_contacts(uuid) from anon;
revoke all on function public.increment_cleaner_contacts(uuid) from authenticated;

create or replace function public.increment_cleaner_views(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.cleaners
     set views_count = views_count + 1
   where id = p_id;
$$;

revoke all on function public.increment_cleaner_views(uuid) from public;
revoke all on function public.increment_cleaner_views(uuid) from anon;
revoke all on function public.increment_cleaner_views(uuid) from authenticated;
