-- Photos des logements envoyées depuis la fiche (sept. 2026).
-- Avant : la photo de couverture ne se renseignait qu'en collant une URL.
-- Bucket PUBLIC (photos affichées dans l'app), écritures uniquement côté
-- serveur par URL signées générées après contrôle du propriétaire
-- (app/dashboard/logements/[id]/photo-actions.ts). Le code crée aussi le
-- bucket à la première utilisation si cette migration n'est pas appliquée.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logement-photos', 'logement-photos', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "logement_photos_public_read" ON storage.objects;
CREATE POLICY "logement_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'logement-photos');
