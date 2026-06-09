-- ════════════════════════════════════════════════════════════════════
-- Ajout Google My Business au widget "Mes plateformes"
-- ════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists inbox_gmb_url text;
