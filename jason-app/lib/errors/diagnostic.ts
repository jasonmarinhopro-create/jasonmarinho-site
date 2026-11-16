// Ce que la page d'erreur dit à l'utilisateur (16/11/2026, Jason : « ce n'est
// pas fiable, ça me fait peur », devant l'écran « Une erreur s'est produite »
// quand la base Supabase ne répondait pas). Pur et testé. La page interroge
// /api/public/sante, puis choisit ses mots ici : on dit ce qui se passe, que
// les données ne risquent rien, et ce qui va se passer ensuite.

export type EtatBase = 'ok' | 'lente' | 'muette'
export type EtatSonde = 'cherche' | EtatBase | 'hors-ligne' | 'inconnu'

export interface Diagnostic {
  /** rassurant : la page se rétablit seule ; neutre : un raté isolé */
  ton: 'attente' | 'rassurant' | 'neutre'
  titre: string
  texte: string
  /** Ligne « Base de données » de la carte d'état */
  base: { label: string; etat: 'ok' | 'attente' | 'ko' }
  /** La page se relance seule quand la base répond de nouveau */
  relanceAuto: boolean
}

/** Classe la réponse de /api/public/sante. Tout ce qui n'est pas reconnu vaut « inconnu ». */
export function etatDepuisReponse(raw: unknown): EtatSonde {
  const base = raw && typeof raw === 'object' ? (raw as { base?: unknown }).base : null
  return base === 'ok' || base === 'lente' || base === 'muette' ? base : 'inconnu'
}

export function diagnostiquer(etat: EtatSonde): Diagnostic {
  switch (etat) {
    case 'cherche':
      return { ton: 'attente', titre: 'On regarde ce qui se passe', texte: 'Cette page n’a pas pu s’afficher. Vérification en cours, cela prend quelques secondes.', base: { label: 'Vérification…', etat: 'attente' }, relanceAuto: false }
    case 'muette':
      return { ton: 'rassurant', titre: 'Notre base de données fait une pause', texte: 'Elle ne répond pas pour le moment, donc cette page n’a pas pu lire ses informations. Rien n’est perdu : tes données sont intactes. En général, tout repart en une à deux minutes, et la page se relancera toute seule.', base: { label: 'Ne répond pas pour le moment', etat: 'ko' }, relanceAuto: true }
    case 'lente':
      return { ton: 'rassurant', titre: 'Notre base de données est ralentie', texte: 'Elle répond, mais trop lentement pour afficher cette page à temps. Rien n’est perdu : tes données sont intactes. La page se relancera toute seule dès que le rythme sera revenu.', base: { label: 'Répond lentement', etat: 'attente' }, relanceAuto: true }
    case 'hors-ligne':
      return { ton: 'rassurant', titre: 'Ta connexion Internet semble coupée', texte: 'La page n’a pas pu joindre nos serveurs. Vérifie ton Wi-Fi ou ton réseau mobile : la page se relancera dès que la connexion reviendra.', base: { label: 'Injoignable depuis ton appareil', etat: 'attente' }, relanceAuto: true }
    case 'ok':
      return { ton: 'neutre', titre: 'Cette page a eu un raté', texte: 'Le reste de ton espace fonctionne et tes données sont intactes. Réessaie : le plus souvent, la page s’affiche au second essai.', base: { label: 'Répond normalement', etat: 'ok' }, relanceAuto: false }
    default:
      return { ton: 'neutre', titre: 'Cette page n’a pas pu s’afficher', texte: 'Tes données sont intactes. Réessaie dans un instant, et si cela se répète, écris-nous avec le code ci-dessous.', base: { label: 'État non vérifié', etat: 'attente' }, relanceAuto: false }
  }
}

/** Classe une mesure de la base : au-delà de 2,5 s elle est « lente », sans réponse ou en erreur serveur « muette ». */
export function etatDeLaBase(mesure: { status: number; ms: number } | null): EtatBase {
  if (!mesure || mesure.status === 0 || mesure.status >= 500) return 'muette'
  return mesure.ms > 2500 ? 'lente' : 'ok'
}
