// Les favoris sont dans l'onglet Moi de l'espace Formations (23/11/2026)
import { redirect } from 'next/navigation'

export default function FavorisPage() {
  redirect('/dashboard/formations?onglet=moi')
}
