import { BillingEditorPage } from '@/components/pros/billing/BillingPages'

export const metadata = { title: 'Devis, Dépannage' }
export const dynamic = 'force-dynamic'

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ client?: string; contact?: string }>
}) {
  const { id } = await params
  const sp = (await searchParams) ?? {}
  return <BillingEditorPage kind="depannage" id={id} searchParams={sp} />
}
