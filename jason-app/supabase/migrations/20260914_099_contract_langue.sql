-- Langue du contrat (bilingue) : le corps du contrat (/sign/[token]) est
-- désormais affiché dans la langue choisie ici + toujours en anglais en
-- complément (ex: un locataire portugais voit le contrat en portugais ET
-- en anglais, un locataire français en français ET en anglais). Choisie
-- à la création du contrat dans ContractModal.tsx.
alter table public.contracts
  add column if not exists langue text not null default 'fr'
  check (langue in ('fr', 'pt'));

comment on column public.contracts.langue is
  'Langue principale du contrat (fr ou pt) — le contrat est toujours affiché aussi en anglais en complément sur /sign/[token].';
