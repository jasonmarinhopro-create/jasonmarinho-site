// Liste des nationalités proposées dans les sélecteurs (fiche voyageur,
// page de signature). Codes ISO-3166-1 alpha-2 — les plus fréquents pour
// la clientèle LCD européenne d'abord.
// Partagée entre VoyageursView, VoyageurDetail et la page de signature :
// une seule source de vérité pour matcher lib/countries.ts (déclarations).

export interface Nationalite {
  code: string
  name: string
}

export const NATIONALITES: Nationalite[] = [
  { code: 'FR', name: 'France' }, { code: 'BE', name: 'Belgique' }, { code: 'CH', name: 'Suisse' },
  { code: 'LU', name: 'Luxembourg' }, { code: 'CA', name: 'Canada' }, { code: 'MC', name: 'Monaco' },
  { code: 'DE', name: 'Allemagne' }, { code: 'ES', name: 'Espagne' }, { code: 'IT', name: 'Italie' },
  { code: 'PT', name: 'Portugal' }, { code: 'GB', name: 'Royaume-Uni' }, { code: 'NL', name: 'Pays-Bas' },
  { code: 'AT', name: 'Autriche' }, { code: 'PL', name: 'Pologne' }, { code: 'CZ', name: 'Tchéquie' },
  { code: 'RO', name: 'Roumanie' }, { code: 'HU', name: 'Hongrie' }, { code: 'GR', name: 'Grèce' },
  { code: 'SE', name: 'Suède' }, { code: 'DK', name: 'Danemark' }, { code: 'NO', name: 'Norvège' },
  { code: 'FI', name: 'Finlande' }, { code: 'IE', name: 'Irlande' }, { code: 'HR', name: 'Croatie' },
  { code: 'RS', name: 'Serbie' }, { code: 'UA', name: 'Ukraine' }, { code: 'RU', name: 'Russie' },
  { code: 'TR', name: 'Turquie' }, { code: 'MA', name: 'Maroc' }, { code: 'TN', name: 'Tunisie' },
  { code: 'DZ', name: 'Algérie' }, { code: 'SN', name: 'Sénégal' }, { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'CM', name: 'Cameroun' }, { code: 'US', name: 'États-Unis' }, { code: 'MX', name: 'Mexique' },
  { code: 'BR', name: 'Brésil' }, { code: 'AR', name: 'Argentine' }, { code: 'CO', name: 'Colombie' },
  { code: 'CN', name: 'Chine' }, { code: 'JP', name: 'Japon' }, { code: 'KR', name: 'Corée du Sud' },
  { code: 'IN', name: 'Inde' }, { code: 'AU', name: 'Australie' }, { code: 'NZ', name: 'Nouvelle-Zélande' },
  { code: 'ZA', name: 'Afrique du Sud' }, { code: 'AE', name: 'Émirats arabes unis' },
  { code: 'MU', name: 'Maurice' }, { code: 'RE', name: 'Réunion' }, { code: 'GP', name: 'Guadeloupe' },
  { code: 'MQ', name: 'Martinique' }, { code: 'PF', name: 'Polynésie française' },
]

export function nationaliteName(code: string | null | undefined): string | null {
  if (!code) return null
  return NATIONALITES.find(n => n.code === code)?.name ?? code
}
