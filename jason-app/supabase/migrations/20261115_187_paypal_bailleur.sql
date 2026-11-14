-- Lien PayPal.me du bailleur (15/11/2026, retour d'une hôte : « si on choisit
-- PayPal, rien ne s'affiche »). Saisi dans Mon compte, Encaissements ; la page
-- du contrat signé affiche un bouton « Payer avec PayPal » avec le montant
-- rempli quand PayPal fait partie des moyens de paiement du contrat.
-- On ne garde que le nom PayPal.me (lettres et chiffres), jamais d'e-mail.
-- Mêmes règles d'accès que le reste de la ligne profiles. Rejouable.

alter table public.profiles
  add column if not exists paypal_me text;
