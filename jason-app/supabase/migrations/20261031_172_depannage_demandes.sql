-- Dépannage et maintenance, suite (31/10/2026) : les demandes des hôtes
-- (Trouver un pro), les villes demandées, les idées et la prospection
-- acceptent « depannage ». Rejouable.

alter table public.demandes_hotes drop constraint if exists demandes_hotes_metier_check;
alter table public.demandes_hotes add constraint demandes_hotes_metier_check check (metier = any (array['photographe', 'menage', 'depannage']));

alter table public.city_requests drop constraint if exists city_requests_metier_check;
alter table public.city_requests add constraint city_requests_metier_check check (metier = any (array['photographe', 'menage', 'depannage', 'hote']));

alter table public.roadmap_items drop constraint if exists roadmap_items_espace_check;
alter table public.roadmap_items add constraint roadmap_items_espace_check check (espace is null or espace = any (array['hote', 'photographe', 'menage', 'depannage', 'investisseur']));

alter table public.outreach_contacts drop constraint if exists outreach_contacts_audience_check;
alter table public.outreach_contacts add constraint outreach_contacts_audience_check check (audience = any (array['photographe', 'menage', 'depannage', 'hote', 'autre']));

alter table public.outreach_sequences drop constraint if exists outreach_sequences_audience_check;
alter table public.outreach_sequences add constraint outreach_sequences_audience_check check (audience = any (array['photographe', 'menage', 'depannage', 'hote', 'autre']));
