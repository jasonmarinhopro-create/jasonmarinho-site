-- Avertissements du Security Advisor de Supabase (relevé du 30/09/2026).
-- Chaque bloc tolère l'absence de la fonction ou de la politique.

-- 1. Numéro de facture : la fonction acceptait n'importe quel p_user_id et
--    était appelable sans connexion. Quelqu'un pouvait faire avancer le
--    compteur d'un autre hôte et créer des trous dans sa numérotation (qui
--    doit rester continue). Un utilisateur connecté ne peut plus toucher
--    qu'à son propre compteur ; le service role (serveur) reste libre.
create or replace function public.issue_next_invoice_number(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_counter integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' and auth.uid() is distinct from p_user_id then
    raise exception 'Non autorisé';
  end if;

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
revoke execute on function public.issue_next_invoice_number(uuid) from public, anon;
grant execute on function public.issue_next_invoice_number(uuid) to authenticated, service_role;

-- 2. Fonctions de déclencheurs : jamais appelées directement. Retirer le
--    droit d'exécution n'empêche pas les déclencheurs de fonctionner.
do $$ begin revoke execute on function public.chez_nous_notify_mention() from public, anon, authenticated; exception when undefined_function then null; end $$;
do $$ begin revoke execute on function public.chez_nous_notify_new_post() from public, anon, authenticated; exception when undefined_function then null; end $$;
do $$ begin revoke execute on function public.chez_nous_notify_reply() from public, anon, authenticated; exception when undefined_function then null; end $$;
do $$ begin revoke execute on function public.chez_nous_update_post_stats() from public, anon, authenticated; exception when undefined_function then null; end $$;
do $$ begin revoke execute on function public.chez_nous_update_post_votes() from public, anon, authenticated; exception when undefined_function then null; end $$;
do $$ begin revoke execute on function public.handle_new_user() from public, anon, authenticated; exception when undefined_function then null; end $$;

-- 3. Votes sur la feuille de route : appelés par /api/ideas/vote (service
--    role, limité en débit). Plus appelables directement.
do $$ begin
  revoke execute on function public.increment_idea_votes(uuid) from public, anon, authenticated;
  grant execute on function public.increment_idea_votes(uuid) to service_role;
exception when undefined_function then null; end $$;

-- 4. Compteur de copies des modèles de messages : appelé par un membre
--    connecté (GabaritsClient.tsx). Retiré aux visiteurs non connectés.
do $$ begin
  revoke execute on function public.increment_copy_count(uuid) from public, anon;
  grant execute on function public.increment_copy_count(uuid) to authenticated, service_role;
exception when undefined_function then null; end $$;

-- 5. Signature de contrat : l'app signe par /api/contracts/sign (service
--    role, limité en débit). L'ancienne fonction n'est plus utilisée.
do $$ begin
  revoke execute on function public.sign_contract(uuid, text, text, text, text) from public, anon, authenticated;
  grant execute on function public.sign_contract(uuid, text, text, text, text) to service_role;
exception when undefined_function then null; end $$;

-- 6. search_path figé (protection contre le détournement de fonctions)
do $$ begin alter function public.pro_clients_touch_updated_at() set search_path = public; exception when undefined_function then null; end $$;

-- 7. Buckets publics : les photos s'affichent par leur adresse publique sans
--    aucune politique. Ces politiques permettaient en plus de LISTER tous
--    les fichiers du bucket. Aucun code de l'app ne liste ces buckets.
drop policy if exists logement_photos_public_read on storage.objects;
drop policy if exists pro_portfolio_public_read on storage.objects;
drop policy if exists social_post_media_public_read on storage.objects;

-- Conservé volontairement : public.is_admin() (utilisée par les politiques
-- RLS, qui s'exécutent avec le rôle de l'appelant : lui retirer le droit
-- casserait les lectures).
