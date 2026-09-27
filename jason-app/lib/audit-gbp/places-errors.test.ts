import { describe, expect, it } from 'vitest'
import { placesAccessAdvice } from './places-errors'

const google = (reason: string, message = 'denied') =>
  `Places searchText 403: {"error":{"code":403,"message":"${message}","status":"PERMISSION_DENIED","details":[{"@type":"type.googleapis.com/google.rpc.ErrorInfo","reason":"${reason}"}]}}`

describe('placesAccessAdvice', () => {
  it('reconnaît les raisons données par Google', () => {
    expect(placesAccessAdvice(google('SERVICE_DISABLED'))).toMatch(/pas activée/)
    expect(placesAccessAdvice(google('API_KEY_HTTP_REFERRER_BLOCKED', 'Requests from referer <empty> are blocked.'))).toMatch(/sites web/)
    expect(placesAccessAdvice(google('API_KEY_IP_ADDRESS_BLOCKED'))).toMatch(/adresses IP/)
    expect(placesAccessAdvice(google('API_KEY_SERVICE_BLOCKED'))).toMatch(/Restrictions d'API/)
    expect(placesAccessAdvice(google('BILLING_DISABLED'))).toMatch(/facturation/)
  })

  it('garde un conseil générique pour un 403 sans raison, rien pour les autres erreurs', () => {
    expect(placesAccessAdvice('Places details 403: forbidden')).toMatch(/Places API \(New\)/)
    expect(placesAccessAdvice("Aucun établissement trouvé pour cette URL")).toBeNull()
  })
})
