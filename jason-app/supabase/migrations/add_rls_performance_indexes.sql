-- ─────────────────────────────────────────────────────────────────────────
-- Indexes critiques pour la performance RLS et les lookups fréquents
-- Impact attendu : x10 à x100 sur les tables avec >1000 lignes
-- Source : https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices
-- ─────────────────────────────────────────────────────────────────────────

-- ── Voyageurs (RLS par user_id) ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_voyageurs_user_id ON voyageurs(user_id);

-- ── Séjours (RLS + FK + tri par date) ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sejours_user_id       ON sejours(user_id);
CREATE INDEX IF NOT EXISTS idx_sejours_voyageur_id   ON sejours(voyageur_id);
CREATE INDEX IF NOT EXISTS idx_sejours_date_arrivee  ON sejours(date_arrivee DESC);

-- ── Contracts (RLS + lookup token + FK sejour) ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_contracts_user_id   ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_sejour_id ON contracts(sejour_id);
CREATE INDEX IF NOT EXISTS idx_contracts_token     ON contracts(token);
CREATE INDEX IF NOT EXISTS idx_contracts_statut    ON contracts(statut) WHERE statut = 'en_attente';

-- ── Reported Guests (RLS + lookup identifier + filter validés) ───────────
CREATE INDEX IF NOT EXISTS idx_reported_guests_reporter_id  ON reported_guests(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reported_guests_identifier   ON reported_guests(identifier);
CREATE INDEX IF NOT EXISTS idx_reported_guests_is_validated ON reported_guests(is_validated) WHERE is_validated = true;

-- ── User community memberships (RLS) ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_community_memberships_user_id ON user_community_memberships(user_id);

-- ── User template favorites & customizations (RLS) ───────────────────────
CREATE INDEX IF NOT EXISTS idx_user_template_favorites_user_id      ON user_template_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_template_customizations_user_id ON user_template_customizations(user_id);

-- ── User formations (RLS) ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_formations_user_id     ON user_formations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_formations_formation_id ON user_formations(formation_id);

-- ── Roadmap (RLS + aggregation votes) ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_user_id    ON roadmap_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_item_id    ON roadmap_votes(item_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_comments_item_id ON roadmap_comments(item_id);

-- ── Logements (RLS) ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_logements_user_id ON logements(user_id);

-- ── Profiles (filters fréquents) ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_is_contributor ON profiles(is_contributor) WHERE is_contributor = true;
CREATE INDEX IF NOT EXISTS idx_profiles_driing_status  ON profiles(driing_status)  WHERE driing_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_profiles_plan           ON profiles(plan);

-- ── Templates (filtres admin) ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

-- ── Actualités (filter publié) ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_actualites_is_published ON actualites(is_published) WHERE is_published = true;

-- Vérification : ANALYSE les tables après création des indexes pour que le planificateur utilise les nouveaux index
ANALYZE voyageurs;
ANALYZE sejours;
ANALYZE contracts;
ANALYZE reported_guests;
ANALYZE user_community_memberships;
ANALYZE user_template_favorites;
ANALYZE user_template_customizations;
ANALYZE user_formations;
ANALYZE roadmap_votes;
ANALYZE roadmap_comments;
ANALYZE logements;
ANALYZE profiles;
ANALYZE templates;
ANALYZE actualites;
