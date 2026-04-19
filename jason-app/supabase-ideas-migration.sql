-- Table ideas : vote & propositions de fonctionnalités (page /soutenir)
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'planned', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Lecture publique (tous, même non connectés)
CREATE POLICY "public_read_ideas" ON ideas FOR SELECT USING (true);

-- Fonction RPC pour incrémenter votes (utilisée par l'API /api/ideas/vote)
CREATE OR REPLACE FUNCTION increment_idea_votes(idea_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE ideas SET votes = votes + 1 WHERE id = idea_id;
END;
$$;

-- Quelques idées de démo
INSERT INTO ideas (title, votes, status) VALUES
  ('Ajouter un outil de calcul de rentabilité par logement', 12, 'planned'),
  ('Notifications par email pour les alertes voyageurs', 8, 'pending'),
  ('Modèles de réponses automatiques aux avis Airbnb', 6, 'pending'),
  ('Intégration avec Hostaway / Lodgify', 4, 'pending'),
  ('Guide sur la fiscalité des locations meublées non professionnelles', 3, 'done');
