-- ════════════════════════════════════════════════════════════════════
-- Paramètres ménage par logement
-- ════════════════════════════════════════════════════════════════════
-- Ajoute 3 colonnes à logements pour permettre l'auto-planification des
-- créneaux ménage entre 2 séjours consécutifs :
--
--   menage_duree_min     : durée du ménage en minutes (défaut 180 = 3h)
--   menage_heure_defaut  : heure de début par défaut (défaut 11:00 = checkout)
--   menage_notes         : instructions spécifiques (codes, lits, linge...)
--
-- Les colonnes existantes adresse, contact_menage_nom, contact_menage_tel,
-- frais_menage sont déjà en place. On complète juste ce qui manque pour
-- générer un planning complet.
-- ════════════════════════════════════════════════════════════════════

alter table public.logements
  add column if not exists menage_duree_min int default 180,
  add column if not exists menage_heure_defaut text default '11:00',
  add column if not exists menage_notes text;

-- Validation : la durée doit être positive, l'heure doit matcher HH:MM
alter table public.logements
  drop constraint if exists logements_menage_duree_check;
alter table public.logements
  add constraint logements_menage_duree_check
    check (menage_duree_min is null or (menage_duree_min > 0 and menage_duree_min <= 1440));

alter table public.logements
  drop constraint if exists logements_menage_heure_check;
alter table public.logements
  add constraint logements_menage_heure_check
    check (menage_heure_defaut is null or menage_heure_defaut ~ '^[0-2][0-9]:[0-5][0-9]$');
