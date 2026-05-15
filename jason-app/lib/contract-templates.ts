// Templates juridiques de contrat de location courte durée par pays.
// Source d'autorité unique : tout ce qui change dans le contrat selon
// le pays vit ici. Ajouter un pays = ajouter une entrée.
//
// ⚠️ DISCLAIMER : ces templates sont fournis à titre indicatif. Pour les
// pays autres que FR (FR a fait l'objet de relectures juridiques), il est
// recommandé de faire valider le modèle par un juriste local avant un
// usage commercial régulier.
//
// Sources :
// - PT : Decreto-Lei n.º 128/2014 (régime AL), Código Civil arts.
//   1022-1029 (locação), arts. 405-406 (liberté contractuelle).
//   Règlement eIDAS (UE) 910/2014 valide PT comme FR.

import type { CountryCode } from './countries'

export type ContractTemplate = {
  /** Sous-titre sous le titre du contrat */
  legalBasis: string
  /** Titre de la section "Bien loué" (varie peu) */
  sectionBienLoue: string
  /** Texte de la section "Obligations des parties" */
  obligationsBailleur: string
  obligationsLocataire: string
  /** Section "Loi applicable" : référence au code et juridiction compétente */
  loiApplicable: string
  /** Mention spéciale post-séjour (déclaration voyageurs étrangers, etc.) */
  declarationVoyageur: string | null
  /** Texte juridique sur la signature électronique */
  signatureElectronique: string
  /** Article RGPD (FR/UE, identique dans l'UE) */
  rgpd: string
  /** Label du numéro d'enregistrement à afficher (Cerfa / N° AL / etc.) */
  numeroLabel: string
  /** Note de fin (disclaimer si template non validé juridiquement) */
  disclaimer: string | null
}

