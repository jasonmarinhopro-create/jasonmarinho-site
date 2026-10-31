import { redirect } from 'next/navigation'
import { getAuthIdentity } from '@/lib/supabase/auth-user'
import FacturationPartenaires from '@/components/pros/FacturationPartenaires'
import { getProOwner, loadBillingProfile } from '@/lib/pros/billing-server'

export const metadata = { title: 'Facturation, Dépannage' }

export default async function Page() {
  const user = await getAuthIdentity()
  if (!user) redirect('/auth/login?as=depannage')
  // « J'ai déjà un outil » (page Devis) : les partenaires sont repliés
  const owner = await getProOwner('depannage')
  const profile = owner ? (await loadBillingProfile('depannage', owner)).profile : null
  return <FacturationPartenaires kind="depannage" hasTool={!!profile?.has_invoicing_tool} tool={profile?.invoicing_tool ?? null} />
}
