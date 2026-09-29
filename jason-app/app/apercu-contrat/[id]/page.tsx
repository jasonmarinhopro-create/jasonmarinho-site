// Aperçu du contrat d'un logement, tel que le voyageur le recevra (exemple de
// voyageur et de dates). Réservé au propriétaire de la fiche ; chaque article
// modifiable renvoie à la carte de la fiche qui le règle.

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parisToday } from '@/lib/stripe/deposit-window'
import { previewFromLogement, showsIban, type PreviewLogement } from '@/lib/contracts/preview'
import ContractView from '../../sign/[token]/ContractView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Aperçu du contrat', robots: { index: false } }

export default async function ApercuContratPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: logement }, { data: profile }] = await Promise.all([
    supabase.from('logements').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('adresse, iban, bic').eq('id', user.id).maybeSingle(),
  ])
  if (!logement) notFound()

  const meta = user.user_metadata ?? {}
  const parts = String(meta.full_name ?? '').trim().split(' ')
  const bailleur = {
    prenom: String(meta.prenom ?? meta.first_name ?? parts[0] ?? ''),
    nom: String(meta.nom ?? meta.last_name ?? parts.slice(1).join(' ')),
    email: user.email ?? '',
    adresse: profile?.adresse ?? null,
  }
  const p = previewFromLogement(logement as PreviewLogement, bailleur, parisToday())
  const c = p.contract
  const ibanSource = logement.iban ? { iban: logement.iban as string, bic: (logement.bic as string | null) ?? null } : profile?.iban ? { iban: profile.iban as string, bic: (profile.bic as string | null) ?? null } : null
  const iban = showsIban(c.modalites_paiement, c.stripe_payment_enabled) ? ibanSource : null
  const fiche = `/dashboard/logements/${id}`
  const acompte = c.montant_loyer * p.acomptePercent / 100

  return (
    <ContractView
      token="apercu"
      contract={c as never}
      contractPays={p.pays}
      initialLang="fr"
      isViewerBailleur={false}
      expired={false}
      cancelled={false}
      alreadySigned={false}
      n={p.nights}
      hostIban={iban?.iban ?? null}
      hostBic={iban?.bic ?? null}
      stripeReady={false}
      paymentEnabled={c.stripe_payment_enabled}
      paymentAlreadyDone={false}
      hasDeposit={c.montant_caution > 0}
      depositAlreadyHeld={false}
      depositState="not_yet"
      depositOpens=""
      acomptePercent={p.acomptePercent}
      montantAcompte={acompte}
      montantSolde={c.montant_loyer - acompte}
      preview={{
        title: `Aperçu du contrat : ${logement.nom}`,
        note: 'Voyageur, dates et prix d’exemple (3 nuits au tarif moyen de ta fiche). Tout le reste vient de ta fiche logement : clique sur « Modifier » à côté d’un article pour le changer.',
        backHref: fiche,
        backLabel: 'Retour à la fiche',
        editLinks: {
          parties: '/dashboard/profil#identite',
          bien: `${fiche}#modifier-caracteristiques`,
          duree: `${fiche}#modifier-accueil`,
          prix: `${fiche}#modifier-tarifs`,
          caution: `${fiche}#modifier-contrat`,
          annulation: `${fiche}#modifier-annulation`,
          reglement: `${fiche}#modifier-reglement`,
          clauses: `${fiche}#modifier-contrat`,
        },
      }}
    />
  )
}
