-- Check-in en ligne (inspiré Partee / SES Hospedajes / SIBA) :
-- l'hôte génère un lien public par voyageur, le voyageur remplit lui-même
-- son identité (nationalité, date de naissance, document, adresse…) avant
-- l'arrivée. Les données alimentent directement la fiche voyageur puis
-- syncDeclarations() recalcule les déclarations obligatoires (SIBA, etc.).

alter table voyageurs
  -- Token opaque du lien public /checkin/[token]. NULL = pas de lien généré.
  add column if not exists checkin_token        text        default null,
  -- Date de génération du lien (pour afficher "envoyé le…" côté hôte)
  add column if not exists checkin_sent_at      timestamptz default null,
  -- Date de complétion par le voyageur. NULL = en attente.
  add column if not exists checkin_completed_at timestamptz default null;

-- Lookup public par token (service role) — unique pour éviter toute collision.
create unique index if not exists voyageurs_checkin_token_idx
  on voyageurs(checkin_token)
  where checkin_token is not null;
