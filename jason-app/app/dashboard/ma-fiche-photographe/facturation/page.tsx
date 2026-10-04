import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth-user'
import FacturationPartenaires from '@/components/pros/FacturationPartenaires'
import { getProOwner, loadBillingProfile } from '@/lib/pros/billing-server'

export const metadata = { title: 'Facturation, Photographe' }

export default async function Page() {
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?as=photographe')
  // « J'ai déjà un outil » (page Devis) : les partenaires sont repliés
  const owner = await getProOwner('photographer')
  const profile = owner ? (await loadBillingProfile('photographer', owner)).profile : null
  return <FacturationPartenaires kind="photographer" hasTool={!!profile?.has_invoicing_tool} tool={profile?.invoicing_tool ?? null} />
}
