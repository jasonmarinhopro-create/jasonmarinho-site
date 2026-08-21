export default {
  slug: 'reseau-wifi-invite-lcd-6-etapes-isoler-securiser',

  title: 'Réseau Wi-Fi invité en LCD : 6 étapes pour isoler ton réseau et sécuriser tes voyageurs',
  description: 'SSID invité, WPA3, isolation IoT, blocage P2P, communication au voyageur : 6 étapes concrètes pour créer un Wi-Fi invité sécurisé en location courte durée et te protéger juridiquement.',
  keywords: 'wifi invité airbnb, réseau invité LCD, SSID invité box, isoler wifi voyageurs, sécurité wifi location courte durée, responsabilité hôte téléchargement illégal, WPA3 wifi',
  date: '2026-08-21',

  categorySlug: 'automatisation',

  readTime: 7,

  lead: 'Ta box internet accueille tes voyageurs comme elle accueillerait un cousin de passage : mot de passe unique, accès complet au réseau, aux imprimantes et parfois même aux caméras de la maison. En LCD, ce fonctionnement est un risque juridique et une porte ouverte à des usages qui engagent directement ta responsabilité d\'abonné internet. Voici 6 étapes concrètes pour créer un réseau Wi-Fi invité isolé, propre et sécurisé, sans changer de matériel dans 90 % des cas.',

  sections: [
    {
      h2: '1. Comprends les vrais risques d\'un Wi-Fi partagé avec tes voyageurs',
      content: [
        { type: 'p', text: 'Quand ton voyageur se connecte à ton réseau Wi-Fi principal, il partage la même adresse IP publique que toi et se trouve sur le même sous-réseau local que tous tes appareils. Concrètement, il peut découvrir ta box, tes imprimantes, ton NAS de sauvegarde et parfois même les caméras que tu utilises pour la sécurité de ton logement. Le pire n\'est pas là : en cas de téléchargement illégal ou de fraude commise depuis ta connexion, c\'est ton nom d\'abonné qui remonte auprès de l\'Arcom et des ayants droit.' },
        { type: 'p', text: 'La responsabilité de l\'abonné internet en France est encadrée par le mécanisme dit de "défaut de sécurisation" de la connexion. Autrement dit, si tu ne peux pas prouver que tu as sécurisé ta ligne, tu peux être tenu responsable des usages faits depuis ton IP, même par un tiers. Un réseau invité isolé est justement l\'élément qui te protège juridiquement, au même titre qu\'un règlement intérieur clair sur les usages du logement. Si tu veux compléter la vision sur les autres équipements sensibles à installer proprement, jette un œil au guide sur les <a href="/blog/videosurveillance-lcd-6-regles-cameras-legalite" style="color:var(--g);font-weight:500">6 règles de vidéosurveillance légale en location courte durée</a>.' },
        { type: 'ul', items: [
          'Accès potentiel à tes imprimantes, NAS et objets connectés perso',
          'Ton IP publique engagée en cas de fraude ou piratage',
          'Défaut de sécurisation de ligne opposable devant les ayants droit',
          'Impossibilité de couper le voyageur sans couper aussi ta propre connexion',
        ]},
        { type: 'tip', text: 'Le simple fait d\'avoir configuré un réseau invité isolé, documenté et communiqué au voyageur constitue une preuve de sécurisation. C\'est un vrai bouclier juridique, pas juste un confort technique.' },
      ],
    },
    {
      h2: '2. Vérifie si ta box propose déjà un réseau invité natif',
      content: [
        { type: 'p', text: 'Avant d\'acheter quoi que ce soit, connecte-toi à l\'interface de ta box : la majorité des box grand public françaises embarquent nativement une fonction réseau invité, sous des noms différents. Chez Orange, la Livebox affiche "Wi-Fi Extra" dans les paramètres Wi-Fi. Chez Free, la Freebox propose "Wi-Fi partagé" ou un SSID secondaire configurable. Chez SFR, la Box 8 permet d\'activer un "Wi-Fi Guest" en deux clics. Chez Bouygues, la Bbox propose un "Wi-Fi invité" avec bande passante limitée et isolation par défaut.' },
        { type: 'p', text: 'Si ta box est trop ancienne pour proposer cette fonction, tu as deux options : demander gratuitement le remplacement de la box auprès de ton opérateur (souvent accordé après quelques années d\'ancienneté), ou brancher un routeur secondaire type TP-Link, Asus ou UniFi derrière ta box existante. Le second choix est plus flexible et te permet aussi d\'améliorer la couverture dans un logement à étages. Pour comprendre les débits à viser en amont, relis le guide sur les <a href="/blog/wifi-location-courte-duree-debit-equipement-avis" style="color:var(--g);font-weight:500">6 actions pour un Wi-Fi qui booste tes avis voyageurs</a>.' },
        { type: 'ul', items: [
          'Livebox Orange : "Wi-Fi Extra" dans Paramètres Wi-Fi',
          'Freebox : "Wi-Fi partagé" ou SSID secondaire dédié',
          'SFR Box : "Wi-Fi Guest" activable depuis l\'app SFR',
          'Bbox Bouygues : "Wi-Fi invité" avec isolation par défaut',
          'Box ancienne : routeur secondaire type TP-Link Archer ou UniFi',
        ]},
      ],
    },
    {
      h2: '3. Configure ton SSID invité proprement : nom, mot de passe, chiffrement',
      content: [
        { type: 'p', text: 'Le SSID invité est le nom du réseau que ton voyageur va voir dans la liste des Wi-Fi disponibles. Évite les noms techniques ou anonymisés type "Guest_1234" qui font douter le voyageur : préfère un nom clair et rassurant qui reprend ton logement, par exemple "Appartement Marina" ou "Chalet Belledonne". Un nom bien choisi diminue le taux de messages "Je ne trouve pas le bon Wi-Fi" au check-in, un des messages les plus fréquents la première heure.' },
        { type: 'p', text: 'Sur le chiffrement, sélectionne impérativement WPA2 au minimum, ou WPA3 si ta box et les appareils voyageurs le supportent. N\'active jamais un réseau ouvert sans mot de passe, même par facilité : un Wi-Fi ouvert est immédiatement scanné par les outils automatisés et te fait porter la responsabilité complète des usages. Le mot de passe doit rester unique par logement, avoir au moins 12 caractères mélangeant lettres, chiffres et un symbole, et être imprimé dans le livret d\'accueil pour éviter les erreurs de saisie.' },
        { type: 'ul', items: [
          'Nom de réseau qui reprend clairement le nom du logement',
          'Chiffrement WPA2 minimum, WPA3 si compatible',
          'Mot de passe de 12 caractères minimum, unique par logement',
          'Jamais de réseau ouvert sans mot de passe',
          'Mot de passe imprimé dans le livret et affiché près du canapé ou de la box',
        ]},
        { type: 'tip', text: 'Change le mot de passe du réseau invité une à deux fois par an ou après un séjour problématique. Tu conserves la traçabilité par période et tu coupes proprement l\'accès aux anciens voyageurs sans toucher à ton propre réseau.' },
      ],
    },
    {
      h2: '4. Isole ton réseau perso et tes objets connectés du réseau voyageurs',
      content: [
        { type: 'p', text: 'C\'est le cœur du sujet : l\'isolation client-à-client (souvent appelée AP isolation) empêche les appareils connectés au réseau invité de communiquer entre eux et surtout d\'atteindre ton réseau principal. Cette option est presque toujours présente dans l\'interface de ta box mais rarement activée par défaut. Cherche une case type "Isoler les clients du réseau invité", "AP isolation" ou "Guest network isolation" et coche-la. Sans cette étape, les deux SSID cohabitent mais ne cloisonnent rien.' },
        { type: 'p', text: 'Vérifie ensuite que tes objets connectés perso, tes caméras intérieures autorisées et ton assistant vocal sont bien branchés sur le réseau principal, pas sur le réseau invité. Une caméra visible du voyageur doit rester sur ton réseau perso pour que lui ne puisse pas la voir dans le voisinage réseau, et pour que tu puisses toi continuer à la consulter à distance. C\'est cohérent avec ta démarche générale de séparation domicile et logement loué, dans la lignée de l\'analyse sur les <a href="/blog/capteurs-iot-lcd-bruit-temperature-utile-ou-pas" style="color:var(--g);font-weight:500">capteurs IoT utiles ou pas en LCD</a>.' },
        { type: 'ul', items: [
          'AP isolation activée sur le SSID invité',
          'NAS, imprimante, disques réseau restent sur le SSID principal',
          'Caméras autorisées branchées sur le réseau perso, pas sur l\'invité',
          'Assistant vocal type Alexa ou Google Home isolé du voyageur',
          'Test rapide : depuis ton téléphone connecté à l\'invité, tu ne dois voir aucun de tes appareils',
        ]},
      ],
    },
    {
      h2: '5. Bloque les usages qui engagent ta responsabilité d\'hôte',
      content: [
        { type: 'p', text: 'Certains usages sont pénalisés par la loi française et remontent directement à l\'abonné de la ligne : téléchargement de contenus protégés par le droit d\'auteur via BitTorrent, partage de flux TV pirates, accès à des services de streaming illégaux. La plupart des box modernes intègrent un contrôle parental ou un filtrage par catégories : active-le sur le SSID invité seulement, sans affecter ton propre réseau. Chez Free et Orange, tu peux bloquer les protocoles P2P sur le Wi-Fi partagé sans installer de matériel supplémentaire.' },
        { type: 'p', text: 'Ajoute dans ton livret d\'accueil et ton règlement intérieur une clause claire : le Wi-Fi est fourni pour un usage personnel et légal, le téléchargement illégal ou le partage de contenus piratés est interdit et engagerait la responsabilité du voyageur. Cette clause a une vraie valeur en cas de litige ultérieur avec un ayant droit : tu prouves que tu as informé et cadré l\'usage. C\'est le pendant technique de ce qui est expliqué côté équipement TV dans le guide sur les <a href="/blog/tv-streaming-lcd-6-regles-equiper-compte-pirate-voyageur" style="color:var(--g);font-weight:500">6 règles pour équiper ta TV sans te faire pirater tes comptes streaming</a>.' },
        { type: 'ul', items: [
          'Blocage P2P et BitTorrent activé sur le SSID invité',
          'Filtrage des sites de streaming pirate via le contrôle parental de la box',
          'Clause écrite dans le livret et le règlement intérieur',
          'Log des connexions conservé au minimum 12 mois si ta box le permet',
        ]},
        { type: 'tip', text: 'Si tu reçois un signalement de l\'Arcom pour un usage suspect sur ta ligne, la combinaison "réseau invité isolé + clause livret + filtrage P2P" est ta meilleure ligne de défense pour démontrer que tu as sécurisé la connexion.' },
      ],
    },
    {
      h2: '6. Communique le bon Wi-Fi au voyageur pour éviter les messages inutiles',
      content: [
        { type: 'p', text: 'Un réseau invité parfaitement configuré ne sert à rien si le voyageur se connecte par erreur à ton SSID principal ou passe 20 minutes à chercher le mot de passe. Le combo qui marche partout : mot de passe affiché dans un cadre discret à côté de la box ou du salon, mention dans le livret d\'accueil digital, message automatique de bienvenue le jour du check-in avec le nom exact du réseau et le mot de passe. Cette redondance élimine 90 % des questions Wi-Fi qui polluent les premières heures.' },
        { type: 'p', text: 'Profite aussi de ta fiche Google Business Profile : mentionne "Wi-Fi haut débit sécurisé" dans les services et réponds à toutes les questions du type "Y a-t-il un Wi-Fi ?" par un oui explicite. C\'est un signal qui pèse à la fois pour l\'algorithme et pour les voyageurs qui préparent leur venue, notamment en amont d\'un séjour direct. C\'est exactement le type de finition qui différencie un logement qui pilote sa <a href="/services/reservation-directe" style="color:var(--g);font-weight:500">réservation directe sans commission</a> d\'un logement resté sur le pilotage automatique des OTA.' },
        { type: 'ul', items: [
          'Mot de passe affiché à côté du canapé ou de la box',
          'Fiche Wi-Fi dans le livret d\'accueil digital, page dédiée',
          'Message automatique jour du check-in avec réseau et mot de passe',
          'Mention "Wi-Fi haut débit sécurisé" sur ta fiche Google Business',
          'Ton propre SSID caché ou renommé sans référence évidente au logement',
        ]},
        { type: 'p', text: 'Une fois ces 6 étapes en place, tu as un réseau invité propre, isolé de tes appareils perso, protégé contre les usages illégaux et clairement communiqué au voyageur. Tu as réduit ta surface de risque juridique, éliminé une bonne partie des messages Wi-Fi post check-in et tu as un vrai levier de différenciation quand un télétravailleur ou une famille compare ton annonce à celle du voisin.' },
        { type: 'cta', text: 'Tu veux aller plus loin sur la mise en place des équipements et l\'acquisition directe sans commission ?', button: 'Découvrir les formations LCD', href: '/services/formations' },
      ],
    },
  ],

  related: [
    { slug: 'wifi-location-courte-duree-debit-equipement-avis', label: 'WiFi en LCD : 6 actions pour une connexion qui booste tes avis voyageurs', categoryLabel: 'Expérience' },
    { slug: 'videosurveillance-lcd-6-regles-cameras-legalite', label: 'Vidéosurveillance en LCD : 6 règles pour rester dans la légalité', categoryLabel: 'Réglementation' },
    { slug: 'tv-streaming-lcd-6-regles-equiper-compte-pirate-voyageur', label: 'TV et streaming en LCD : équiper sans te faire pirater tes comptes', categoryLabel: 'Expérience' },
  ],
}
