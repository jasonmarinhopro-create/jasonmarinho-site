-- Infos pratiques par logement : WiFi, accès, poubelles, restaurants, etc.
--
-- Objectif : permettre à l'hôte de saisir UNE FOIS toutes les infos pratiques
-- de son logement (nom WiFi, mot de passe, code accès, localisation poubelles,
-- restos recommandés, etc.) et les voir auto-remplies dans TOUS ses gabarits
-- de messages voyageur. Plus jamais à retaper ces infos à chaque copie.
--
-- Format JSON libre pour rester souple. Schéma TypeScript de référence dans
-- `lib/logements/infos-pratiques.ts`. Forme attendue :
--   {
--     "wifi_nom": "Casa-Wifi",
--     "wifi_password": "Welcome2025",
--     "acces_code": "1234#",
--     "acces_instructions": "Boîte à clés à côté de la porte, code = ton numéro",
--     "poubelles_localisation": "Local poubelles au RDC à droite, tri sélectif",
--     "parking_info": "Parking gratuit dans la rue, pas de zone bleue",
--     "restaurants": [
--       { "nom": "Tasca Bom", "type": "Portugais", "prix": "€€" },
--       ...
--     ],
--     "transports": "Métro Marquês 5 min à pied, Uber recommandé le soir",
--     "urgences": "Hôpital São José à 10 min, mon numéro : +33...",
--     "notes": "Toute autre info utile"
--   }

alter table public.logements
  add column if not exists infos_pratiques jsonb default '{}'::jsonb;

comment on column public.logements.infos_pratiques is
  'Infos pratiques pour auto-fill des gabarits voyageur (WiFi, accès, poubelles, restos, transports, urgences). Format JSON libre, voir lib/logements/infos-pratiques.ts pour la forme typée.';
