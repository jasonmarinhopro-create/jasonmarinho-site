// Connexion : la page lit côté serveur si Google est activé dans Supabase,
// puis affiche le formulaire (LoginClient).
import { googleActif } from '@/lib/auth/google'
import LoginClient from './LoginClient'

export const revalidate = 600

export default async function LoginPage() {
  return <LoginClient google={await googleActif()} />
}
