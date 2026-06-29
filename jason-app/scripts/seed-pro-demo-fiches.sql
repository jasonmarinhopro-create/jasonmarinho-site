-- ════════════════════════════════════════════════════════════════════
-- Seed 2 fiches demo (photographe + ménage) rattachées au compte admin
-- djason.marinho@gmail.com — bypass complet du flow Stripe.
--
-- USAGE :
--   1. Ouvre Supabase Dashboard → ton projet
--   2. Menu de gauche → "SQL Editor"
--   3. Colle TOUT ce fichier dans une nouvelle query
--   4. Clique "Run" (ou Cmd+Enter)
--   5. Va dans Vercel Dashboard → projet site statique (jasonmarinho-site,
--      pas jason-app) → onglet "Deployments" → bouton "Redeploy" pour
--      que le build script regénère les pages /photographes/* et /menage/*
--
-- Idempotent : si une fiche existe déjà pour ce compte, l'INSERT est
-- ignoré (ON CONFLICT DO NOTHING sur user_id).
-- ════════════════════════════════════════════════════════════════════

do $$
declare
  jason_uid uuid;
begin
  -- Récupère l'user_id de djason.marinho@gmail.com depuis auth.users
  select id into jason_uid
  from auth.users
  where lower(email) = 'djason.marinho@gmail.com'
  limit 1;

  if jason_uid is null then
    raise exception 'Compte djason.marinho@gmail.com introuvable dans auth.users';
  end if;

  raise notice 'Jason user_id = %', jason_uid;

  -- ── Fiche photographe ──────────────────────────────────────────────
  insert into public.photographers (
    user_id, email, full_name, ville, zone_couverte, bio,
    specialite, tarif_min, tarif_max, portfolio_url, instagram_handle,
    slug, tier, status, is_public, validated_at
  )
  select
    jason_uid,
    'djason.marinho@gmail.com',
    'Camille Sénéchal',
    'Lyon',
    'Lyon + 60 km · Région Auvergne-Rhône-Alpes',
    'Photographe spécialisée en intérieurs LCD depuis 7 ans. Lumière naturelle, mise en scène discrète, angles pensés pour l''algorithme Airbnb. J''accompagne des hôtes du studio cosy au gîte de charme. Livraison sous 5 jours, format adapté à toutes les plateformes (Airbnb, Booking, site direct).',
    'Intérieurs LCD + drone extérieur',
    350,
    800,
    'https://www.instagram.com/camille.lcd.photo',
    'camille.lcd.photo',
    'camille-senechal-lyon',
    'fondateur',
    'active',
    true,
    now()
  where not exists (
    select 1 from public.photographers where user_id = jason_uid
  );

  -- ── Fiche équipe ménage ────────────────────────────────────────────
  insert into public.cleaners (
    user_id, email, full_name, pseudo, ville, zone_couverte, bio,
    instagram_handle,
    tarif_forfait_min, tarif_forfait_max, tarif_heure,
    prestations, equipe_type, logements_geres, delai_reservation,
    langues, assurance_rc_pro,
    slug, tier, status, is_public, validated_at
  )
  select
    jason_uid,
    'djason.marinho@gmail.com',
    'Sophie Martin',
    'Éclat Ménage Bordeaux',
    'Bordeaux',
    'Bordeaux + 30 km · Bordeaux Métropole, Bassin d''Arcachon',
    'Équipe de 4 personnes spécialisée turnover Airbnb depuis 5 ans. Délai express jour-même possible, gestion complète du linge, photo état des lieux à chaque passage. Couverte RC pro, SIRET vérifiable. On s''occupe de tout : ménage, linge, réapprovisionnement, alerte si problème.',
    'eclat.menage.bordeaux',
    65,
    180,
    24,
    array['menage_standard', 'gestion_linge', 'repassage', 'reapprovisionnement', 'etat_des_lieux_photo'],
    'equipe_3_5',
    18,
    'jour_meme',
    array['fr', 'en', 'es'],
    true,
    'eclat-menage-bordeaux',
    'fondateur',
    'active',
    true,
    now()
  where not exists (
    select 1 from public.cleaners where user_id = jason_uid
  );

  raise notice '✅ Fiches seedées (ou déjà présentes). Pense au redeploy Vercel pour générer les pages publiques.';
end $$;

-- Verification : retourne les 2 fiches créées
select 'photographer' as type, id, full_name, ville, slug, status, is_public, tier
from public.photographers
where lower(email) = 'djason.marinho@gmail.com'
union all
select 'cleaner', id, coalesce(pseudo, full_name), ville, slug, status, is_public, tier
from public.cleaners
where lower(email) = 'djason.marinho@gmail.com';
