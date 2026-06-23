-- ════════════════════════════════════════════════════════════════════
-- Annuaire photographes LCD — table + view publique + RLS
-- ════════════════════════════════════════════════════════════════════
-- Nouveau produit : annuaire de photographes pro spécialisés LCD, modèle
-- subscription annuelle Stripe (Fondateur 39,98 €/an × 20 places ; puis
-- Standard 79,98 €/an).
--
-- Flow d'inscription :
--  1. Photographe remplit form public /annuaires/photographes/inscription
--     → row créée avec status='pending_validation', is_public=false
--  2. Jason valide depuis /dashboard/admin/photographes :
--      - Approuve → status='approved_pending_payment', email envoyé avec
--        lien Stripe Checkout
--      - Refuse → status='rejected', email d'excuse, raison stockée
--  3. Photographe paie via Stripe Checkout → webhook
--     customer.subscription.created → status='active', is_public=true,
--     slug généré, tier (fondateur si <20 actifs sinon standard)
--  4. Profil visible dans /annuaires/photographes/annuaire
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.photographers (
  id uuid primary key default gen_random_uuid(),

  -- ── Identité publique ────────────────────────────────────────────
  email text not null unique,
  full_name text not null,
  pseudo text,                            -- optionnel, alias public si l'hôte ne veut pas son nom
  ville text not null,                    -- ville principale d'activité
  zone_couverte text,                     -- ex: "Lyon + 50km", "Île-de-France"
  bio text,                               -- 200-500 chars, présentation libre
  specialite text,                        -- ex: "Intérieurs LCD", "Drone + intérieurs"
  tarif_min integer,                      -- prix de base €
  tarif_max integer,                      -- prix haut de gamme €
  portfolio_url text not null,            -- site web OU Instagram
  instagram_handle text,                  -- @marie.photo (sans https)
  telephone text,                         -- optionnel, contact direct

  -- ── URL publique ─────────────────────────────────────────────────
  slug text unique,                       -- ex: marie-dupont-lyon, généré à l'activation

  -- ── Stripe Subscription ──────────────────────────────────────────
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,        -- active, past_due, canceled, etc.
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

create index if not exists photographers_status_idx
  on public.photographers (status);

create index if not exists photographers_is_public_idx
  on public.photographers (is_public)
  where is_public = true;

create index if not exists photographers_slug_idx
  on public.photographers (slug)
  where slug is not null;

create index if not exists photographers_ville_idx
  on public.photographers (ville)
  where is_public = true;

create index if not exists photographers_tier_active_count_idx
  on public.photographers (tier)
  where status = 'active';

-- ── View publique : annuaire ───────────────────────────────────────
-- Expose UNIQUEMENT les profils status='active' AND is_public=true.
-- Lue par le build script /scripts/build-photographers.mjs pour générer
-- les pages statiques (annuaire + fiche par slug).
drop view if exists public.public_photographers_view;
create view public.public_photographers_view as
select
  id, slug, full_name, pseudo, ville, zone_couverte, bio, specialite,
  tarif_min, tarif_max, portfolio_url, instagram_handle, telephone,
  tier, views_count, contacts_count, created_at
from public.photographers
where status = 'active'
  and is_public = true
  and slug is not null;

comment on view public.public_photographers_view is
  'Annuaire public des photographes LCD actifs. Lue par le build script du site statique pour générer pages SEO friendly.';

-- ── RLS ───────────────────────────────────────────────────────────
-- Service role bypass (utilisé par /api/photographer/signup serverless
-- et par les actions admin). Aucun accès direct utilisateur authentifié
-- pour V1.
alter table public.photographers enable row level security;

-- Pas de policy SELECT/INSERT/UPDATE/DELETE pour authenticated users :
-- toutes les opérations passent par service_role (serverless functions
-- ou server actions admin). Garantit la qualité de la donnée + audit.

-- Table contacts_log : trace les contacts hôte → photographe (vu sur
-- la fiche publique). Utilisé pour incrémenter contacts_count et
-- alimenter les stats dashboard photographe.
create table if not exists public.photographer_contacts (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references public.photographers(id) on delete cascade,
  contact_email text not null,
  contact_name text,
  message text,
  source_url text,                        -- d'où venait l'hôte (UTM/referer)
  created_at timestamptz not null default now()
);

create index if not exists photographer_contacts_photographer_idx
  on public.photographer_contacts (photographer_id, created_at desc);

alter table public.photographer_contacts enable row level security;
