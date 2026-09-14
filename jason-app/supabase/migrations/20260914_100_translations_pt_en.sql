-- Traductions PT/EN des textes libres (description du logement, conditions
-- d'annulation, règlement intérieur), écrits une seule fois par le bailleur
-- et jusqu'ici jamais traduits par le sélecteur de langue FR/PT/EN du
-- contrat (/sign/[token]). Colonnes optionnelles : si absentes, le contrat
-- retombe sur le texte français (cf. lib/contract-default-clauses.ts pour
-- les clauses par défaut, qui elles se traduisent automatiquement).
alter table public.logements
  add column if not exists description_pt text,
  add column if not exists description_en text,
  add column if not exists conditions_annulation_pt text,
  add column if not exists conditions_annulation_en text,
  add column if not exists reglement_interieur_pt text,
  add column if not exists reglement_interieur_en text;

-- Le contrat snapshot le texte du logement au moment de sa création
-- (comme logement_description/conditions_annulation/reglement_interieur
-- existants) : mêmes colonnes de traduction, remplies par ContractModal.tsx
-- depuis la fiche logement sélectionnée.
alter table public.contracts
  add column if not exists logement_description_pt text,
  add column if not exists logement_description_en text,
  add column if not exists conditions_annulation_pt text,
  add column if not exists conditions_annulation_en text,
  add column if not exists reglement_interieur_pt text,
  add column if not exists reglement_interieur_en text;
