-- ============================================
-- SCHEMA — app.jasonmarinho.com
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
  ('tarification-dynamique', 'Tarification Dynamique & Revenue Management', 'Maximise tes revenus en ajustant tes prix à la demande. De la stratégie de base aux outils avancés comme PriceLabs.', '4h', 9, 18, 'intermediaire'),
  ('messages-automatiques', 'Automatiser ses messages Airbnb', 'Économise 3h par semaine en automatisant tes 5 messages essentiels. Templates inclus, prêts à copier.', '1h45', 5, 9, 'debutant')
on conflict (slug) do nothing;

insert into public.partners (name, slug, description, advantage, promo_code, url, category) values
  ('Swikly', 'swikly', 'La solution de caution digitale préférée des hôtes LCD. Zéro empreinte bancaire, expérience voyageur fluide.', 'Essai gratuit 30 jours + 20% de réduction sur votre 1er mois', 'JASON20', 'https://swikly.com', 'Caution'),
  ('Hospitable', 'hospitable', 'Automatise tes messages, synchronise tes calendriers et gère toutes tes plateformes depuis un seul endroit.', '20% de réduction pendant 3 mois', 'JASONLCD', 'https://hospitable.com', 'Automatisation'),
  ('PriceLabs', 'pricelabs', 'L''outil de tarification dynamique le plus utilisé par les hôtes professionnels. Analyse de marché en temps réel.', 'Essai gratuit 30 jours sans CB', null, 'https://pricelabs.co', 'Tarification'),
  ('MAIF', 'maif', 'L''assurance habitation qui couvre vraiment la location courte durée — sans surprise ni exclusion cachée.', 'Devis personnalisé avec conditions négociées pour les membres', null, 'https://maif.fr', 'Assurance'),
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

Si tu en as eu l''occasion, un avis sur Airbnb m''aiderait énormément — ça ne prend que 2 minutes.

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
