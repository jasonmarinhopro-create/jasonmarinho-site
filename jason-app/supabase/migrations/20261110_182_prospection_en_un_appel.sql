-- Page Admin → Prospection en un seul appel (10/11/2026, Jason : « élimine
-- toutes les requêtes inutiles »). Avant : ~25 lectures à chaque affichage et
-- après chaque action (contacts page par page, 6 compteurs, tous les envois
-- depuis le début pour les statistiques, inscriptions, montée en charge).
-- Les comptes se font ici, dans la base ; l'app reçoit un seul document.
-- Lecture seule, réservée au service role (appelée après vérification admin).
create or replace function public.outreach_admin_data(
  p_day_start timestamptz,
  p_since7 timestamptz,
  p_since30 timestamptz,
  p_wsince timestamptz,
  p_wsince3 timestamptz
) returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'stats', jsonb_build_object(
      'sent_today', (select count(*) from outreach_sends where status = 'envoye' and sent_at >= p_day_start),
      'sent7', (select count(*) from outreach_sends where status = 'envoye' and sent_at >= p_since7),
      'sent30', (select count(*) from outreach_sends where status = 'envoye' and sent_at >= p_since30),
      'errors7', (select count(*) from outreach_sends where status = 'erreur' and sent_at >= p_since7),
      'replies30', (select count(*) from outreach_contacts where replied_at >= p_since30),
      'contacted30', (select count(*) from outreach_contacts where last_contacted_at >= p_since30)
    ),
    'step_stats', coalesce((
      select jsonb_agg(jsonb_build_object('s', sequence_id, 'p', step_position, 'sent', n, 'people', people))
      from (
        select sequence_id, step_position, count(*) n, count(distinct contact_id) people
        from outreach_sends where status = 'envoye' and sequence_id is not null
        group by sequence_id, step_position
      ) x
    ), '[]'::jsonb),
    'enroll', coalesce((
      select jsonb_agg(jsonb_build_object('s', sequence_id, 'st', status, 'ns', next_step, 'n', n))
      from (
        select sequence_id, status, case when status = 'en_cours' then next_step else -1 end next_step, count(*) n
        from outreach_enrollments group by 1, 2, 3
      ) x
    ), '[]'::jsonb),
    'active', coalesce((
      select jsonb_agg(jsonb_build_array(contact_id, sequence_id))
      from outreach_enrollments where status = 'en_cours'
    ), '[]'::jsonb),
    'opens', coalesce((
      select jsonb_agg(jsonb_build_object('s', sequence_id, 'p', step_position, 'opens', opens))
      from outreach_open_stats
    ), '[]'::jsonb),
    'warm', jsonb_build_object(
      'sent', (select count(*) from outreach_sends where status = 'envoye' and sent_at >= p_wsince),
      'errors', coalesce((select jsonb_agg(error) from (select error from outreach_sends where status = 'erreur' and sent_at >= p_wsince limit 1000) e), '[]'::jsonb),
      'reasons', coalesce((select jsonb_agg(reason) from (select reason from outreach_suppressions where created_at >= p_wsince limit 1000) r), '[]'::jsonb),
      'replies', (select count(*) from outreach_contacts where replied_at >= p_wsince),
      'recent', coalesce((select jsonb_agg(sent_at) from (select sent_at from outreach_sends where status = 'envoye' and sent_at >= p_wsince3 limit 1000) d), '[]'::jsonb)
    ),
    'contacts', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.created_at desc, c.id)
      from (
        select id, audience, email, prenom, nom, entreprise, ville, departement, site_web, telephone, instagram,
               source, source_detail, stage, notes, tags, last_contacted_at, replied_at, created_at, next_action, next_action_on
        from outreach_contacts
      ) c
    ), '[]'::jsonb),
    'sends', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.sent_at desc, s.id)
      from (
        select id, contact_id, sequence_id, step_position, email, subject, status, error, sent_at
        from outreach_sends where sent_at >= p_since30
      ) s
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.outreach_admin_data(timestamptz, timestamptz, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.outreach_admin_data(timestamptz, timestamptz, timestamptz, timestamptz, timestamptz) to service_role;

-- Index utiles aux compteurs (rejouables)
create index if not exists outreach_sends_contact_idx on public.outreach_sends (contact_id);
create index if not exists outreach_contacts_replied_idx on public.outreach_contacts (replied_at) where replied_at is not null;
