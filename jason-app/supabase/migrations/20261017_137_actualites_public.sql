-- Public des actualités (17/10/2026) : hôtes, photographes / vidéastes, équipes
-- de ménage. Une actualité peut concerner plusieurs publics. Les actualités
-- existantes restent pour les hôtes.
alter table public.actualites
  add column if not exists audience text[] not null default array['hote']::text[];

create index if not exists actualites_audience_idx on public.actualites using gin (audience);
