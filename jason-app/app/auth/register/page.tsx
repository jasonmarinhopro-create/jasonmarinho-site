// Inscription (refonte du 31/10/2026) : la page lit côté serveur si Google est
// activé dans Supabase, puis affiche le parcours (RegisterFlow).
import { Suspense } from 'react'
import { googleActif } from '@/lib/auth/google'
import RegisterFlow from './RegisterFlow'

export const revalidate = 600

export default async function RegisterPage() {
  const google = await googleActif()
  return (
    <Suspense fallback={null}>
      <RegisterFlow google={google} />
    </Suspense>
  )
}
