// Textes par défaut (Conditions d'annulation / Règlement intérieur) proposés
// à la création d'un contrat quand le logement n'a pas ses propres clauses.
// Traduits en fr/pt/en pour que le sélecteur de langue de /sign/[token]
// (ContractView.tsx) puisse afficher la bonne version même pour un contrat
// déjà créé : si le texte stocké est identique au défaut français, on
// affiche la traduction correspondante plutôt que le français brut (cf.
// resolveDefaultText ci-dessous) — pas besoin de backfill en base.

export type ClauseLang = 'fr' | 'pt' | 'en'

export const DEFAULT_ANNULATION: Record<ClauseLang, string> =
  {
    fr: "En cas d'annulation par le locataire plus de 30 jours avant l'arrivée, l'acompte versé est remboursé intégralement. En cas d'annulation moins de 30 jours avant l'arrivée, l'acompte reste acquis au bailleur.",
    pt: 'Em caso de cancelamento pelo hóspede com mais de 30 dias de antecedência em relação à chegada, o sinal pago é reembolsado na íntegra. Em caso de cancelamento com menos de 30 dias de antecedência, o sinal fica adquirido pelo senhorio.',
    en: 'If the tenant cancels more than 30 days before arrival, the deposit paid is refunded in full. If cancelled less than 30 days before arrival, the deposit is retained by the landlord.',
  }

export const DEFAULT_REGLEMENT: Record<ClauseLang, string> =
  {
    fr: "- Respecter le calme et la tranquillité du voisinage.\n- Interdiction de fumer à l'intérieur du logement.\n- Les animaux de compagnie ne sont pas admis sauf accord préalable du bailleur.\n- Toute fête ou rassemblement est interdit sans autorisation écrite du bailleur.\n- Le locataire s'engage à laisser le logement dans l'état dans lequel il l'a trouvé.",
    pt: '- Respeitar a tranquilidade e o sossego da vizinhança.\n- Proibido fumar no interior do alojamento.\n- Animais de estimação não são admitidos salvo acordo prévio do senhorio.\n- Qualquer festa ou reunião é proibida sem autorização escrita do senhorio.\n- O hóspede compromete-se a deixar o alojamento no estado em que o encontrou.',
    en: "- Respect the calm and quiet of the neighbourhood.\n- No smoking inside the property.\n- Pets are not allowed unless agreed in advance with the landlord.\n- Any party or gathering is forbidden without the landlord's written authorisation.\n- The tenant agrees to leave the property in the condition it was found.",
  }

/**
 * Résout le texte à afficher pour une clause (conditions d'annulation ou
 * règlement intérieur) dans la langue demandée :
 * 1. Traduction dédiée stockée sur le contrat (ex: conditions_annulation_pt), si présente.
 * 2. Si le texte français stocké est EXACTEMENT le texte par défaut non modifié
 *    par le bailleur, on bascule sur la traduction par défaut correspondante
 *    (couvre aussi les contrats créés avant l'ajout de ce système).
 * 3. Sinon (texte personnalisé par le bailleur, jamais traduit), on retombe
 *    sur le texte français tel quel.
 */
export function resolveClauseText(
  base: string | null | undefined,
  translated: string | null | undefined,
  lang: ClauseLang,
  defaults: Record<ClauseLang, string>
): string {
  const baseText = base ?? ''
  if (lang === 'fr') return baseText
  if (translated) return translated
  if (baseText.trim() === defaults.fr.trim()) return defaults[lang]
  return baseText
}