export const CONTRACT_TEMPLATES: Record<CountryCode, ContractTemplate> = {
  FR: {
    legalBasis: 'Établi conformément au Code civil (Art. 1366) et au Code du tourisme (L324-1).',
    sectionBienLoue: 'Bien loué',
    obligationsBailleur:
      "remettre le logement en bon état, assurer la jouissance paisible des lieux, " +
      "et garantir contre les vices et défauts qui rendraient le bien impropre à l'usage.",
    obligationsLocataire:
      "user du logement en bon père de famille, payer le loyer aux termes convenus, " +
      "ne pas sous-louer sans accord écrit du bailleur, respecter la capacité maximale " +
      "d'occupation, et restituer les lieux dans l'état initial.",
    loiApplicable:
      "Le présent contrat est soumis au droit français. En cas de litige, les parties " +
      "tenteront de résoudre leur différend à l'amiable. À défaut, le tribunal compétent " +
      "sera celui du lieu de situation du bien loué.",
    declarationVoyageur:
      "Pour les voyageurs de nationalité étrangère, le bailleur procédera à l'établissement " +
      "d'une fiche individuelle de police (arrêté du 1er octobre 2015) qui sera conservée " +
      "pendant six mois et transmise sur réquisition aux services de police ou de gendarmerie.",
    signatureElectronique:
      "La signature électronique apposée ci-dessous constitue une signature électronique simple " +
      "au sens du règlement (UE) n° 910/2014 (eIDAS) et de l'article 1366 du Code civil français. " +
      "Elle est produite après identification du signataire par son adresse email, et l'enregistrement " +
      "de l'adresse IP, de l'horodatage et du navigateur utilisé (audit trail). Sa valeur probante " +
      "est reconnue devant les juridictions françaises et européennes.",
    rgpd:
      "Les données personnelles collectées dans ce contrat sont traitées sur la base légale de " +
      "l'exécution du contrat (Art. 6.1.b RGPD). Elles sont conservées 5 ans à compter de la fin " +
      "du séjour (prescription civile, Art. 2224 Code civil). Vous disposez d'un droit d'accès, " +
      "de rectification et d'effacement auprès du bailleur.",
    numeroLabel: "Numéro de déclaration en mairie",
    disclaimer: null,
  },

  PT: {
    legalBasis:
      "Estabelecido em conformidade com o Decreto-Lei n.º 128/2014 (Alojamento Local), " +
      "os artigos 1022.º a 1029.º e 405.º a 406.º do Código Civil português. " +
      "Établi en français par convention entre les parties.",
    sectionBienLoue: "Bien loué (Alojamento Local)",
    obligationsBailleur:
      "remettre le logement en bon état et conforme à son enregistrement AL, " +
      "afficher visiblement la plaque AL avec le numéro à l'entrée, mettre à disposition " +
      "le Livro de Reclamações, et assurer la jouissance paisible des lieux.",
    obligationsLocataire:
      "utiliser le logement avec diligence et respect du voisinage, payer le prix " +
      "convenu aux dates fixées, ne pas sous-louer sans accord écrit du bailleur, " +
      "respecter la capacité maximale d'occupation, restituer les lieux dans l'état initial, " +
      "et coopérer à la déclaration SIBA si requis (voyageurs étrangers).",
    loiApplicable:
      "Le présent contrat est soumis au droit portugais (Decreto-Lei n.º 128/2014 et Código Civil). " +
      "En cas de litige, les parties tenteront une résolution amiable. À défaut, le tribunal " +
      "compétent sera celui du district du logement (foro do lugar do imóvel).",
    declarationVoyageur:
      "Pour TOUS les voyageurs étrangers (UE comprise), le bailleur procédera à la déclaration " +
      "des données du séjour via le portail SIBA (Sistema de Informação de Boletins de Alojamento) " +
      "dans les 3 jours suivant l'arrivée, conformément à la loi n.º 23/2007 et à ses modifications. " +
      "Le locataire s'engage à fournir les informations nécessaires (nationalité, document " +
      "d'identité, date de naissance) à cet effet.",
    signatureElectronique:
      "La signature électronique apposée ci-dessous constitue une signature électronique simple " +
      "au sens du règlement (UE) n° 910/2014 (eIDAS), directement applicable au Portugal. " +
      "Elle est produite après identification du signataire par son adresse email, et l'enregistrement " +
      "de l'adresse IP, de l'horodatage et du navigateur utilisé (audit trail). Sa valeur probante " +
      "est reconnue devant les juridictions portugaises et européennes.",
    rgpd:
      "Les données personnelles collectées dans ce contrat sont traitées sur la base légale de " +
      "l'exécution du contrat (Art. 6.1.b RGPD). Elles sont conservées 5 ans à compter de la fin " +
      "du séjour (prescription civile portugaise, Art. 309.º Código Civil). Vous disposez d'un " +
      "droit d'accès, de rectification et d'effacement auprès du bailleur. CNPD : entité de " +
      "contrôle portugaise (https://www.cnpd.pt).",
    numeroLabel: "Numéro AL (Alojamento Local)",
    disclaimer:
      "⚠️ Ce modèle de contrat Alojamento Local est fourni à titre indicatif et synthétise " +
      "les principales obligations du régime portugais. Pour un usage régulier ou un litige " +
      "à forts enjeux, il est recommandé de faire valider ce contrat par un avocat portugais.",
  },

  // ─── Pays en preview (config FR par défaut tant que pas validé) ──
  // Pour ajouter un pays, dupliquer le pattern PT et sourcer chaque champ.
  ES: { ...{} as ContractTemplate }, // placeholder, voir getTemplate
  IT: { ...{} as ContractTemplate },
  BE: { ...{} as ContractTemplate },
  CH: { ...{} as ContractTemplate },
}

/** Retourne le template du pays demandé, ou FR si non encore implémenté */
export function getContractTemplate(country: string | null | undefined): ContractTemplate {
  const code = (country ?? 'FR') as CountryCode
  const template = CONTRACT_TEMPLATES[code]
  // Si pays connu mais template incomplet (preview), fallback vers FR
  if (!template?.legalBasis) return CONTRACT_TEMPLATES.FR
  return template
}
