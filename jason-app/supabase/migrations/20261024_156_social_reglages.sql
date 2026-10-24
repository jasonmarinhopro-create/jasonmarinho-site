-- Réglages privés de la routine « Community manager » (24/10/2026) : clé qui
-- chiffre la liste des commentaires déposée dans le dépôt public
-- (data/social/commentaires.enc). Lue seulement par la clé de service
-- (workflow « Réseaux sociaux ») : RLS active, aucune politique.
create table if not exists public.social_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.social_settings enable row level security;
