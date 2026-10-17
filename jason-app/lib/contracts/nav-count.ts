// Compteur du menu hôte sur « Contrats & paiements » (17/10/2026) : nombre
// d'éléments du bloc « À traiter » de la page (contrats à faire signer, loyers
// pas encore encaissés, cautions à décider ou à renvoyer), mêmes règles
// (lib/contracts/todo.ts). Client utilisateur sous RLS ; une erreur donne 0.
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { contractTodos, contractTodoCount, type ContractTodoInput } from './todo'
import { parisToday } from '@/lib/stripe/deposit-window'

export async function loadContractTodoCount(userId: string): Promise<number> {
  try {
    const db = await createClient()
    const { data, error } = await db
      .from('contracts')
      .select('id, statut, date_arrivee, date_depart, stripe_payment_enabled, stripe_payment_status, stripe_deposit_status')
      .eq('user_id', userId)
      .neq('statut', 'annule')
      .limit(500)
    if (error) return 0
    return contractTodoCount(contractTodos((data ?? []) as ContractTodoInput[], parisToday()))
  } catch {
    return 0
  }
}
