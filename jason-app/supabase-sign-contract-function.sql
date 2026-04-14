-- Migration : Fonction PostgreSQL sécurisée pour la signature électronique
-- Utilise SECURITY DEFINER pour s'exécuter avec les droits du propriétaire de la DB
-- Permet la signature via la clé anon (toujours disponible), sans dépendre du service role key
-- C'est la solution fiable si SUPABASE_SERVICE_ROLE_KEY n'est pas configuré en production

CREATE OR REPLACE FUNCTION public.sign_contract(
  p_token      UUID,
  p_signature_image    TEXT,
  p_signature_ip       TEXT DEFAULT 'inconnue',
  p_signature_user_agent TEXT DEFAULT 'inconnu',
  p_app_url    TEXT DEFAULT 'https://app.jasonmarinho.com'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract RECORD;
BEGIN
  -- Trouver le contrat par token (doit être en_attente et non expiré)
  SELECT * INTO v_contract
  FROM public.contracts
  WHERE token = p_token
    AND statut = 'en_attente'
    AND token_expires_at > now();

  IF NOT FOUND THEN
    -- Vérifier si déjà signé
    PERFORM 1 FROM public.contracts WHERE token = p_token AND statut = 'signe';
    IF FOUND THEN
      RETURN json_build_object('error', 'Ce contrat a déjà été signé.', 'already_signed', true);
    END IF;
    RETURN json_build_object('error', 'Contrat introuvable, expiré ou déjà traité.');
  END IF;

  -- Valider la signature
  IF p_signature_image IS NULL OR length(p_signature_image) < 100 THEN
    RETURN json_build_object('error', 'Image de signature invalide.');
  END IF;

  -- Mettre à jour le contrat
  UPDATE public.contracts
  SET
    statut               = 'signe',
    signature_date       = now(),
    signature_ip         = p_signature_ip,
    signature_user_agent = p_signature_user_agent,
    signature_image      = p_signature_image
  WHERE id = v_contract.id;

  -- Mettre à jour le séjour associé
  UPDATE public.sejours
  SET
    contrat_statut         = 'signe',
    contrat_date_signature = CURRENT_DATE,
    contrat_lien           = p_app_url || '/sign/' || p_token::text
  WHERE id = v_contract.sejour_id;

  RETURN json_build_object(
    'success',     true,
    'contract_id', v_contract.id::text,
    'sejour_id',   v_contract.sejour_id::text
  );
END;
$$;

-- Autoriser l'appel via la clé anon (appelée depuis l'API publique de signature)
GRANT EXECUTE ON FUNCTION public.sign_contract TO anon;
GRANT EXECUTE ON FUNCTION public.sign_contract TO authenticated;
