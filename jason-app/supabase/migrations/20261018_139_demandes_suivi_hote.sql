-- Suivi de la demande par l'hôte (18/10/2026, refonte de /trouver-un-pro) :
-- un lien secret jasonmarinho.com/ma-demande?t=<jeton> montre à l'hôte à qui sa
-- demande est partie, qui l'a prise en main et quand d'autres pros prennent le
-- relais. « J'ai trouvé mon pro » ferme la demande (plus de relance).
-- Rejouable sans casse.

alter table public.demandes_hotes add column if not exists suivi_token text;
alter table public.demandes_hotes add column if not exists host_closed_at timestamptz;

create unique index if not exists demandes_hotes_suivi_token_idx on public.demandes_hotes (suivi_token) where suivi_token is not null;
