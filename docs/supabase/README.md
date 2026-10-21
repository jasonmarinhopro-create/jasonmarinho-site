# Supabase — repères du projet

Projet : **Jason Marinho Site** (`xwucstjxoehyjnlrzrky`).
Schéma applicatif exposé : `public`. Les 99 tables actuellement présentes y ont RLS activé.

## Organisation

Les tables restent dans `public` tant que l’application les appelle via supabase-js/PostgREST ou GraphQL. Les déplacer vers d’autres schémas casserait ces intégrations et ne constitue pas une simple opération de rangement.

Pour retrouver les objets, classer les changements par domaine fonctionnel dans le nom des migrations et dans les commentaires SQL (ex. `pro_*` pour l’espace professionnel, `chez_nous_*` pour la communauté). Une migration doit porter une seule évolution cohérente; toute nouvelle table doit avoir un commentaire qui décrit sa responsabilité et ses données principales.

## Règles d’accès Data API

Le 30 octobre 2026, Supabase retire l’exposition automatique des nouvelles tables de `public`. La migration `20261021_141_data_api_opt_in.sql` aligne les nouveaux objets sur ce comportement et conserve les droits des tables existantes.

Lorsqu’une migration crée une table destinée à l’API, elle doit, dans la même migration :

1. activer RLS;
2. créer uniquement les politiques nécessaires;
3. accorder explicitement à chaque rôle les opérations dont l’application a besoin.

Exemple à adapter au cas d’usage (ne pas copier aveuglément les droits CRUD pour tous les rôles) :

```sql
create table public.exemple (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  valeur text not null
);

comment on table public.exemple is 'Décrit ici les données métier stockées.';
alter table public.exemple enable row level security;

grant select, insert, update, delete on table public.exemple to authenticated;
create policy "Chaque personne gère ses lignes"
  on public.exemple
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

N’ajouter `anon` que si l’accès anonyme est réellement requis, et limiter alors les opérations accordées. Ajouter `service_role` uniquement si le chemin serveur concerné le nécessite. Pour les colonnes `serial`/identity, vérifier aussi les droits requis sur la séquence associée. Un GRANT autorise l’accès à l’objet; RLS restreint ensuite les lignes. Les deux niveaux sont nécessaires.

## Migrations et déploiement

- Ajouter les changements dans `jason-app/supabase/migrations/` avec un numéro/date unique et un nom métier lisible.
- Garder chaque migration additive/rejouable quand c’est possible; ne pas compter sur `CREATE TABLE IF NOT EXISTS` pour ajouter des colonnes à une table existante.
- Le workflow GitHub applique les migrations après fusion dans `main` si `SUPABASE_DB_URL` est configuré. Une migration de schéma doit être relue avant fusion.
- Le contrôle initial d’exposition montre 99 tables en RLS, 95 tables avec des privilèges SELECT/INSERT pour `anon` et `authenticated`, et 4 sans ces privilèges. Le GRANT seul ne prouve pas que les lignes sont lisibles : les politiques RLS déterminent l’accès effectif. Ne pas révoquer ou élargir en masse les privilèges des tables actuelles sans audit de leurs politiques et usages.
