-- IBAN par logement, pour la conciergerie : quand un logement est géré
-- pour le compte d'un propriétaire tiers (cf. proprietaire_nom/email/
-- telephone, migration existante), l'argent du locataire doit aller sur
-- le compte du PROPRIÉTAIRE, pas sur celui de l'utilisateur connecté
-- (profiles.iban, jusqu'ici la seule source utilisée sur /sign/[token]).
alter table public.logements
  add column if not exists iban text,
  add column if not exists bic text;

comment on column public.logements.iban is
  'IBAN du propriétaire pour ce logement (conciergerie) — prioritaire sur profiles.iban pour les paiements par virement sur /sign/[token] quand renseigné.';
comment on column public.logements.bic is
  'BIC associé à logements.iban.';
