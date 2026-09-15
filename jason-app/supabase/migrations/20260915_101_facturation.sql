-- Facturation : locataire professionnel (structure + NIF) sur le contrat,
-- infos fiscales du bailleur (numéro d'entreprise + mention TVA), et
-- numérotation séquentielle des factures émises.
--
-- ⚠️ Mention TVA par défaut : "TVA non applicable, article 261 D 4° du CGI
-- (location meublée de tourisme)" — correspond à la location de meublé de
-- tourisme SANS prestations parahôtelières (pas de petit-déjeuner/ménage
-- quotidien inclus), le cas le plus courant en LCD. Si un hôte facture avec
-- TVA (para-hôtellerie, régime différent, hors France…), il doit modifier
-- cette mention dans son profil — Jason Marinho n'a pas connaissance du
-- statut fiscal exact de chaque hôte et ne peut pas le déduire.

alter table public.profiles
  add column if not exists entreprise_numero text,
  add column if not exists mention_tva text
    default 'TVA non applicable, article 261 D 4° du CGI (location meublée de tourisme)',
  add column if not exists invoice_counter integer not null default 0;

comment on column public.profiles.entreprise_numero is
  'SIRET (FR) / NIF ou NIPC (PT) du bailleur, affiché sur les factures émises.';
comment on column public.profiles.mention_tva is
  'Mention légale TVA affichée sur les factures — à adapter selon le statut fiscal réel de l''hôte (voir note migration).';
comment on column public.profiles.invoice_counter is
  'Compteur de factures émises par cet hôte, incrémenté de façon atomique pour garantir une numérotation séquentielle sans trou (obligation légale).';

-- Conciergerie : le logement peut avoir son propre numéro fiscal / mention
-- TVA (celui du PROPRIÉTAIRE réel), prioritaire sur le profil de
-- l'utilisateur connecté — même logique que iban/bic (migration 098).
alter table public.logements
  add column if not exists numero_fiscal text,
  add column if not exists mention_tva text;

comment on column public.logements.numero_fiscal is
  'Numéro fiscal du propriétaire (conciergerie) pour ce logement — prioritaire sur profiles.entreprise_numero sur les factures émises.';
comment on column public.logements.mention_tva is
  'Mention TVA du propriétaire (conciergerie) pour ce logement — prioritaire sur profiles.mention_tva.';

alter table public.contracts
  add column if not exists locataire_type text not null default 'particulier'
    check (locataire_type in ('particulier', 'professionnel')),
  add column if not exists locataire_structure text,
  add column if not exists locataire_nif text,
  -- Snapshot des infos fiscales du bailleur au moment de l'émission de la
  -- facture (comme les autres champs bailleur_*/logement_* du contrat).
  add column if not exists bailleur_numero_fiscal text,
  add column if not exists bailleur_mention_tva text,
  add column if not exists invoice_number text,
  add column if not exists invoice_issued_at timestamptz;

comment on column public.contracts.locataire_type is
  '''particulier'' ou ''professionnel'' — si professionnel, locataire_structure et locataire_nif sont utilisés sur le contrat et la facture à la place / en complément du nom du signataire.';
comment on column public.contracts.invoice_number is
  'Numéro de facture séquentiel (ex: FA2026-0007), assigné une seule fois via la fonction issue_next_invoice_number() lors de l''émission de la facture.';

-- Incrémente le compteur de factures de l'hôte de façon atomique (évite les
-- doublons/trous en cas d'appels concurrents) et retourne le nouveau numéro.
create or replace function public.issue_next_invoice_number(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_counter integer;
begin
  update public.profiles
    set invoice_counter = invoice_counter + 1
    where id = p_user_id
    returning invoice_counter into v_counter;

  if v_counter is null then
    raise exception 'Profil bailleur introuvable';
  end if;

  return 'FA' || to_char(now(), 'YYYY') || '-' || lpad(v_counter::text, 4, '0');
end;
$$;
