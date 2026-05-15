// Configuration des pays supportés pour la gestion LCD.
// Ajouter ES/IT/BE/CH = juste ajouter une entrée dans COUNTRIES.
// Aucun code applicatif à modifier ailleurs.
//
// Sources (vérifier régulièrement, les régimes bougent) :
// - FR : Code du tourisme, BOFiP, Cerfa 14004 (meublé de tourisme)
// - PT : Decreto-Lei n.º 128/2014, Turismo de Portugal, Autoridade Tributária
// - ES : Real Decreto 1070/2017, ley turismo des CCAA
// - IT : DL 50/2017 (cedolare secca), CIN (Codice Identificativo Nazionale)
// - BE : Code wallon du Tourisme / Bruxelles Logement
// - CH : Réglementation cantonale (LDTR Genève, etc.)

export type CountryCode = 'FR' | 'PT' | 'ES' | 'IT' | 'BE' | 'CH'

export type CountryConfig = {
  code: CountryCode
  name: string
  /** Emoji drapeau pour affichage rapide */
  flag: string
  /** Locale BCP-47 pour formatage dates/nombres */
  locale: string
  currency: 'EUR' | 'CHF'

  /** Numéro d'enregistrement obligatoire pour la LCD */
  registration: {
    label: string                  // 'Numéro de déclaration en mairie' (FR), 'Numéro AL' (PT)
    shortLabel: string             // 'N° Cerfa' (FR), 'N° AL' (PT)
    /** URL officielle pour obtenir le numéro */
    obtainUrl?: string
  }

  /** Déclaration obligatoire des voyageurs étrangers */
  foreignGuestDeclaration: {
    label: string                  // 'Fiche police' (FR), 'Déclaration SIBA' (PT)
    deadlineHours: number          // 24 (FR), 72 (PT)
    /** Portail officiel pour effectuer la déclaration */
    portalUrl?: string
    /** Notes spécifiques (qui collecte, comment, etc.) */
    note: string
  }

  /** Taxe touristique / de séjour */
  tourismTax: {
    label: string                  // 'Taxe de séjour' (FR), 'Taxa Turística' (PT)
    /** True si appliqué à l'échelle communale (variation par ville) */
    perMunicipality: boolean
    /** Information générale pour l'hôte */
    note: string
  }

  /** Fiscalité simplifiée pour estimation rapide */
  taxation: {
    /** Nom du régime simplifié */
    simpleRegimeName: string       // 'Micro-BIC' (FR), 'Categoria B (coef. 0.35)' (PT)
    /** Coefficient d'imputation des revenus imposables (0.50 = 50%) */
    taxableIncomeRatio: number     // 0.50 (FR micro-BIC LCD non classé), 0.35 (PT cat. B AL)
    /** Plafond CA pour rester en régime simplifié (€/an) */
    simpleRegimeCap: number        // 77700 (FR), 200000 (PT - approximatif)
    /** Note pour l'hôte */
    note: string
  }

  /** TVA / IVA applicable à la LCD */
  vat: {
    /** Taux applicable spécifique à la LCD (en %) */
    lcdRate: number                // 10 (FR meublé sans services), 6 (PT AL)
    /** Seuil de franchise (sous lequel l'hôte n'est pas assujetti) */
    franchiseThreshold: number     // 85800 (FR), 14500 (PT continent)
    note: string
  }

  /** Documents/affichages obligatoires sur place */
  onSiteDocuments: string[]
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  FR: {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    locale: 'fr-FR',
    currency: 'EUR',
    registration: {
      label: 'Numéro de déclaration en mairie',
      shortLabel: 'N° Cerfa',
      obtainUrl: 'https://www.service-public.fr/particuliers/vosdroits/F2667',
    },
    foreignGuestDeclaration: {
      label: 'Fiche individuelle de police',
      deadlineHours: 24,
      note: "Pour les voyageurs étrangers : remplir une fiche d'hôtel (arrêté du 1er octobre 2015), à conserver 6 mois et transmettre sur réquisition.",
    },
    tourismTax: {
      label: 'Taxe de séjour',
      perMunicipality: true,
      note: "Taux fixé par la commune. Collectée auprès du voyageur, reversée à la commune ou via la plateforme (Airbnb, Booking).",
    },
    taxation: {
      simpleRegimeName: 'Micro-BIC',
      taxableIncomeRatio: 0.50,
      simpleRegimeCap: 77700,
      note: "Micro-BIC LCD non classé 2026 : abattement forfaitaire 50 % (au-delà du seuil de 15 000 €, conditions strictes). Meublé classé : 71 % d'abattement.",
    },
    vat: {
      lcdRate: 10,
      franchiseThreshold: 85800,
      note: "Hébergement meublé sans services para-hôteliers : exonéré de TVA. Avec petit-déjeuner/ménage régulier/linge/réception : TVA à 10 % dès le seuil franchi.",
    },
    onSiteDocuments: [
      'Numéro de déclaration affiché sur l\'annonce',
      'Règlement intérieur (recommandé)',
      'Affichage des consignes incendie',
    ],
  },

  PT: {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    locale: 'pt-PT',
    currency: 'EUR',
    registration: {
      label: 'Numéro AL (Alojamento Local)',
      shortLabel: 'N° AL',
      obtainUrl: 'https://rnal.turismodeportugal.pt/',
    },
    foreignGuestDeclaration: {
      label: 'Déclaration SIBA (ex-SEF)',
      deadlineHours: 72,
      portalUrl: 'https://siba.sef.pt/',
      note: "Obligatoire pour TOUS les voyageurs étrangers (UE comprise) : déclaration via le portail SIBA dans les 3 jours suivant l'arrivée. Géré désormais par la PSP suite à l'extinction du SEF en 2023.",
    },
    tourismTax: {
      label: 'Taxa Turística',
      perMunicipality: true,
      note: "Lisbonne : 2 €/nuit (max 7 nuits, adultes). Porto : 2 €/nuit (max 7 nuits). Autres communes : taux variable. À collecter auprès du voyageur si applicable.",
    },
    taxation: {
      simpleRegimeName: 'Categoria B (coef. 0.35)',
      taxableIncomeRatio: 0.35,
      simpleRegimeCap: 200000,
      note: "Régime simplifié Catégorie B (AL) : coefficient 0,35 sur le CA pour calcul du revenu imposable IRS. Cotisations Segurança Social en plus. Comptabilité organisée obligatoire au-dessus de 200 000 €.",
    },
    vat: {
      lcdRate: 6,
      franchiseThreshold: 14500,
      note: "AL au Portugal continental : IVA taxa reduzida à 6 %. Régime d'exemption (art. 53) sous 14 500 € de CA annuel. Madère/Açores : taux différents.",
    },
    onSiteDocuments: [
      'Plaque AL avec le numéro à l\'entrée (visible depuis l\'extérieur)',
      'Livro de Reclamações (livre des réclamations) accessible',
      'Information aux voyageurs (règles, horaires, contacts)',
      'Affichage des consignes de sécurité incendie',
    ],
  },

  // ─── À activer plus tard à la demande ────────────────────────────────
  // Pour ajouter un pays : copier le pattern, sourcer chaque champ sur
  // les textes officiels (pas de chiffres inventés).
  ES: {
    code: 'ES',
    name: 'Espagne',
    flag: '🇪🇸',
    locale: 'es-ES',
    currency: 'EUR',
    registration: {
      label: 'Numéro VFT / VUT (variable par CCAA)',
      shortLabel: 'N° VFT',
    },
    foreignGuestDeclaration: {
      label: 'Registro de viajeros (Real Decreto 933/2021)',
      deadlineHours: 24,
      portalUrl: 'https://hospedajes.ses.mir.es/',
      note: "Obligation de déclaration des voyageurs étrangers ET nationaux via le portail SES.HOSPEDAJES (effectif fin 2024).",
    },
    tourismTax: {
      label: 'Impuesto sobre Estancias Turísticas',
      perMunicipality: true,
      note: "Variable par CCAA. Catalogne : ITSEET. Baléares : ISTU. Vérifier les barèmes locaux.",
    },
    taxation: {
      simpleRegimeName: 'Estimación objetiva / IRPF',
      taxableIncomeRatio: 1.0, // pas d'abattement automatique en IRPF activités économiques
      simpleRegimeCap: 250000,
      note: "Pas d'équivalent du micro-BIC. Imposition IRPF sur les bénéfices nets (charges déductibles). Faire appel à un asesor fiscal.",
    },
    vat: {
      lcdRate: 10,
      franchiseThreshold: 85000,
      note: "IVA réduit 10 % si services para-hôteliers (réception, ménage en cours de séjour, linge). Sinon location simple, exonérée d'IVA.",
    },
    onSiteDocuments: [
      'Hojas de reclamaciones officielles disponibles',
      'Plaque VFT/VUT visible',
    ],
  },

  IT: {
    code: 'IT',
    name: 'Italie',
    flag: '🇮🇹',
    locale: 'it-IT',
    currency: 'EUR',
    registration: {
      label: 'CIN (Codice Identificativo Nazionale)',
      shortLabel: 'CIN',
      obtainUrl: 'https://bdsr.ministeroturismo.gov.it/',
    },
    foreignGuestDeclaration: {
      label: 'Comunicazione Alloggiati Web',
      deadlineHours: 24,
      portalUrl: 'https://alloggiatiweb.poliziadistato.it/',
      note: "Communication obligatoire des données des voyageurs à la Polizia di Stato dans les 24h via le portail Alloggiati.",
    },
    tourismTax: {
      label: 'Imposta di soggiorno',
      perMunicipality: true,
      note: "Variable par commune (1 à 7 €/nuit). Roma, Milano, Firenze, Venezia ont leurs propres barèmes.",
    },
    taxation: {
      simpleRegimeName: 'Cedolare secca (21 %)',
      taxableIncomeRatio: 1.0,
      simpleRegimeCap: 0, // pas de plafond CA, mais limite de 4 logements
      note: "Cedolare secca : impôt forfaitaire à 21 % sur le brut (ou 26 % à partir du 2e logement). Au-delà de 4 logements : activité d'entreprise obligatoire.",
    },
    vat: {
      lcdRate: 10,
      franchiseThreshold: 85000,
      note: "Si location nue ou < 30 nuits sans services : pas d'IVA. Avec services : 10 % réduit.",
    },
    onSiteDocuments: [
      'CIN affiché sur l\'annonce et à l\'entrée',
      'Information dispositifs anti-incendie',
    ],
  },

  BE: {
    code: 'BE',
    name: 'Belgique',
    flag: '🇧🇪',
    locale: 'fr-BE',
    currency: 'EUR',
    registration: {
      label: 'Numéro d\'enregistrement (variable par Région)',
      shortLabel: 'N° Région',
      obtainUrl: 'https://tourismewallonie.be/',
    },
    foreignGuestDeclaration: {
      label: 'Registre des hôtes',
      deadlineHours: 24,
      note: "Bruxelles & Wallonie : registre des hôtes obligatoire (conservation 5 ans, transmission sur demande des autorités).",
    },
    tourismTax: {
      label: 'Taxe de séjour',
      perMunicipality: true,
      note: "Variable par commune. Bruxelles : taxe spécifique sur les hébergements touristiques.",
    },
    taxation: {
      simpleRegimeName: 'Revenus mobiliers vs professionnels',
      taxableIncomeRatio: 0.60, // approximation indicative
      simpleRegimeCap: 0,
      note: "Distinction location occasionnelle (revenus mobiliers 30 %) vs activité régulière (revenus professionnels). Faire appel à un comptable belge.",
    },
    vat: {
      lcdRate: 6,
      franchiseThreshold: 25000,
      note: "TVA 6 % sur hébergement touristique < 3 mois (avec ou sans services). Franchise sous 25 000 € de CA.",
    },
    onSiteDocuments: [
      'Numéro d\'enregistrement régional affiché',
      'Conditions générales accessibles',
    ],
  },

  CH: {
    code: 'CH',
    name: 'Suisse',
    flag: '🇨🇭',
    locale: 'fr-CH',
    currency: 'CHF',
    registration: {
      label: 'Autorisation cantonale (variable)',
      shortLabel: 'Autorisation',
    },
    foreignGuestDeclaration: {
      label: 'Registre des hôtes (cantonal)',
      deadlineHours: 24,
      note: "Variable selon les cantons. Genève (LDTR), Vaud, Valais : registres cantonaux distincts.",
    },
    tourismTax: {
      label: 'Taxe de séjour cantonale',
      perMunicipality: true,
      note: "Variable par canton et commune (1 à 5 CHF/nuit typiquement).",
    },
    taxation: {
      simpleRegimeName: 'Revenu locatif (impôt fédéral + cantonal)',
      taxableIncomeRatio: 1.0,
      simpleRegimeCap: 0,
      note: "Imposition au niveau fédéral, cantonal et communal. Pas de régime simplifié.",
    },
    vat: {
      lcdRate: 3.8,
      franchiseThreshold: 100000,
      note: "TVA hébergement taux spécial 3,8 %. Assujettissement obligatoire au-delà de 100 000 CHF.",
    },
    onSiteDocuments: [
      'Règlement intérieur et instructions sécurité',
    ],
  },
}

/** Liste ordonnée pour les sélecteurs UI */
export const COUNTRY_CODES: CountryCode[] = ['FR', 'PT', 'ES', 'IT', 'BE', 'CH']

/** Pays activés en production. Les autres sont en "preview" — config en place
 *  mais contenus pas encore validés. À élargir au fur et à mesure. */
export const ACTIVE_COUNTRIES: CountryCode[] = ['FR', 'PT']

/** Helper : récupère la config ou fallback FR si code inconnu */
export function getCountry(code: string | null | undefined): CountryConfig {
  if (!code) return COUNTRIES.FR
  const config = COUNTRIES[code as CountryCode]
  return config ?? COUNTRIES.FR
}

/** Helper : format monétaire selon la locale du pays */
export function formatCurrencyForCountry(amount: number, country: CountryCode | string | null): string {
  const c = getCountry(country)
  return new Intl.NumberFormat(c.locale, {
    style: 'currency',
    currency: c.currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
