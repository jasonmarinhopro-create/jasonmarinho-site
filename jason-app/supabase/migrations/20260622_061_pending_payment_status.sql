-- ════════════════════════════════════════════════════════════════════
-- Ajoute le statut 'pending_payment' aux tables photographers + cleaners
-- ════════════════════════════════════════════════════════════════════
-- Changement de flow : on supprime la validation manuelle pré-paiement.
-- Le pro remplit le formulaire et est envoyé directement vers Stripe
-- Checkout. À la confirmation Stripe (webhook), sa fiche est publiée.
-- Jason garde un bouton « masquer/résilier » dans l'admin pour la
-- post-modération.
--
-- Nouveau status 'pending_payment' : row insérée par le form serverless,
-- en attente du webhook customer.subscription.created.
-- L'ancien status 'pending_validation' reste valide (rétro-compat) mais
-- ne sera plus utilisé pour les nouvelles inscriptions.
-- ════════════════════════════════════════════════════════════════════

alter table public.photographers
  drop constraint if exists photographers_status_check;
alter table public.photographers
  add constraint photographers_status_check
    check (status in ('pending_validation', 'approved_pending_payment', 'pending_payment', 'active', 'rejected', 'cancelled', 'hidden'));

alter table public.cleaners
  drop constraint if exists cleaners_status_check;
alter table public.cleaners
  add constraint cleaners_status_check
    check (status in ('pending_validation', 'approved_pending_payment', 'pending_payment', 'active', 'rejected', 'cancelled', 'hidden'));

-- 'hidden' : utilisé par l'admin pour retirer un profil de l'annuaire
-- public sans le supprimer ni résilier la subscription Stripe (ex: cas
-- limite à investiguer, profil temporairement à problème).
