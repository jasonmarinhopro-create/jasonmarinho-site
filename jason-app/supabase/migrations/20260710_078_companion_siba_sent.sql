-- Lien de check-in partageable au groupe : chaque voyageur peut ouvrir le
-- même lien et s'ajouter lui-même (mode « companion »). L'envoi SIBA devient
-- donc incrémental : on trace l'envoi PAR personne pour déclarer aussi les
-- retardataires (un ami qui remplit sa part après le premier envoi).

alter table checkin_companions
  add column if not exists siba_sent_at timestamptz default null;
