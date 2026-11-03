// Repères fiscaux affichés dans Mes finances (03/11/2026, Jason : « tout doit
// être sourcé pour bien justifier ce qu'on dit »). Une seule liste, chaque
// règle avec sa source officielle (impots.gouv.fr ou BOFiP), reprise par le
// formulaire de charge, la saisie d'un séjour et l'aide. Test :
// fiscal-guide.test.ts (toute règle a une source officielle).

export interface FiscalSource { label: string; url: string }

export interface FiscalRule {
  key: string
  title: string
  text: string
  source: FiscalSource
}

const SRC = {
  meublee: { label: 'impots.gouv.fr, Location meublée', url: 'https://www.impots.gouv.fr/particulier/location-meublee' },
  loyersCharges: { label: 'impots.gouv.fr, loyers d’une location meublée', url: 'https://www.impots.gouv.fr/particulier/questions/dois-je-declarer-les-loyers-de-ma-location-meublee-en-incluant-les-charges' },
  interets: { label: 'BOFiP, BOI-BIC-CHG-50-20-10', url: 'https://bofip.impots.gouv.fr/bofip/990-PGP.html/identifiant=BOI-BIC-CHG-50-20-10-20120912' },
  faibleValeur: { label: 'BOFiP, BOI-BIC-CHG-20-30-10', url: 'https://bofip.impots.gouv.fr/bofip/2109-PGP.html/identifiant=BOI-BIC-CHG-20-30-10-20170301' },
  miseEnService: { label: 'BOFiP, BOI-BIC-AMT-20-10', url: 'https://bofip.impots.gouv.fr/bofip/4543-PGP.html/identifiant=BOI-BIC-AMT-20-10-20120912' },
  duree: { label: 'BOFiP, BOI-BIC-AMT-10-40-30', url: 'https://bofip.impots.gouv.fr/bofip/4520-PGP.html/identifiant=BOI-BIC-AMT-10-40-30-20130923' },
  elements: { label: 'BOFiP, BOI-BIC-AMT-10-20', url: 'https://bofip.impots.gouv.fr/bofip/4590-PGP.html/identifiant=BOI-BIC-AMT-10-20-20221221' },
} satisfies Record<string, FiscalSource>

export const FISCAL_RULES: FiscalRule[] = [
  {
    key: 'micro',
    title: 'Au micro-BIC, aucune charge ne se déduit',
    text: 'Un abattement forfaitaire remplace toutes les charges. Les charges et les amortissements ne comptent qu’au régime réel : l’onglet Fiscalité compare les deux.',
    source: SRC.meublee,
  },
  {
    key: 'brut',
    title: 'Les recettes se déclarent en brut',
    text: 'On déclare la totalité des sommes perçues, sans rien déduire : pour une réservation Airbnb ou Booking, le prix des nuits et les frais de ménage, avant la commission de la plateforme.',
    source: SRC.loyersCharges,
  },
  {
    key: 'deductibles',
    title: 'Déductible : ce qui se consomme dans l’année',
    text: 'Au régime réel, les charges réelles se déduisent l’année où elles sont payées, par exemple : assurance, taxe foncière, énergie, internet, ménage, commission des plateformes, comptabilité, frais bancaires, petites réparations.',
    source: SRC.meublee,
  },
  {
    key: 'credit',
    title: 'Crédit : les intérêts, pas le capital',
    text: 'Les intérêts de l’emprunt se déduisent ; la part de capital remboursée ne se déduit pas.',
    source: SRC.interets,
  },
  {
    key: 'petit',
    title: 'Petit équipement : jusqu’à 500 € HT',
    text: 'Un petit matériel dont le prix unitaire ne dépasse pas 500 € HT peut se déduire tout de suite. L’administration ne l’admet pas pour l’équipement complet d’un logement au départ : celui-là s’amortit.',
    source: SRC.faibleValeur,
  },
  {
    key: 'amortissables',
    title: 'Amortissable : ce qui dure plusieurs années',
    text: 'Le logement (sans le terrain, qui ne s’amortit pas), le mobilier et l’électroménager au-delà de 500 € HT, les gros travaux. Leur coût est étalé sur leur durée d’utilisation.',
    source: SRC.elements,
  },
  {
    key: 'depart',
    title: 'L’amortissement part de la mise en service',
    text: 'Saisis le montant total à la date où les travaux sont terminés ou le meuble livré. La première année compte au prorata des jours restants.',
    source: SRC.miseEnService,
  },
  {
    key: 'duree',
    title: 'Les durées suivent l’usage',
    text: 'La loi ne fixe pas de durée : c’est la durée normale d’utilisation. Repères courants : mobilier 5 à 10 ans, gros travaux 10 à 15 ans, logement hors terrain 25 à 30 ans. Ton comptable peut les ajuster.',
    source: SRC.duree,
  },
]

export function fiscalRule(key: string): FiscalRule {
  const r = FISCAL_RULES.find(x => x.key === key)
  if (!r) throw new Error(`Règle fiscale inconnue : ${key}`)
  return r
}

/** Domaines acceptés comme source officielle */
export const OFFICIAL_HOSTS = ['www.impots.gouv.fr', 'bofip.impots.gouv.fr', 'www.service-public.fr', 'www.legifrance.gouv.fr']
