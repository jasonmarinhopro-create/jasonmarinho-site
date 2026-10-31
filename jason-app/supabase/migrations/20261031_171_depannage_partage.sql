-- Dépannage et maintenance, suite (31/10/2026) : les tables partagées par les
-- métiers acceptent « depannage » (carnet clients, devis, profil de
-- facturation, recommandations, vues et clics par jour), compteurs de la fiche,
-- demandes non lues dans le menu.

alter table public.pro_clients drop constraint if exists pro_clients_owner_kind_check;
alter table public.pro_clients add constraint pro_clients_owner_kind_check check (owner_kind = any (array['photographer', 'cleaner', 'depannage']));

alter table public.pro_documents drop constraint if exists pro_documents_owner_kind_check;
alter table public.pro_documents add constraint pro_documents_owner_kind_check check (owner_kind = any (array['photographer', 'cleaner', 'depannage']));

alter table public.pro_billing_profiles drop constraint if exists pro_billing_profiles_owner_kind_check;
alter table public.pro_billing_profiles add constraint pro_billing_profiles_owner_kind_check check (owner_kind = any (array['photographer', 'cleaner', 'depannage']));

alter table public.pro_recommendations drop constraint if exists pro_recommendations_pro_type_check;
alter table public.pro_recommendations add constraint pro_recommendations_pro_type_check check (pro_type = any (array['photographer', 'cleaner', 'depannage']));

alter table public.pro_fiche_views_daily drop constraint if exists pro_fiche_views_daily_kind_check;
alter table public.pro_fiche_views_daily add constraint pro_fiche_views_daily_kind_check check (kind = any (array['photographer', 'cleaner', 'depannage']));

alter table public.pro_fiche_clicks_daily drop constraint if exists pro_fiche_clicks_daily_kind_check;
alter table public.pro_fiche_clicks_daily add constraint pro_fiche_clicks_daily_kind_check check (kind = any (array['photographer', 'cleaner', 'depannage']));

-- Compteurs de la fiche (mêmes fonctions que pour le ménage)
create or replace function public.increment_depannage_views(p_id uuid)
returns void language sql security definer set search_path to 'public' as $$
  update public.depannage_pros set views_count = views_count + 1 where id = p_id;
$$;

create or replace function public.increment_depannage_contacts(p_id uuid)
returns void language sql security definer set search_path to 'public' as $$
  update public.depannage_pros set contacts_count = contacts_count + 1 where id = p_id;
$$;

create or replace function public.increment_depannage_click(p_id uuid, p_kind text)
returns void language sql security definer set search_path to 'public' as $$
  update public.depannage_pros
     set site_clicks_count = site_clicks_count + (case when p_kind = 'site' then 1 else 0 end),
         instagram_clicks_count = instagram_clicks_count + (case when p_kind = 'instagram' then 1 else 0 end)
   where id = p_id and p_kind in ('site', 'instagram');
$$;

revoke all on function public.increment_depannage_views(uuid) from public, anon, authenticated;
revoke all on function public.increment_depannage_contacts(uuid) from public, anon, authenticated;
revoke all on function public.increment_depannage_click(uuid, text) from public, anon, authenticated;

-- Menu : demandes non lues de l'espace dépannage
create or replace function public.menu_state(p_onboarding boolean default false, p_pro boolean default false)
returns jsonb
language plpgsql
stable
set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  result jsonb;
  ph_id uuid;
  cl_id uuid;
  dp_id uuid;
begin
  if uid is null then
    return null;
  end if;

  result := jsonb_build_object(
    'notif_unread', (
      select count(*) from notifications
       where recipient_id = uid and read_at is null
         and (expires_at is null or expires_at > now())
    ),
    'chez_nous_unread', (
      select count(*) from chez_nous_notifications
       where recipient_id = uid and read_at is null
    ),
    'contracts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'statut', c.statut, 'date_arrivee', c.date_arrivee, 'date_depart', c.date_depart,
        'stripe_payment_enabled', c.stripe_payment_enabled, 'stripe_payment_status', c.stripe_payment_status,
        'stripe_deposit_status', c.stripe_deposit_status))
        from (select * from contracts where user_id = uid and statut is distinct from 'annule' limit 500) c
    ), '[]'::jsonb)
  );

  if p_onboarding then
    result := result || jsonb_build_object('onboarding', jsonb_build_object(
      'logement',       exists(select 1 from logements where user_id = uid),
      'sejour',         exists(select 1 from sejours where user_id = uid),
      'contrat',        exists(select 1 from contracts where user_id = uid and statut is distinct from 'annule'),
      'gbp_audit',      exists(select 1 from audit_gbp_sessions where user_id = uid),
      'chez_nous_post', exists(select 1 from chez_nous_posts where author_id = uid),
      'affiche',        exists(select 1 from affiches where user_id = uid),
      'ical_connected', exists(select 1 from ical_feeds where user_id = uid),
      'menage_shared',  exists(select 1 from profiles where id = uid and ical_token is not null)
    ));
  end if;

  if p_pro then
    select id into ph_id from photographers where user_id = uid limit 1;
    select id into cl_id from cleaners where user_id = uid limit 1;
    select id into dp_id from depannage_pros where user_id = uid limit 1;
    result := result || jsonb_build_object(
      'demandes', jsonb_build_object(
        'photographer', case when ph_id is null then 0 else (select count(*) from photographer_contacts where photographer_id = ph_id and status = 'nouvelle') end,
        'cleaner',      case when cl_id is null then 0 else (select count(*) from cleaner_contacts where cleaner_id = cl_id and status = 'nouvelle') end,
        'depannage',    case when dp_id is null then 0 else (select count(*) from depannage_contacts where depannage_id = dp_id and status = 'nouvelle') end
      ),
      'actus_seen', (
        select jsonb_build_object('photographer', last_seen_actualites_photo_at, 'cleaner', last_seen_actualites_menage_at)
          from profiles where id = uid
      )
    );
  end if;

  return result;
end;
$function$;
