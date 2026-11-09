-- Conditions générales de vente du bailleur (10/11/2026, demande d'une hôte :
-- « intégrer mes CGV dans le contrat, la signature vaut acceptation »).
-- Texte saisi dans Mon compte, joint aux contrats au choix de l'hôte et figé
-- dans contracts.details.cgv au moment de l'envoi (preuve de ce qui a été signé).
-- Pas de nouvelle règle d'accès : la ligne du profil reste lisible et modifiable
-- par son seul propriétaire (politiques existantes de profiles). Rejouable.

alter table public.profiles
  add column if not exists cgv text;
