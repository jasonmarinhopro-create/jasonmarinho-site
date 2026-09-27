'use client'

// Génère et télécharge la fiche individuelle de police (PDF pré-rempli,
// signée électroniquement si le check-in en ligne a été complété).
// Partagé par le widget de l'accueil et la page Déclarations voyageurs
// (historique : une fiche déjà déclarée reste téléchargeable, elle doit être
// conservée 6 mois).

import { nationaliteName } from '@/lib/nationalites'
import { getPoliceFicheContext } from './police-actions'

export async function downloadPoliceFichePdf(declarationId: string, voyageurNom: string): Promise<{ error?: string }> {
  try {
    const ctx = await getPoliceFicheContext(declarationId)
    if ('error' in ctx) return { error: ctx.error }
    // Import dynamique : jsPDF (~350 Ko) ne doit pas alourdir les pages
    const { buildPoliceFichePdf } = await import('./police-fiche-pdf')
    const doc = buildPoliceFichePdf({
      voyageur: {
        ...ctx.voyageur,
        nationalite: ctx.voyageur.nationalite ? nationaliteName(ctx.voyageur.nationalite) : null,
        pays: ctx.voyageur.pays ? nationaliteName(ctx.voyageur.pays) : null,
      },
      // Accompagnants du check-in : <15 ans sur la fiche du principal,
      // 15+ = une page de fiche chacun (générées dans le même PDF)
      companions: ctx.companions.map(c => ({
        ...c,
        nationalite: c.nationalite ? nationaliteName(c.nationalite) : null,
      })),
      sejour: { dateArrivee: ctx.dateArrivee, dateDepart: ctx.dateDepart },
      logement: ctx.logement,
      hoteName: ctx.hoteName,
      signatureDataUrl: ctx.signatureDataUrl,
      signedAt: ctx.signedAt,
    })
    const slug = voyageurNom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    doc.save(`fiche-police-${slug || 'voyageur'}.pdf`)
    return {}
  } catch {
    return { error: 'Génération du PDF impossible, réessaie.' }
  }
}
