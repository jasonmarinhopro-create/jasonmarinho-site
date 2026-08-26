-- Suivi manuel "j'ai demandé l'indexation à Google" par page — l'admin
-- clique "Ouvrir Search Console" (inspection_link), demande l'indexation
-- manuellement là-bas (Google n'a pas d'API d'écriture pour des pages
-- classiques), puis revient cocher "C'est fait" ici pour ne pas perdre le
-- fil de ce qui a déjà été soumis.

alter table seo_indexation_status
  add column if not exists submitted_at timestamptz default null;
