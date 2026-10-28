-- Demande en plusieurs villes (29/10/2026) : l'hôte (souvent une conciergerie)
-- ajoute d'autres villes à sa demande ; une ligne par ville, liées par `groupe`.
alter table public.demandes_hotes add column if not exists groupe uuid;
create index if not exists demandes_hotes_groupe_idx on public.demandes_hotes (groupe) where groupe is not null;
