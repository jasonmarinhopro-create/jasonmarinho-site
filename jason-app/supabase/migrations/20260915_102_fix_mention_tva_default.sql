-- La migration 101 a donné à profiles.mention_tva un défaut français ("TVA
-- non applicable, article 261 D 4° du CGI") appliqué automatiquement à TOUS
-- les profils existants, y compris les hôtes portugais pour qui ce texte est
-- légalement faux (IVA obligatoire à 6% sur l'Alojamento Local, jamais "non
-- applicable"). On ne peut pas déduire le bon taux PT automatiquement (il
-- dépend de la localisation exacte : Continent/Madère/Açores), donc on vide
-- le champ pour forcer une saisie explicite, uniquement pour les profils
-- qui n'ont jamais personnalisé ce texte (encore égal au défaut FR) ET qui
-- ont au moins un logement au Portugal.

update public.profiles p
set mention_tva = null
where p.mention_tva = 'TVA non applicable, article 261 D 4° du CGI (location meublée de tourisme)'
  and exists (
    select 1 from public.logements l
    where l.user_id = p.id and l.pays = 'PT'
  );

-- Retire le défaut au niveau colonne : un profil vide doit rester vide (et
-- affiché comme "à compléter" côté UI) plutôt que d'hériter silencieusement
-- d'un texte français qui peut être faux selon le pays de l'hôte.
alter table public.profiles
  alter column mention_tva drop default;

-- Même correctif côté conciergerie (logements.mention_tva n'avait pas de
-- défaut, mais on documente pour cohérence).
comment on column public.profiles.mention_tva is
  'Mention légale TVA affichée sur les factures — pas de valeur par défaut (le taux dépend du pays/statut fiscal réel de l''hôte, jamais déductible automatiquement).';
