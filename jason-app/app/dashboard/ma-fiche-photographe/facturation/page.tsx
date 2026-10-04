import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth-user'
import FacturationPartenaires from '@/components/pros/FacturationPartenaires'

export const metadata = { title: 'Facturation, Photographe' }

export default async function Page() {
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?as=photographe')
  return <FacturationPartenaires kind="photographer" />
}
