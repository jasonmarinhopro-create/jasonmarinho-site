-- Compte Instagram enregistré comme lien entier (« https://www.instagram.com/tlucas93 »,
-- affiché « @https://… » sur la fiche, 24/10/2026) : on garde le nom de compte.
-- L'app et les inscriptions nettoient désormais à l'enregistrement (instaHandle).
update public.photographers
   set instagram_handle = substring(instagram_handle from 'instagram\.com/([A-Za-z0-9_.]{1,30})')
 where instagram_handle ~* 'instagram\.com/[A-Za-z0-9_.]{1,30}';
update public.cleaners
   set instagram_handle = substring(instagram_handle from 'instagram\.com/([A-Za-z0-9_.]{1,30})')
 where instagram_handle ~* 'instagram\.com/[A-Za-z0-9_.]{1,30}';
