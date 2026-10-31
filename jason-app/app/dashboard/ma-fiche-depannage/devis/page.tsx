import { BillingHubPage } from '@/components/pros/billing/BillingPages'

export const metadata = { title: 'Devis, Dépannage' }
export const dynamic = 'force-dynamic'

export default function Page() {
  return <BillingHubPage kind="depannage" />
}
