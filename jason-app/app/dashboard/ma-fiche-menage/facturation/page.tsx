import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth-user'
import FacturationPartenaires from '@/components/pros/FacturationPartenaires'
import { getProOwner, loadBillingProfile } from '@/lib/pros/billing-server'

export const metadata = { title: 'Facturation, Ménage' }

export default async function Page() {
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?as=menage')
  // « J'ai déjà un outil » (page Devis) : les partenaires sont repliés
  const owner = await getProOwner('cleaner')
  const profile = owner ? (await loadBillingProfile('cleaner', owner)).profile : null
  return <FacturationPartenaires kind="cleaner" hasTool={!!profile?.has_invoicing_tool} tool={profile?.invoicing_tool ?? null} />
}
