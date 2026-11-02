-- Charges récurrentes (02/11/2026, demande d'une hôte : « assurance, crédit,
-- taxe foncière qui se reconduisent automatiquement ») : une charge saisie
-- une fois donne une échéance par mois, trimestre ou an depuis date_charge,
-- jusqu'à date_fin si elle est renseignée (calcul dans lib/finances/engine.ts).
alter table public.revenus_charges add column if not exists frequence text;
alter table public.revenus_charges add column if not exists date_fin date;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'revenus_charges_frequence_check') then
    alter table public.revenus_charges add constraint revenus_charges_frequence_check
      check (frequence is null or frequence in ('mensuelle', 'trimestrielle', 'annuelle'));
  end if;
end $$;

-- Catégorie « Crédit (intérêts) » : intérêts et assurance de l'emprunt
alter table revenus_charges drop constraint if exists revenus_charges_categorie_check;
alter table revenus_charges add constraint revenus_charges_categorie_check
  check (categorie in (
    'menage', 'energie', 'commissions_plateforme', 'taxe_fonciere', 'taxe_sejour',
    'assurance', 'credit', 'travaux', 'equipement', 'abonnement', 'comptabilite',
    'banque', 'amortissement', 'autre'
  ));
