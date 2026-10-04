// Pages serveur « Devis », communes aux espaces photographe et ménage
// (04/10/2026). Les routes de chaque espace ne font que les appeler.

import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parisToday } from '@/lib/stripe/deposit-window'
import { recentLines, type ProKind } from '@/lib/pros/billing'
import {
  BILLING_BASE, DOC_COLUMNS, getProOwner, loadBillingProfile, loadClients, loadDocuments, normalizeDoc,
} from '@/lib/pros/billing-server'
import BillingHub from './BillingHub'
import DocumentEditor from './DocumentEditor'

const FICHE: Record<ProKind, string> = { photographer: '/dashboard/ma-fiche-photographe', cleaner: '/dashboard/ma-fiche-menage' }
const GUIDE: Record<ProKind, string> = { photographer: '/dashboard/ma-fiche-photographe/facturation', cleaner: '/dashboard/ma-fiche-menage/facturation' }
const LOGIN: Record<ProKind, string> = { photographer: '/auth/login?as=photographe', cleaner: '/auth/login?as=menage' }

export async function BillingHubPage({ kind }: { kind: ProKind }) {
  const owner = await getProOwner(kind)
  if (!owner) redirect(FICHE[kind])
  const [{ profile, saved }, { docs, tableMissing }] = await Promise.all([
    loadBillingProfile(kind, owner),
    loadDocuments(kind, owner),
  ])
  return (
    <BillingHub
      kind={kind} base={BILLING_BASE[kind]} guideHref={GUIDE[kind]} docs={docs} profile={profile} profileSaved={saved}
      today={parisToday()} tableMissing={tableMissing}
    />
  )
}

export async function BillingEditorPage({ kind, id, searchParams }: {
  kind: ProKind
  id: string
  searchParams: { client?: string; contact?: string }
}) {
  const owner = await getProOwner(kind)
  if (!owner) redirect(LOGIN[kind])
  const db = await createClient()
  const isNew = id === 'nouveau'
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const [{ profile, saved }, clients, { docs }] = await Promise.all([
    loadBillingProfile(kind, owner),
    loadClients(kind, owner),
    loadDocuments(kind, owner),
  ])

  const doc = isNew ? null : docs.find(d => d.id === id) ?? null
  if (!isNew && !doc) {
    // Pas dans les 500 derniers : lecture directe
    const { data } = await db.from('pro_documents').select(DOC_COLUMNS).eq('id', id).eq('owner_kind', kind).eq('owner_id', owner.proId).maybeSingle()
    if (!data) notFound()
    return renderEditor(normalizeDoc(data as Record<string, unknown>))
  }
  return renderEditor(doc)

  async function renderEditor(d: typeof doc) {
    // Pré-remplissage depuis le carnet ou une demande reçue
    let prefill: Record<string, unknown> | null = null
    if (isNew && searchParams.client) {
      const c = clients.find(x => x.id === searchParams.client)
      if (c) prefill = { client_id: c.id, client_name: c.nom, client_email: c.email ?? '', client_address: c.ville ?? '', title: c.logement ?? '' }
    } else if (isNew && searchParams.contact) {
      const table = kind === 'photographer' ? 'photographer_contacts' : 'cleaner_contacts'
      const col = kind === 'photographer' ? 'photographer_id' : 'cleaner_id'
      const { data: ct } = await db.from(table).select('contact_name, contact_email').eq('id', searchParams.contact).eq(col, owner!.proId).maybeSingle()
      if (ct) prefill = { client_name: ct.contact_name ?? '', client_email: ct.contact_email ?? '' }
    }
    return (
      <DocumentEditor
        kind={kind} base={BILLING_BASE[kind]} guideHref={GUIDE[kind]} doc={d}
        profile={profile} profileSaved={saved} logoUrl={owner!.logoUrl}
        clients={clients} prefill={prefill} recent={recentLines(docs)}
        today={parisToday()}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'}
      />
    )
  }
}
