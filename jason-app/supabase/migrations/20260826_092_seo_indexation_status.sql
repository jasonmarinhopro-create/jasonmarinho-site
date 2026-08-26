-- Statut d'indexation Google réel (API Search Console) par page du sitemap
-- statique. Persisté en DB : la vérification interroge l'API Google (quota
-- limité, ~500 URLs à parcourir) une fois par jour via cron plutôt qu'à
-- chaque chargement de la page admin.

create table if not exists seo_indexation_status (
  url             text primary key,
  http_status     integer,              -- statut HTTP de la page elle-même (404 = pas encore publiée, inutile d'interroger Google)
  coverage_state  text,                 -- ex: "Submitted and indexed", "Discovered - currently not indexed"…
  verdict         text,                 -- PASS | PARTIAL | FAIL | NEUTRAL
  indexed         boolean not null default false,
  last_checked_at timestamptz,
  error           text,                 -- dernière erreur d'appel API, si échec
  created_at      timestamptz not null default now()
);

alter table seo_indexation_status enable row level security;

create policy "admin_all_seo_indexation_status" on seo_indexation_status for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
