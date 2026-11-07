-- Groupes Facebook pour les pros (07/11/2026, Jason : « une nouvelle partie dans
-- chaque annuaire pour les aider à faire de la prospection sur Facebook, comme
-- avec les hôtes trouver des voyageurs, là c'est trouver des clients »).
-- La table community_groups sert déjà la page « Trouver des voyageurs » des
-- hôtes ; chaque groupe dit maintenant à qui il s'adresse :
--   hote        : page Trouver des voyageurs (hôtes)
--   photographe, menage, depannage : page Trouver des clients du métier
--   recrutement : groupes où Jason fait connaître l'annuaire aux pros (admin)
-- Rejouable.

alter table public.community_groups
  add column if not exists audiences text[] not null default '{hote}';

create index if not exists community_groups_audiences_idx
  on public.community_groups using gin (audiences);

-- Groupes d'hôtes et de conciergeries déjà présents, utiles aussi aux pros
update public.community_groups
   set audiences = array(select distinct unnest(audiences || '{photographe,menage,depannage}'::text[]))
 where url in (
   'https://www.facebook.com/groups/359389397873531/',   -- Le Cercle de la Location Courte Durée
   'https://www.facebook.com/groups/153988714309295/',   -- Réseautage Airbnb, Loueur, Conciergerie, Investisseur
   'https://www.facebook.com/groups/198583241279005/',   -- Location Courte Durée
   'https://www.facebook.com/groups/trouverconciergerie/' -- Trouver une conciergerie
 );

-- Nouveaux groupes (liste de Jason du 07/11/2026)
insert into public.community_groups (name, description, platform, url, members_count, category, tag, sort_order, audiences)
select v.name, v.description, 'facebook', v.url, 0, v.category, v.tag, v.sort_order, v.audiences
  from (values
    ('Services pour propriétaires Airbnb',
     'Groupe consacré aux services pour les propriétaires Airbnb : présente ton activité et réponds aux propriétaires qui cherchent un prestataire.',
     'https://www.facebook.com/groups/603267507543329/', 'Propriétaires et conciergeries', 'Hôtes LCD', 10,
     '{photographe,menage,depannage}'::text[]),
    ('Je cherche un(e) photographe (01, 38, 42, 43, 69, 73, 74)',
     'Des particuliers et des pros y cherchent un photographe dans l''Ain, l''Isère, la Loire, la Haute-Loire, le Rhône, la Savoie et la Haute-Savoie.',
     'https://www.facebook.com/groups/567882682619964/', 'Demandes de photographes', 'Alpes, Auvergne', 20,
     '{photographe}'::text[]),
    ('Airbnb Promotion & Airbnb Property Management',
     'Groupe d''hôtes et de gestionnaires Airbnb autour de la promotion des annonces et de la gestion des logements.',
     'https://www.facebook.com/groups/airbnbproperty/', 'Propriétaires et conciergeries', 'Hôtes LCD', 30,
     '{photographe,menage,depannage}'::text[]),
    ('Réussir dans la conciergerie Airbnb',
     'Groupe de conciergeries Airbnb : des clients réguliers possibles pour le ménage, les photos et l''entretien des logements qu''elles gèrent.',
     'https://www.facebook.com/groups/1539542343432093/', 'Propriétaires et conciergeries', 'Conciergeries', 40,
     '{photographe,menage,depannage}'::text[]),
    ('Conciergeries Airbnb Île-de-France',
     'Conciergeries d''Île-de-France : des clients possibles pour le ménage, les photos et les dépannages à Paris et autour.',
     'https://www.facebook.com/groups/577197391423258/', 'Propriétaires et conciergeries', 'Conciergeries, Île-de-France', 50,
     '{photographe,menage,depannage}'::text[]),
    ('La Photographie Sous Toutes Ses Formes',
     'Photographes amateurs et passionnés : pour faire connaître l''annuaire des photographes.',
     'https://www.facebook.com/groups/photographamateur/', 'Recruter des photographes', 'Photographes', 10,
     '{recrutement}'::text[])
  ) as v(name, description, url, category, tag, sort_order, audiences)
 where not exists (select 1 from public.community_groups g where g.url = v.url);
