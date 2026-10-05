'use server'

import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/queries/profile'
import { sendMemberMailBatch } from '@/lib/admin/member-mail-send'

export async function sendMemberMails() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') return { sent: 0, remaining: 0, failed: 0, error: 'Réservé à l\'admin.' }
  const res = await sendMemberMailBatch()
  revalidatePath('/dashboard/admin/ventes')
  return res
}
