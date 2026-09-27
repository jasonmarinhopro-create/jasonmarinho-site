-- Actualités : masquer les doublons publiés par la veille quotidienne.
--
-- Entre le 28 août et le 26 septembre 2026, la routine de veille a republié
-- presque chaque jour la même information avec un titre reformulé (la
-- déduplication ne portait que sur le titre exact) : 17 versions de
-- « Airbnb passe à 15,5 % de frais hôte », 11 du bilan de l'été, 3 de la
-- facture électronique, etc. Certaines se contredisaient (enregistrement des
-- meublés : « continue à déclarer en mairie » puis « tout doit être sur
-- Declaloc depuis le 20 mai », ce qui est faux : le téléservice national est
-- prévu au 4e trimestre 2026 et les mairies gèrent toujours l'enregistrement).
--
-- On garde une seule actu par sujet (la plus complète ou la plus juste) et on
-- MASQUE les autres (is_published = false), sans rien supprimer : réversible,
-- et les favoris / lectures existants restent intacts.
-- Conservées : « Airbnb bascule à 15,5 % de frais hôte le 13 octobre 2026 »,
-- « Bilan été 2026 : taux d'occupation en hausse, le littoral domine »,
-- « Été 2026 : 70 % des réservations Airbnb des Français restent en France »,
-- « Facturation électronique LMNP : l'obligation de réception est active »,
-- « Déclaloc reporté au T4 2026 : continue à déclarer en mairie »,
-- « API Meublés : la plateforme nationale d'enregistrement ouvre au 4e trimestre 2026 »,
-- « Airbnb lance ses nouveaux services en France : ce que tu dois savoir »,
-- « L'UE donne aux communes un droit de plafonner les meublés de tourisme ».
-- Prévention : dédup par similarité dans /api/actualites/insert
-- (lib/actualites/dedup.ts) + historique data/actualites-publiees.md lu par
-- la routine avant d'écrire.

UPDATE public.actualites
SET is_published = false, is_pinned = false
WHERE is_published = true
  AND title IN (
    -- Airbnb 15,5 %
    'Airbnb bascule à 15,5 % de commission hôte dès le 13 octobre',
    'Airbnb passe à un frais hôte unique de 15,5 % : tu as jusqu''au 13 octobre',
    'Airbnb passe à 15,5 % de commission pour les hôtes dès le 13 octobre',
    'Airbnb passe à 15,5 % de commission hôte le 13 octobre : agis avant',
    'Airbnb bascule aux frais hôte uniques à 15,5 % dès le 13 octobre',
    'Airbnb : commission unique de 15,5 % pour les hôtes dès le 13 octobre',
    'Airbnb bascule à 15,5 % de commission le 13 octobre : réajuste tes prix',
    'Airbnb passe à 15,5% de frais hôte exclusifs dès le 13 octobre',
    'Airbnb bascule à 15,5 % de frais hôte le 13 octobre : recalcule tes tarifs',
    'Airbnb bascule à une commission unique de 15,5 % le 13 octobre',
    'Airbnb passe à 15,5 % de frais hôte : un mois pour adapter tes prix',
    'Airbnb passe à 15,5 % de frais hôte dès le 13 octobre 2026',
    'Airbnb passe à 15,5 % de commission hôte le 13 octobre 2026',
    'Airbnb bascule à 15,5 % de frais hôte le 13 octobre : ajuste tes prix',
    'Airbnb bascule vers un frais hôte unique à 15,5 % HT dès le 13 octobre',
    'Airbnb passe à une commission unique de 15,5 % le 13 octobre 2026',
    -- Bilan de l'été
    'Été 2026 : la Bretagne cartonne, les grandes villes décrochent',
    'Été 2026 : Bretagne-Manche à 77 % d''occupation, grandes villes à la peine',
    'Été 2026 : les côtes cartonnent, les grandes villes reculent',
    'Été 2026 : le littoral à 77% d''occupation, les villes en retrait',
    'Été 2026 : le littoral explose, les grandes villes perdent 9 points d''occupation',
    'Été 2026 : le littoral cartonne, les grandes villes en repli',
    'Été 2026 : la Bretagne cartonne, les grandes villes en recul',
    'Été 2026 : revenus en hausse sur le littoral, villes en recul',
    'Été 2026 : le littoral cartonne, les grandes villes reculent',
    'Été 2026 : le littoral à 77 % d''occupation, les villes à 48 %',
    'Été 2026 : taux d''occupation en hausse, le littoral en tête des performances',
    -- Facture électronique
    'Facturation électronique : réception obligatoire dès le 1er septembre',
    'Facture électronique : l''obligation est en vigueur depuis le 1er septembre',
    'Facturation électronique : les LMNP doivent agir depuis le 1er septembre',
    -- Enregistrement des meublés (dont une info fausse)
    'Enregistrement meublé tourisme : le téléservice national arrive au T4',
    'Declaloc : le portail d''enregistrement des meublés se déploie sur tout le territoire',
    -- Nouveaux services Airbnb
    'Airbnb se mue en super-app : transport, courses et expériences intégrés',
    'Airbnb intègre hôtels et voitures : ce que ça change pour toi',
    -- Proposition européenne du 9 septembre
    'Bruxelles propose d''interdire les achats LCD en zones tendues'
  );
