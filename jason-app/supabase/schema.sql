-- ============================================
-- SCHEMA, app.jasonmarinho.com
-- ============================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Formations
create table if not exists public.formations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  duration text not null,
  modules_count int not null default 0,
  lessons_count int not null default 0,
  level text check (level in ('debutant','intermediaire','avance')) default 'debutant',
  thumbnail_url text,
  is_published boolean default true,
  created_at timestamptz default now()
);

-- User Formations (enrollments + progress)
create table if not exists public.user_formations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  formation_id uuid references public.formations(id) on delete cascade not null,
  progress int check (progress >= 0 and progress <= 100) default 0,
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  unique(user_id, formation_id)
);

-- Partners
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  advantage text not null,
  promo_code text,
  url text not null,
  logo_url text,
  category text not null,
  is_active boolean default true
);

-- Templates
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text check (category in ('airbnb','checkin','checkout','avis','bienvenue','autre')) default 'autre',
  copy_count int default 0,
  created_at timestamptz default now()
);

-- Community Groups
create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  platform text check (platform in ('facebook','whatsapp')) default 'facebook',
  members_count int default 0,
  url text not null,
  template_id uuid references public.templates(id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.user_formations enable row level security;

create policy "Users see own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users see own formations" on public.user_formations
  for all using (auth.uid() = user_id);

-- Public read for content tables
create policy "Public read formations" on public.formations
  for select using (is_published = true);

create policy "Public read partners" on public.partners
  for select using (is_active = true);

create policy "Public read templates" on public.templates
  for select using (true);

create policy "Public read community" on public.community_groups
  for select using (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SEED DATA
-- ============================================

insert into public.formations (slug, title, description, duration, modules_count, lessons_count, level) values
  ('google-my-business-lcd', 'Google My Business pour la LCD', 'Attire des voyageurs directs sans passer par Airbnb grâce à Google. Optimise ta fiche, collecte des avis et génère des réservations sans commission.', '2h30', 7, 11, 'debutant'),
  ('annonce-directe', 'Annonce Directe', 'Génère des réservations directes sans commission. Construis ton canal direct de A à Z, site, trafic qualifié, conversion et fidélisation, pour ne plus jamais dépendre d''Airbnb.', '4h30', 6, 14, 'debutant'),
  ('tarification-dynamique', 'Comprendre et utiliser la tarification dynamique', '45% des hôtes sous-évaluent ou surévaluent leur logement, perdant 15 à 25% de revenus. Tarif de base, prix minimum, saisonnalité, événements locaux, outils : la méthode complète pour mettre le bon prix, automatiquement.', '2h00', 4, 10, 'intermediaire'),
  ('securiser-reservations-eviter-mauvais-voyageurs', 'Sécuriser ses réservations et éviter les mauvais voyageurs', 'Comment identifier, filtrer et gérer les voyageurs problématiques avant qu''ils arrivent, sans sacrifier ton taux de conversion.', '2h00', 4, 10, 'intermediaire'),
  ('reseaux-sociaux-lcd', 'Développer sa présence sur les réseaux sociaux pour attirer des voyageurs', 'Instagram, Facebook, TikTok : quelles plateformes choisir, quoi publier et comment transformer tes abonnés en voyageurs.', '1h45', 4, 9, 'debutant'),
  ('optimiser-annonce-airbnb', 'Optimiser son annonce Airbnb : photos, titre, description, algorithme', 'Ton annonce est ton argument de vente numéro 1. Voici comment l''optimiser pour apparaître en tête des résultats et convertir chaque visite en réservation.', '2h30', 5, 12, 'debutant'),
  ('mettre-le-bon-prix-lcd', 'Mettre le bon prix en location courte durée', 'Comment fixer un prix qui remplit ton calendrier tout en maximisant tes revenus, sans outil payant, en partant de tes coûts réels.', '2h30', 5, 12, 'debutant'),
  ('livret-accueil-digital', 'Créer un livret d''accueil digital qui réduit les questions et améliore les avis', 'Un livret d''accueil bien conçu réduit de 70% les questions des voyageurs et améliore tes notes. Voici comment le créer et l''automatiser.', '1h45', 4, 9, 'debutant'),
  ('lcd-basse-saison', 'Développer son activité LCD en basse saison', 'La basse saison n''est pas une fatalité. Voici les stratégies concrètes pour remplir ton calendrier même quand les voyageurs sont rares.', '2h00', 4, 10, 'intermediaire'),
  ('gerer-lcd-automatisation', 'Gérer sa LCD comme un pro : automatisation et gain de temps', 'Automatise les tâches répétitives et reprends le contrôle de ton temps. Channel manager, messages automatiques, checklist et outils : le guide complet.', '2h00', 4, 10, 'intermediaire'),
  ('fiscalite-reglementation-lcd-france-2026', 'Fiscalité et réglementation LCD en France 2026', 'Tout ce qu''il faut savoir sur la fiscalité, les obligations légales et la réglementation en vigueur pour exercer sereinement en France en 2026.', '2h30', 5, 12, 'debutant'),
  ('ecrire-avis-repondre-voyageurs', 'Écrire des avis et répondre aux voyageurs', 'Les avis sont le moteur de ton activité LCD. Voici comment les collecter, les écrire et y répondre pour maximiser leur impact sur ton classement et tes réservations.', '2h00', 4, 10, 'debutant'),
  ('decorer-amenager-logement-lcd', 'Décorer et aménager son logement pour maximiser les avis', 'L''aménagement de ton logement influence directement tes notes et tes photos. Voici les règles de base pour créer un espace qui séduit sur Airbnb.', '2h00', 4, 10, 'debutant'),
  ('creer-conciergerie-lcd', 'Créer et développer sa conciergerie LCD', 'Comment lancer, structurer et développer une activité de conciergerie rentable, de la prospection des premiers clients à la gestion d''une équipe.', '3h00', 6, 14, 'intermediaire'),
  ('messages-automatiques', 'Automatiser ses messages Airbnb', 'Économise 3h par semaine en automatisant tes 5 messages essentiels. Templates inclus, prêts à copier.', '1h45', 5, 9, 'debutant')
on conflict (slug) do nothing;

insert into public.partners (name, slug, description, advantage, promo_code, url, category) values
  ('Swikly', 'swikly', 'La solution de caution digitale préférée des hôtes LCD. Zéro empreinte bancaire, expérience voyageur fluide.', 'Essai gratuit 30 jours + 20% de réduction sur votre 1er mois', 'JASON20', 'https://swikly.com', 'Caution'),
  ('Hospitable', 'hospitable', 'Automatise tes messages, synchronise tes calendriers et gère toutes tes plateformes depuis un seul endroit.', '20% de réduction pendant 3 mois', 'JASONLCD', 'https://hospitable.com', 'Automatisation'),
  ('PriceLabs', 'pricelabs', 'L''outil de tarification dynamique le plus utilisé par les hôtes professionnels. Analyse de marché en temps réel.', 'Essai gratuit 30 jours sans CB', null, 'https://pricelabs.co', 'Tarification'),
  ('MAIF', 'maif', 'L''assurance habitation qui couvre vraiment la location courte durée, sans surprise ni exclusion cachée.', 'Devis personnalisé avec conditions négociées pour les membres', null, 'https://maif.fr', 'Assurance'),
  ('Smily', 'smily', 'Channel manager simple et efficace pour synchroniser Airbnb, Booking.com, Vrbo et tes réservations directes.', '1 mois offert sur tout abonnement annuel', 'JASON1M', 'https://smily.com', 'Channel Manager')
on conflict (slug) do nothing;

insert into public.templates (title, content, category) values
  ('Message de confirmation de réservation', 'Bonjour [Prénom],

Merci pour ta réservation ! Je suis ravi(e) de t''accueillir du [Date arrivée] au [Date départ].

Voici les informations essentielles :
- Adresse : [Adresse complète]
- Check-in : à partir de [Heure]
- Code d''accès : [Code]

Je t''enverrai le livret d''accueil complet 48h avant ton arrivée.

À bientôt,
[Ton prénom]', 'airbnb'),
  ('Message de bienvenue à l''arrivée', 'Bonjour [Prénom], bienvenue !

J''espère que tu t''es bien installé(e). Le logement est à toi jusqu''au [Date départ] à [Heure].

Le livret d''accueil est disponible ici : [Lien]

N''hésite pas à me contacter si tu as la moindre question.

Bonne séjour,
[Ton prénom]', 'bienvenue'),
  ('Demande d''avis après le séjour', 'Bonjour [Prénom],

J''espère que ton séjour s''est bien passé !

Si tu en as eu l''occasion, un avis sur Airbnb m''aiderait énormément, ça ne prend que 2 minutes.

Merci d''avoir choisi mon logement, j''espère te revoir bientôt.

[Ton prénom]', 'avis'),
  ('Message de présentation groupe Facebook', 'Bonjour à tous !

Je me présente : je m''appelle [Prénom], [ville/région], hôte Airbnb depuis [X] ans.

Je gère [X] logement(s) et je suis ici pour apprendre, partager mes expériences et rencontrer d''autres hôtes passionnés.

Mon défi du moment : [ton défi actuel].

Ravi(e) de rejoindre ce groupe !', 'autre')
on conflict do nothing;

insert into public.community_groups (name, description, platform, members_count, url) values
  ('Hôtes Airbnb France', 'Le groupe Facebook de référence pour les hôtes Airbnb francophones. Conseils, entraide et retours d''expérience au quotidien.', 'facebook', 45000, 'https://facebook.com/groups/hotesairbnbfrance'),
  ('Location Courte Durée Pro', 'Groupe dédié aux hôtes professionnels et conciergeries. Discussions avancées sur la tarification, les outils et la réglementation.', 'facebook', 12000, 'https://facebook.com/groups/locationcourteduree'),
  ('Conciergerie Airbnb France', 'La communauté des gestionnaires de conciergeries. Partage de bonnes pratiques, recrutement et développement commercial.', 'facebook', 8500, 'https://facebook.com/groups/conciergerieairbnb')
on conflict do nothing;

-- ============================================
-- REPORTED GUESTS (base communautaire sécurité)
-- ============================================

create table if not exists public.reported_guests (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  identifier_type text check (identifier_type in ('email', 'phone', 'name')) not null,
  name text,
  incident_type text not null,
  description text,
  reporter_id uuid references public.profiles(id) on delete set null,
  reporter_city text,
  is_validated boolean default false,
  reported_at timestamptz default now()
);

alter table public.reported_guests enable row level security;

-- Seuls les membres authentifiés peuvent lire les signalements validés
create policy "Auth users read validated reports" on public.reported_guests
  for select using (auth.role() = 'authenticated' and is_validated = true);

-- Les membres authentifiés peuvent signaler
create policy "Auth users insert reports" on public.reported_guests
  for insert with check (auth.uid() = reporter_id);
