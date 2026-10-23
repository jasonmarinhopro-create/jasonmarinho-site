/** Tests d'existence faits en base pour le parcours de démarrage (une requête chacun, ou tous ensemble par la fonction menu_state) */
export type OnboardingAutoFlags = Record<'logement' | 'sejour' | 'contrat' | 'gbp_audit' | 'chez_nous_post' | 'affiche' | 'ical_connected' | 'menage_shared', boolean>
