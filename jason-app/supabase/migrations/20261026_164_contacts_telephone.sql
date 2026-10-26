-- Téléphone facultatif dans la demande de devis d'une fiche (26/10/2026,
-- Jason : « pouvoir mettre le numéro de téléphone pour faciliter les échanges,
-- mais en facultatif »). Supprimé avec la demande (purge des 3 ans).
alter table public.photographer_contacts add column if not exists contact_phone text;
alter table public.cleaner_contacts add column if not exists contact_phone text;
