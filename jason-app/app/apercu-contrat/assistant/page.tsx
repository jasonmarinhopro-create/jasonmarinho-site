'use client'

// Aperçu du contrat en cours de création dans l'assistant (ContractModal) :
// l'assistant dépose le contrat d'exemple dans le stockage local puis ouvre
// cet onglet. Rien n'est enregistré en base tant que l'hôte n'a pas cliqué
// sur « Créer le contrat ».

import { useEffect, useState } from 'react'
import ContractView from '../../sign/[token]/ContractView'
import { WIZARD_PREVIEW_KEY, type ContractPreviewData } from '@/lib/contracts/preview'

type Stored = ContractPreviewData & { hostIban: string | null; hostBic: string | null }

export default function ApercuAssistantPage() {
  const [data, setData] = useState<Stored | null | undefined>(undefined)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WIZARD_PREVIEW_KEY)
      setData(raw ? JSON.parse(raw) as Stored : null)
    } catch {
      setData(null)
    }
  }, [])

  if (data === undefined) return null
  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)', color: 'var(--text-2)', textAlign: 'center' }}>
        Aperçu introuvable : ouvre-le depuis l&apos;assistant de contrat, bouton « Voir le contrat ».
      </div>
    )
  }
  const c = data.contract
  const acompte = c.montant_loyer * data.acomptePercent / 100
  return (
    <ContractView
      token="apercu"
      contract={c as never}
      contractPays={data.pays}
      initialLang={(c.langue as 'fr' | 'pt' | undefined) ?? 'fr'}
      isViewerBailleur={false}
      expired={false}
      cancelled={false}
      alreadySigned={false}
      n={data.nights}
      hostIban={data.hostIban}
      hostBic={data.hostBic}
      stripeReady={false}
      paymentEnabled={c.stripe_payment_enabled}
      paymentAlreadyDone={false}
      hasDeposit={c.montant_caution > 0}
      depositAlreadyHeld={false}
      depositState="not_yet"
      depositOpens=""
      acomptePercent={data.acomptePercent}
      montantAcompte={acompte}
      montantSolde={c.montant_loyer - acompte}
      preview={{
        title: 'Aperçu avant envoi',
        note: 'Voici exactement ce que ton voyageur va lire. Pour changer quelque chose, reviens à l’onglet de l’assistant : rien n’est envoyé tant que tu n’as pas cliqué sur « Créer le contrat ».',
      }}
    />
  )
}
