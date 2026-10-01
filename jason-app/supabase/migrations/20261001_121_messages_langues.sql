-- Modèles de messages : version anglaise et portugaise de « ma version »
-- (01/10/2026, demande de Jason : « mettre la possibilité d'une autre langue »).
-- Le français reste dans content. Vide = on retombe sur la traduction du
-- modèle (anglais) ou rien (portugais).
alter table public.user_template_customizations
  add column if not exists content_en text,
  add column if not exists content_pt text;
