-- Stocke en DB la date de dernière visite des sections Actualités et
-- Nouveautés. Avant cette migration, l'état "lu/non lu" vivait en
-- localStorage donc changeait à chaque navigateur ; désormais il est
-- attaché au compte utilisateur et suit l'utilisateur d'un device à l'autre.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_actualites_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_nouveautes_at TIMESTAMPTZ;
