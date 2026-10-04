#!/usr/bin/env node
// Diagnostic des paiements de contrats (04/10/2026). Journaux publics :
// aucun nom, e-mail ni montant, seulement des identifiants courts, statuts,
// pourcentages et dates.
const SUPABASE_URL = process.env.SUPABASE_URL
const KEY = process.env.SERVICE_KEY
if (!SUPABASE_URL || !KEY) { console.error('Secrets Supabase absents'); process.exit(1) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const notice = (title, body) => console.log(`::notice title=${title}::${String(body).replace(/\n/g, '%0A')}`)
async function get(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H })
  if (!res.ok) throw new Error(`${path.split('?')[0]} : ${res.status} ${await res.text()}`)
  return res.json()
}
const count = (rows, k) => rows.reduce((m, r) => (m[r[k] ?? 'vide'] = (m[r[k] ?? 'vide'] || 0) + 1, m), {})

const all = await get('contracts?select=id,statut,stripe_payment_enabled,stripe_payment_status,stripe_deposit_status,acompte_percent,created_at&limit=2000')
const online = all.filter(c => c.stripe_payment_enabled)
notice('Contrats', `${all.length} contrats, ${online.length} avec paiement en ligne · loyer : ${JSON.stringify(count(online, 'stripe_payment_status'))} · caution : ${JSON.stringify(count(all.filter(c => c.stripe_deposit_status), 'stripe_deposit_status'))}`)

const evts = await get('stripe_webhook_events?select=type,created_at&order=created_at.desc&limit=1000')
notice('Événements Stripe reçus (1000 derniers)', JSON.stringify(count(evts, 'type')) + ` · dernier : ${evts[0]?.created_at ?? 'aucun'}`)

const target = await get('contracts?select=id,statut,signature_date,stripe_payment_enabled,stripe_payment_status,stripe_payment_checkout_id,stripe_payment_intent_id,acompte_percent,stripe_deposit_status,created_at,updated_at&date_arrivee=eq.2026-10-17&date_depart=eq.2026-10-21')
notice('Contrat du 17 au 21 octobre', target.length ? target.map(c => `${c.id.slice(0, 8)} · ${c.statut} · signé ${c.signature_date ?? '-'} · paiement en ligne ${c.stripe_payment_enabled ? 'oui' : 'non'} · acompte ${c.acompte_percent ?? 100} % · loyer ${c.stripe_payment_status ?? 'vide'} · session ${c.stripe_payment_checkout_id ? 'oui' : 'non'} · paiement Stripe ${c.stripe_payment_intent_id ? 'oui' : 'non'} · caution ${c.stripe_deposit_status ?? 'vide'} · modifié ${c.updated_at ?? '-'}`).join('\n') : 'aucun')
