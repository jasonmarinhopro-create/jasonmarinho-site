import { redirect } from 'next/navigation'
import { loadFinances } from '@/lib/finances/load'
import { createClient } from '@/lib/supabase/server'
import { guessTvaFromMention } from '@/lib/finances/einvoicing'
import FiscaliteContent from './FiscaliteContent'

export const metadata = { title: 'Fiscalité, Mes finances' }
export const dynamic = 'force-dynamic'

export default async function FiscalitePage({ searchParams }: { searchParams: { annee?: string } }) {
  const data = await loadFinances()
  if (!data) redirect('/auth/login')
  // Mention de TVA saisie dans Mon compte → Factures : préremplit « Facture électronique : ta situation »
  const supabase = await createClient()
  const { data: prof } = await supabase.from('profiles').select('mention_tva').eq('id', data.userId).maybeSingle()
  const mention = (prof?.mention_tva as string | null) ?? null
  return (
    <FiscaliteContent
      data={data}
      searchParams={searchParams}
      einvoicing={{ guessedTva: guessTvaFromMention(mention), hasMention: !!mention?.trim() }}
    />
  )
}
