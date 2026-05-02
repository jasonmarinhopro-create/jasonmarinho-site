-- Étape 1 : mettre à jour la contrainte de catégorie pour inclure 'facebook'
-- et toutes les catégories déjà utilisées en production
ALTER TABLE public.templates DROP CONSTRAINT IF EXISTS templates_category_check;
ALTER TABLE public.templates ADD CONSTRAINT templates_category_check
  CHECK (category IN (
    'airbnb', 'checkin', 'checkout', 'avis', 'bienvenue', 'autre',
    'confirmation', 'securite', 'upsell', 'probleme', 'extra',
    'conciergerie', 'saisonnier', 'facebook'
  ));

-- Étape 2 : insérer les gabarits "Groupe Facebook"
-- Variable clé : [LIEN_ANNONCE_DRIING], l'hôte remplace par l'URL de son annonce

INSERT INTO public.templates (title, content, category, copy_count) VALUES

(
  'Nouvelle annonce, je débarque sur Driing !',
  'Bonjour la communauté 👋

Je viens tout juste de rejoindre Driing et j''avais envie de me présenter rapidement !

Je suis hôte à [VILLE], j''ai [NOMBRE] logement(s) et je cherche des voyageurs qui aiment voyager autrement, avec du sens et un vrai contact humain 🌿

Si vous planifiez un séjour par ici, voici mon annonce :
👉 [LIEN_ANNONCE_DRIING]

Je suis disponible pour toute question, n''hésitez pas à me laisser un commentaire ou un message privé 😊',
  'facebook',
  0
),

(
  'Disponibilité de dernière minute',
  'Bonsoir la communauté 🙋

Un créneau vient de se libérer dans mon logement du [DATE_DÉBUT] au [DATE_FIN], et ce serait dommage de le voir vide !

Si vous cherchez une petite escapade de dernière minute dans un endroit soigné, voici mon annonce :
👉 [LIEN_ANNONCE_DRIING]

Je suis flexible sur les horaires et je réponds rapidement 😊 Bonne soirée à tous !',
  'facebook',
  0
),

(
  'Période creuse, idéal pour le télétravail',
  'Bonjour tout le monde 🏡

J''ai quelques jours disponibles en semaine du [DATE_DÉBUT] au [DATE_FIN] dans mon logement, idéal pour ceux qui cherchent à changer d''air tout en bossant !

Calme, bien équipé (wifi fibre, bureau), et avec une belle lumière naturelle ✨

Mon annonce : 👉 [LIEN_ANNONCE_DRIING]

Des questions ? Je réponds en commentaire ou en MP avec plaisir 📩',
  'facebook',
  0
),

(
  'Après un super avis voyageur',
  'Bonjour la communauté 🌟

Petite fierté du jour : je viens de recevoir un retour vraiment touchant de mes derniers voyageurs, et ça fait chaud au cœur 😊

Si vous cherchez un logement accueillant pour votre prochain séjour, n''hésitez pas à jeter un œil à mon annonce Driing :
👉 [LIEN_ANNONCE_DRIING]

Merci à tous ceux qui font confiance à la communauté pour voyager autrement 🙏',
  'facebook',
  0
),

(
  'Disponibilités pour les vacances scolaires',
  'Bonjour à tous 🌞

La période de [VACANCES / ÉTÉ / NOËL / etc.] approche et j''ai encore quelques créneaux disponibles dans mon logement !

C''est l''occasion de passer un séjour ressourçant dans un endroit pensé pour que vous vous sentiez vraiment chez vous 🏡

Réservation directe ici :
👉 [LIEN_ANNONCE_DRIING]

N''hésitez pas à partager autour de vous si vous pensez à quelqu''un qui cherche 😊 Bonne journée !',
  'facebook',
  0
),

(
  'Présentation dans un groupe d''hôtes',
  'Hello la communauté 👋

Je me présente : je suis [PRÉNOM], hôte à [VILLE] depuis [DURÉE]. Je loue [TYPE DE LOGEMENT] et j''ai rejoint ce groupe pour échanger avec d''autres hôtes partageant les mêmes valeurs 🌱

Mon logement sur Driing, si ça vous intéresse ou si vous avez des voyageurs à recommander :
👉 [LIEN_ANNONCE_DRIING]

Ravi(e) d''être ici, ouvert(e) à toute discussion !',
  'facebook',
  0
),

(
  'Logement idéal pour les groupes & familles',
  'Bonjour tout le monde 🎉

Mon logement à [VILLE] est particulièrement adapté aux [familles / groupes d''amis / équipes en séminaire], grand espace de vie, [NOMBRE] chambres, et une cuisine bien équipée pour se retrouver autour d''un repas 🍽️

Si vous organisez un séjour à plusieurs, voici l''annonce :
👉 [LIEN_ANNONCE_DRIING]

Les disponibilités partent vite sur cette période, n''hésitez pas à me contacter directement 📩',
  'facebook',
  0
),

(
  'Ouverture d''un nouveau logement',
  'Bonsoir la communauté 🎊

Grande nouvelle : j''ouvre les réservations pour mon [nouveau / deuxième / troisième] logement sur Driing !

C''est un [TYPE DE LOGEMENT] situé à [VILLE], parfait pour [PROFIL DU VOYAGEUR]. J''ai vraiment pris soin des détails pour que le séjour soit agréable de bout en bout 🌿

Je serais ravi(e) d''accueillir les premiers voyageurs, les premiers avis comptent beaucoup pour moi 😊

Lien de l''annonce : 👉 [LIEN_ANNONCE_DRIING]

Bonne soirée à tous !',
  'facebook',
  0
);
