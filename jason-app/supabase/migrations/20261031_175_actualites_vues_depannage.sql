-- Actualités du dépannage (31/10/2026, étape 4) : point « du neuf » propre à
-- l'espace dépannage, comme photographe et ménage (migration 147).
alter table public.profiles add column if not exists last_seen_actualites_depannage_at timestamptz;

-- Menu : même fonction que la migration 171, avec la date du dépannage
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
        select jsonb_build_object('photographer', last_seen_actualites_photo_at, 'cleaner', last_seen_actualites_menage_at, 'depannage', last_seen_actualites_depannage_at)
          from profiles where id = uid
      )
    );
  end if;

  return result;
end;
$function$;
