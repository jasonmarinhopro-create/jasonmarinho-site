import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import ContractView from './ContractView'
import { toUiLang } from '@/lib/sign-ui-i18n'

// Toujours servir depuis le serveur (pas de cache), la signature doit être fraîche
export const dynamic = 'force-dynamic'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      // Force Next.js à ne jamais mettre en cache les requêtes du SDK Supabase
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, cache: 'no-store' }),
      },
    }
  )
}

function nights(arrivee: string, depart: string) {
  return Math.round((new Date(depart).getTime() - new Date(arrivee).getTime()) / 86400000)
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return {
    title: 'Contrat de location, Signature',
    description: 'Signez votre contrat de location électroniquement.',
    robots: 'noindex, nofollow',
    other: { token },
  }
}

export default async function SignPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ deposit?: string; payment?: string }>
}) {
  // Désactive TOUT le data cache Next.js pour cette page, critique pour avoir
  // le statut de signature à jour immédiatement après la signature
  noStore()

  const { token } = await params
  const { deposit: depositParam, payment: paymentParam } = await searchParams
  const supabase = createServiceClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !contract) return notFound()

  // Vérifier si le visiteur est le bailleur (propriétaire), il ne doit pas pouvoir signer
  const authClient = await createAuthClient()
  const { data: { user: authUser } } = await authClient.auth.getUser()
  const isViewerBailleur = !!(authUser && authUser.id === contract.user_id)

  const expired = new Date(contract.token_expires_at) < new Date()
  const alreadySigned = contract.statut === 'signe'
  const cancelled = contract.statut === 'annule'
  const n = nights(contract.date_arrivee, contract.date_depart)

  // Template juridique adapté au pays du logement (FR par défaut).
  // Pour les contrats créés avant l'ajout de la colonne pays, fallback FR.
  const contractPays: string = (contract as any).pays ?? 'FR'

  // Langue du contrat (fr ou pt, choisie à la création) : sert de langue par
  // défaut sur /sign, l'internaute peut ensuite basculer FR/PT/EN à volonté
  // via le sélecteur en haut de page (cf. migration 099, ContractView.tsx).
  const initialLang = toUiLang((contract as any).langue)

  // Stripe + IBAN : récupérer le profil du bailleur
  const { data: bailProfile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete, iban, bic')
    .eq('id', contract.user_id)
    .single()
  const stripeReady = !!(bailProfile?.stripe_account_id && bailProfile?.stripe_onboarding_complete)

  // Conciergerie : si le logement a son propre IBAN (propriétaire tiers géré
  // par l'utilisateur), il est prioritaire sur profiles.iban — l'argent doit
  // aller au propriétaire du bien, pas à l'utilisateur connecté (cf. migration 098).
  let logementIban: string | null = null
  let logementBic: string | null = null
  if (contract.logement_id) {
    const { data: logement } = await supabase
      .from('logements')
      .select('iban, bic')
      .eq('id', contract.logement_id)
      .single()
    logementIban = logement?.iban ?? null
    logementBic = logement?.bic ?? null
  }
  const hostIban = logementIban ?? bailProfile?.iban ?? null
  const hostBic = logementIban ? logementBic : (bailProfile?.bic ?? null)

  // Caution
  const hasDeposit = Number(contract.montant_caution) > 0
  const depositAlreadyHeld = contract.stripe_deposit_status === 'held'
    || contract.stripe_deposit_status === 'captured'

  // Paiement réservation — acompte_percent < 100 : seule une part du loyer
  // est encaissée en ligne pour bloquer la réservation (cf. migration 097),
  // le solde étant à régler par le locataire selon les modalités convenues.
  const paymentEnabled = !!(contract.stripe_payment_enabled)
  const paymentAlreadyDone = contract.stripe_payment_status === 'paid'
  const acomptePercent = Number(contract.acompte_percent ?? 100)
  const montantAcompte = Number(contract.montant_loyer) * acomptePercent / 100
  const montantSolde = Number(contract.montant_loyer) - montantAcompte

  return (
    <ContractView
      token={token}
      contract={contract}
      contractPays={contractPays}
      initialLang={initialLang}
      isViewerBailleur={isViewerBailleur}
      expired={expired}
      cancelled={cancelled}
      alreadySigned={alreadySigned}
      n={n}
      hostIban={hostIban}
      hostBic={hostBic}
      stripeReady={stripeReady}
      paymentEnabled={paymentEnabled}
      paymentAlreadyDone={paymentAlreadyDone}
      hasDeposit={hasDeposit}
      depositAlreadyHeld={depositAlreadyHeld}
      acomptePercent={acomptePercent}
      montantAcompte={montantAcompte}
      montantSolde={montantSolde}
      paymentParam={paymentParam}
      depositParam={depositParam}
    />
  )
}
