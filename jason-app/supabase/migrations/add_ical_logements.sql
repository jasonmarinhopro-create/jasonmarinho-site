-- Migration : ajout des liens iCal de synchronisation par logement
-- Permet d'importer les réservations Airbnb/Booking/VRBO dans le calendrier intégré

ALTER TABLE logements
  ADD COLUMN IF NOT EXISTS ical_airbnb  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ical_booking TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ical_vrbo    TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ical_autre   TEXT DEFAULT NULL;

COMMENT ON COLUMN logements.ical_airbnb  IS 'URL iCal Airbnb (ex: https://www.airbnb.fr/calendar/ical/XXX.ics)';
COMMENT ON COLUMN logements.ical_booking IS 'URL iCal Booking.com';
COMMENT ON COLUMN logements.ical_vrbo    IS 'URL iCal Vrbo / Abritel';
COMMENT ON COLUMN logements.ical_autre   IS 'URL iCal autre plateforme';
