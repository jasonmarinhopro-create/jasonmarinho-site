-- Accueil hôte en une seule requête (24/10/2026, plan de performance).
-- Avant : une vingtaine de requêtes à chaque ouverture de l'Accueil (contrats,
-- logements, revenus, séjours, iCal, formations, Entre Hôtes, ménages du
-- jour…), qui attendaient toutes ensemble quand la machine Supabase gratuite
-- manquait de mémoire. Les lignes renvoyées ont les mêmes colonnes que les
-- anciennes requêtes ; les filtres fins restent dans le code de la page.
--
-- SECURITY INVOKER : droits du compte connecté, chaque lecture reste filtrée
-- par les politiques RLS (aucun droit nouveau). Réservée aux comptes connectés.
create or replace function public.home_state(p_today date, p_ca_start date, p_year_start date, p_year_end date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  posts jsonb;
begin
  if v_uid is null then
    return null;
  end if;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.last_reply_at desc nulls last, p.created_at desc), '[]'::jsonb) into posts
    from (select id, author_id, category, title, reply_count, vote_count, last_reply_at, created_at
            from chez_nous_posts order by last_reply_at desc nulls last, created_at desc limit 3) p;

  return jsonb_build_object(
    -- Tous les contrats (le ménage garde ceux sans statut, l'Accueil les retire)
    'contracts', coalesce((select jsonb_agg(to_jsonb(c) order by c.date_arrivee) from (
      select id, logement_nom, date_arrivee, date_depart, statut, checklist_status, montant_loyer, stripe_payment_status,
             stripe_payment_enabled, stripe_deposit_status, locataire_prenom, locataire_nom, sejour_id
        from contracts where user_id = v_uid) c), '[]'::jsonb),
    'logements', coalesce((select jsonb_agg(to_jsonb(l)) from (
      select id, nom, adresse, menage_duree_min, menage_heure_defaut, menage_notes, contact_menage_nom, contact_menage_tel,
             frais_menage, ical_airbnb, ical_booking, ical_vrbo, ical_autre, prix_airbnb_nuit, prix_booking_nuit, prix_direct_nuit
        from logements where user_id = v_uid) l), '[]'::jsonb),
    'revenus_entries', coalesce((select jsonb_agg(to_jsonb(r)) from (
      select id, montant, date_paiement, type_paiement, logement_nom from revenus_entries
       where user_id = v_uid and date_paiement >= p_ca_start and date_paiement < p_year_end) r), '[]'::jsonb),
    'revenus_objectif', (select to_jsonb(o) from (
      select objectif_ca_annuel, annee from revenus_objectifs where user_id = v_uid limit 1) o),
    'memberships', coalesce((select jsonb_agg(jsonb_build_object('group_id', group_id))
      from user_community_memberships where user_id = v_uid and status = 'joined'), '[]'::jsonb),
    'user_formations', coalesce((select jsonb_agg(jsonb_build_object(
        'formation_id', uf.formation_id, 'progress', uf.progress, 'completed_lessons', uf.completed_lessons,
        'formations', (select jsonb_build_object('slug', f.slug, 'title', f.title, 'lessons_count', f.lessons_count)
                         from formations f where f.id = uf.formation_id)))
      from user_formations uf where uf.user_id = v_uid), '[]'::jsonb),
    'completion_log', coalesce((select jsonb_agg(jsonb_build_object('completed_at', x.completed_at) order by x.completed_at desc) from (
      select completed_at from user_lesson_completion_log where user_id = v_uid order by completed_at desc limit 500) x), '[]'::jsonb),
    'cn_posts', posts,
    'cn_total', (select count(*) from chez_nous_posts),
    'cn_authors', coalesce((select jsonb_agg(jsonb_build_object('id', pr.id, 'full_name', pr.full_name, 'pseudo', pr.pseudo))
      from profiles pr where pr.id in (select (e->>'author_id')::uuid from jsonb_array_elements(posts) e)), '[]'::jsonb),
    -- Séjours avec date d'arrivée (le ménage garde aussi ceux sans départ, filtrés ensuite)
    'sejours', coalesce((select jsonb_agg(to_jsonb(s) order by s.date_arrivee) from (
      select s.id, s.montant, s.date_arrivee, s.date_depart, s.logement, s.contrat_plateforme, s.commission_montant, s.voyageur_id,
             (select jsonb_build_object('prenom', v.prenom, 'nom', v.nom) from voyageurs v where v.id = s.voyageur_id) as voyageurs
        from sejours s where s.user_id = v_uid and s.annule_at is null and s.date_arrivee is not null) s), '[]'::jsonb),
    'profile_extra', (select to_jsonb(p) from (
      select inbox_airbnb_url, inbox_booking_url, inbox_vrbo_url, inbox_abritel_url, inbox_driing_url, inbox_gmb_url,
             custom_platform_links, ical_token from profiles where id = v_uid) p),
    -- Réservations iCal de l'année, plus celles en cours aujourd'hui (ménage du jour)
    'ical_events', coalesce((select jsonb_agg(to_jsonb(e) order by e.start_date) from (
      select id, feed_id, title, start_date, end_date, description from ical_events
       where user_id = v_uid and (start_date >= p_year_start or (start_date <= p_today and end_date >= p_today))) e), '[]'::jsonb),
    'declarations', coalesce((select jsonb_agg(to_jsonb(d) order by d.deadline_at) from (
      select id, voyageur_id, voyageur_nom, voyageur_nationalite, logement_nom, logement_pays, date_arrivee, deadline_at
        from guest_declarations where user_id = v_uid and statut = 'a_faire' order by deadline_at limit 20) d), '[]'::jsonb),
    'ical_feeds', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'url', url, 'name', name))
      from ical_feeds where user_id = v_uid), '[]'::jsonb),
    'menage_completions', coalesce((select jsonb_agg(jsonb_build_object('logement_nom', logement_nom, 'date', date))
      from menage_completions where host_user_id = v_uid and date = p_today), '[]'::jsonb),
    'menage_events', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'date', date, 'start_time', start_time,
        'end_time', end_time, 'description', description))
      from calendar_events where user_id = v_uid and category = 'menage' and date = p_today), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.home_state(date, date, date, date) from public, anon;
grant execute on function public.home_state(date, date, date, date) to authenticated;
