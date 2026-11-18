-- Colonnes protégées (18/11/2026, audit de sécurité).
--
-- Faille corrigée : les politiques RLS « mise à jour de sa propre ligne » de
-- profiles, photographers, cleaners et depannage_pros laissaient un membre
-- connecté modifier TOUTES les colonnes de sa ligne via l'API Supabase (clé
-- publique + sa session), sans passer par l'app : role = 'admin' (puis accès
-- admin à toutes les données par is_admin()), plan payant gratuit, fiche pro
-- validée et publiée sans paiement, abonnement Stripe, compteurs, etc.
--
-- Le code de l'app n'écrit jamais ces colonnes avec le client de l'utilisateur
-- (toujours le service role, les fonctions SECURITY DEFINER ou un admin) :
-- vérifié le 18/11/2026 ligne par ligne. Le garde-fou ne change donc rien pour
-- l'app ; il ne vise que les appels directs.
--
-- Fonctionnement : déclencheurs BEFORE UPDATE (et BEFORE INSERT pour profiles).
-- Si l'appel vient d'un membre ordinaire (rôle Postgres authenticated ou anon)
-- qui n'est pas admin, les colonnes listées gardent leur ancienne valeur
-- (UPDATE) ou prennent la valeur de base (INSERT de profiles). Aucune erreur : les écritures légitimes des mêmes
-- requêtes (nom, IBAN, adresse…) passent normalement.
-- Non concernés : service role, fonctions SECURITY DEFINER (handle_new_user,
-- issue_next_invoice_number…), migrations, comptes admin.
-- Rejouable (create or replace, drop trigger if exists).

create or replace function public.jm_guard_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  col text;
  n jsonb;
  o jsonb;
begin
  -- Seuls les appels d'un membre via l'API sont filtrés
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if coalesce((select public.is_admin()), false) then
    return new;
  end if;

  -- Déclencheur BEFORE UPDATE seulement : la colonne garde son ancienne valeur
  n := to_jsonb(new);
  o := to_jsonb(old);
  foreach col in array tg_argv loop
    if o ? col then
      n := jsonb_set(n, array[col], o -> col);
    end if;
  end loop;
  new := jsonb_populate_record(new, n);
  return new;
end;
$$;

-- INSERT sur profiles par un membre (cas rare : la ligne est créée par
-- handle_new_user à l'inscription) : rôle et formule de base, rien d'autre.
create or replace function public.jm_guard_profile_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if coalesce((select public.is_admin()), false) then
    return new;
  end if;
  new.role := 'user';
  new.plan := 'decouverte';
  new.driing_status := 'none';
  new.invoice_counter := 0;
  new.stripe_onboarding_complete := false;
  new.stripe_account_id := null;
  new.stripe_customer_id := null;
  new.stripe_subscription_id := null;
  new.stripe_subscription_status := null;
  new.stripe_price_id := null;
  new.is_contributor := false;
  new.admin_notes := null;
  new.avis_moyen := null;
  return new;
end;
$$;

drop trigger if exists jm_guard_profiles_update on public.profiles;
create trigger jm_guard_profiles_update
  before update on public.profiles
  for each row execute function public.jm_guard_columns(
    'role', 'plan', 'driing_status',
    'stripe_account_id', 'stripe_onboarding_complete', 'stripe_customer_id',
    'stripe_subscription_id', 'stripe_subscription_status', 'stripe_price_id',
    'is_contributor', 'admin_notes', 'invoice_counter', 'avis_moyen',
    'acquisition', 'created_at'
  );

drop trigger if exists jm_guard_profiles_insert on public.profiles;
create trigger jm_guard_profiles_insert
  before insert on public.profiles
  for each row execute function public.jm_guard_profile_insert();

-- Fiches des pros : statut, publication, formule, validation, abonnement,
-- compteurs. Le contenu de la fiche reste modifiable (l'app passe de toute
-- façon par le service role).
drop trigger if exists jm_guard_photographers_update on public.photographers;
create trigger jm_guard_photographers_update
  before update on public.photographers
  for each row execute function public.jm_guard_columns(
    'user_id', 'status', 'is_public', 'tier', 'slug', 'validated_at', 'validated_by',
    'stripe_customer_id', 'stripe_subscription_id', 'stripe_subscription_status',
    'views_count', 'contacts_count', 'instagram_clicks_count', 'portfolio_clicks_count', 'created_at'
  );

drop trigger if exists jm_guard_cleaners_update on public.cleaners;
create trigger jm_guard_cleaners_update
  before update on public.cleaners
  for each row execute function public.jm_guard_columns(
    'user_id', 'status', 'is_public', 'tier', 'slug', 'validated_at', 'validated_by',
    'stripe_customer_id', 'stripe_subscription_id', 'stripe_subscription_status',
    'views_count', 'contacts_count', 'instagram_clicks_count', 'site_clicks_count', 'created_at'
  );

drop trigger if exists jm_guard_depannage_update on public.depannage_pros;
create trigger jm_guard_depannage_update
  before update on public.depannage_pros
  for each row execute function public.jm_guard_columns(
    'user_id', 'status', 'is_public', 'tier', 'slug', 'validated_at', 'validated_by',
    'stripe_customer_id', 'stripe_subscription_id', 'stripe_subscription_status',
    'views_count', 'contacts_count', 'instagram_clicks_count', 'site_clicks_count', 'created_at'
  );

-- increment_copy_count (signalé par Supabase) reste appelable : il est appelé
-- depuis le navigateur à chaque copie d'un modèle, risque limité à un compteur.
