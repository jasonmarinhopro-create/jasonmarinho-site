import { BillingHubPage } from '@/components/pros/billing/BillingPages'

export const metadata = { title: 'Devis & factures, Ménage' }
export const dynamic = 'force-dynamic'

export default function Page() {
  return <BillingHubPage kind="cleaner" />
}
