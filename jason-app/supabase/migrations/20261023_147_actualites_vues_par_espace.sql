-- Point « du neuf » sur Actualités : une date de dernière visite par espace pro
-- (23/10/2026). Avant, une seule date pour tous les espaces : ouvrir les
-- actualités des hôtes effaçait le point des espaces photographe et ménage.
alter table public.profiles add column if not exists last_seen_actualites_photo_at timestamptz;
alter table public.profiles add column if not exists last_seen_actualites_menage_at timestamptz;
