-- ============================================================
-- Migration : enrichissement table templates pour import gabarits
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Supprimer l'ancienne contrainte de catégorie trop restrictive
alter table public.templates
  drop constraint if exists templates_category_check;

-- 2. Ajouter les nouvelles colonnes
alter table public.templates
  add column if not exists variante    text,
  add column if not exists timing      text,
  add column if not exists corps_en    text,
  add column if not exists variables   jsonb default '[]'::jsonb,
  add column if not exists tags        jsonb default '[]'::jsonb,
  add column if not exists langues     jsonb default '["fr"]'::jsonb;

-- 3. Nouvelle contrainte avec toutes les catégories
alter table public.templates
  add constraint templates_category_check check (
    category in (
      'confirmation',
      'checkin',
      'checkout',
      'bienvenue',
      'avis',
      'probleme',
      'extra',
      'upsell',
      'securite',
      'conciergerie',
      'saisonnier',
      'airbnb',
      'autre'
    )
  );

-- 4. Index pour la recherche
create index if not exists templates_category_idx on public.templates(category);
create index if not exists templates_tags_idx on public.templates using gin(tags);
