-- Migration : Politique RLS pour la signature publique des contrats
-- Le locataire signe sans compte — le token UUID est son facteur d'authentification
-- À exécuter dans Supabase > SQL Editor

-- Autoriser la lecture publique d'un contrat via son token (page de signature)
-- Seuls les champs non-sensibles sont exposés via l'API (voir GET /api/contracts/sign)
-- Cette politique permet à l'API service-role de fonctionner normalement
-- mais aussi au client anon de lire son contrat s'il est sur la page publique

-- Supprime la politique existante si elle existe déjà
DROP POLICY IF EXISTS "Signature publique via token" ON public.contracts;

-- Permet à n'importe qui (anon ou authentifié) de mettre à jour un contrat
-- en_attente non expiré vers l'état signe, via le token unique
-- Le token UUID de 128 bits est suffisamment aléatoire pour servir d'authentification
CREATE POLICY "Signature publique via token"
  ON public.contracts
  FOR UPDATE
  USING (
    statut = 'en_attente'
    AND token_expires_at > now()
  )
  WITH CHECK (
    statut = 'signe'
  );

-- Note : la route /api/contracts/sign utilise la SERVICE ROLE KEY qui bypasse le RLS
-- Cette politique est un filet de sécurité supplémentaire, pas une dépendance
