import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth-user'
import FacturationPartenaires from '@/components/pros/FacturationPartenaires'

export const metadata = { title: 'Facturation, Ménage' }

export default async function Page() {
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?as=menage')
  return <FacturationPartenaires kind="cleaner" />
}
