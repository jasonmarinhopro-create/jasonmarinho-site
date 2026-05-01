-- ─────────────────────────────────────────────────────────────────────
-- Migration : Chez Nous Phase 5b, Onboarding + catégorie Bienvenue
-- Date : 2026-04-26
-- ─────────────────────────────────────────────────────────────────────

-- Profil : tracker si l'utilisateur a vu le tour d'onboarding
alter table public.profiles
  add column if not exists chez_nous_onboarded_at timestamptz;

-- Étendre la contrainte de catégories pour inclure 'bienvenue'
alter table public.chez_nous_posts
  drop constraint if exists chez_nous_posts_category_check;

alter table public.chez_nous_posts
  add constraint chez_nous_posts_category_check check (category in (
    'bienvenue', 'reglementation', 'voyageurs', 'optimisation',
    'entraide', 'cas', 'autres'
  ));
