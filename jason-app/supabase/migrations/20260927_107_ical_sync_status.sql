-- Suivi de l'état des synchronisations iCal (Airbnb, Booking, Vrbo…).
--
-- Avant : seule `last_synced` existait, mise à jour uniquement en cas de
-- succès, et la synchro ne tournait que quand l'hôte ouvrait sa page
-- Calendrier. Une URL iCal cassée (annonce supprimée, lien régénéré côté
-- plateforme) passait inaperçue : le planning ménage n'était plus à jour.
--
-- Maintenant : synchro en tâche de fond (cron quotidien + à chaque lecture du
-- flux ménage par l'agenda de l'équipe) et alerte « synchro échouée » dans
-- les notifications après 3 échecs consécutifs (lib/notifications/rules.ts).

ALTER TABLE ical_feeds ADD COLUMN IF NOT EXISTS last_sync_error      text;
ALTER TABLE ical_feeds ADD COLUMN IF NOT EXISTS last_sync_error_at   timestamptz;
ALTER TABLE ical_feeds ADD COLUMN IF NOT EXISTS consecutive_failures integer NOT NULL DEFAULT 0;

-- La synchro de fond prend les flux les plus anciens en premier.
CREATE INDEX IF NOT EXISTS ical_feeds_last_synced_idx ON ical_feeds (last_synced ASC NULLS FIRST);
