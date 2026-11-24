import { redirect } from 'next/navigation'

// Page fondue dans /dashboard/admin/pros le 24/11/2026 (option A : Hôtes et Pros)
export default function Page() {
  redirect('/dashboard/admin/pros?metier=depannage')
}
