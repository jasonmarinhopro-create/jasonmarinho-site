// SERVER ONLY — client SIBA Web Service (Portugal).
// Génère le XML MovimentoBAL (schéma bal.xsd), l'enveloppe SOAP 1.2
// EntregaBoletinsAlojamento, envoie au portail et parse la réponse.
//
// Références :
//  - https://siba.ssi.gov.pt/ajuda/perguntas-tecnicas/ (spec officielle)
//  - Retour '0' = boletins acceptés (email de confirmation envoyé par SIBA)
//  - Retour ≠ 0 = XML d'erreurs ErrosBA/RetornoBA (code + ligne + description)

const SIBA_ENDPOINT = 'https://siba.ssi.gov.pt/baws/boletinsalojamento.asmx'

// ── ISO 3166-1 alpha-2 → alpha-3 (SIBA exige l'alpha-3) ─────────────────────
// Couvre lib/nationalites.ts + le Portugal. Compléter si la liste s'étend.
const ISO2_TO_ISO3: Record<string, string> = {
  FR: 'FRA', BE: 'BEL', CH: 'CHE', LU: 'LUX', CA: 'CAN', MC: 'MCO',
  DE: 'DEU', ES: 'ESP', IT: 'ITA', PT: 'PRT', GB: 'GBR', NL: 'NLD',
  AT: 'AUT', PL: 'POL', CZ: 'CZE', RO: 'ROU', HU: 'HUN', GR: 'GRC',
  SE: 'SWE', DK: 'DNK', NO: 'NOR', FI: 'FIN', IE: 'IRL', HR: 'HRV',
  RS: 'SRB', UA: 'UKR', RU: 'RUS', TR: 'TUR', MA: 'MAR', TN: 'TUN',
  DZ: 'DZA', SN: 'SEN', CI: 'CIV', CM: 'CMR', US: 'USA', MX: 'MEX',
  BR: 'BRA', AR: 'ARG', CO: 'COL', CN: 'CHN', JP: 'JPN', KR: 'KOR',
  IN: 'IND', AU: 'AUS', NZ: 'NZL', ZA: 'ZAF', AE: 'ARE', MU: 'MUS',
  RE: 'REU', GP: 'GLP', MQ: 'MTQ', PF: 'PYF',
}

export function toIso3(iso2: string | null | undefined): string | null {
  if (!iso2) return null
  return ISO2_TO_ISO3[iso2.toUpperCase()] ?? null
}

import type { SibaDocType } from './siba-shared'
export type { SibaDocType }

export interface SibaUnit {
  /** NIPC/NIF de l'entité exploratrice (9 chiffres) */
  nipc: string
  /** N° d'établissement attribué par SIBA (souvent '00') */
  estabelecimento: string
  /** Chave de ativação */
  chave: string
  nome: string
  abreviatura: string
  morada: string
  localidade: string
  codigoPostal: string
  zonaPostal: string
  telefone: string
  nomeContacto: string
  emailContacto: string
}

export interface SibaGuest {
  apelido: string
  nome: string
  /** ISO-3 */
  nacionalidade: string
  /** yyyy-mm-dd */
  dataNascimento: string
  documentoNumero: string
  /** ISO-3 */
  paisEmissorDocumento: string
  tipoDocumento: SibaDocType
  /** yyyy-mm-dd */
  dataEntrada: string
  /** yyyy-mm-dd (optionnelle) */
  dataSaida?: string | null
  /** ISO-3 */
  paisResidencia: string
  localResidencia: string
}

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

// ── Limites de longueur du schéma officiel bal.xsd ──────────────────────────
// SIBA rejette tout champ trop long (erreur 75 « greater than the MaxLength »).
// On tronque défensivement ICI, au seul point de construction du XML, pour
// couvrir l'envoi manuel ET l'envoi automatique post-check-in.

function trunc(s: string, max: number): string {
  const v = s.trim()
  return v.length <= max ? v : v.slice(0, max).trimEnd()
}

/** Adresse : coupe aux virgules pour rester lisible (« 15 rua da Eira, Granja »
 *  plutôt qu'une coupure en plein mot), fallback troncature brute. */
function fitMorada(s: string, max = 40): string {
  const v = s.trim()
  if (v.length <= max) return v
  const parts = v.split(',').map(p => p.trim()).filter(Boolean)
  let out = ''
  for (const p of parts) {
    const next = out ? `${out}, ${p}` : p
    if (next.length > max) break
    out = next
  }
  return out || trunc(v, max)
}

/** Téléphone : chiffres uniquement, max 10 (garde la fin = numéro national
 *  quand un indicatif pays fait dépasser, ex. +33 6 30 21 25 92). */
function fitPhone(s: string, max = 10): string {
  const digits = s.replace(/\D/g, '')
  if (!digits) return ''
  return digits.length <= max ? digits : digits.slice(-9)
}

/** Date jour → ISO datetime midi UTC (SIBA accepte le format ISO complet). */
function dayToIso(day: string): string {
  return new Date(day + 'T12:00:00.000Z').toISOString()
}

/** XML MovimentoBAL conforme bal.xsd (namespace http://sef.pt/BAws). */
export function buildMovimentoBalXml(unit: SibaUnit, guest: SibaGuest, fileNumber: number): string {
  const e = escXml
  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<MovimentoBAL xmlns="http://sef.pt/BAws">' +
      '<Unidade_Hoteleira>' +
        `<Codigo_Unidade_Hoteleira>${e(trunc(unit.nipc, 9))}</Codigo_Unidade_Hoteleira>` +
        `<Estabelecimento>${e(trunc(unit.estabelecimento, 2))}</Estabelecimento>` +
        `<Nome>${e(trunc(unit.nome, 40))}</Nome>` +
        `<Abreviatura>${e(trunc(unit.abreviatura, 15))}</Abreviatura>` +
        `<Morada>${e(fitMorada(unit.morada))}</Morada>` +
        `<Localidade>${e(trunc(unit.localidade, 30))}</Localidade>` +
        `<Codigo_Postal>${e(trunc(unit.codigoPostal, 4))}</Codigo_Postal>` +
        `<Zona_Postal>${e(trunc(unit.zonaPostal, 3))}</Zona_Postal>` +
        `<Telefone>${e(fitPhone(unit.telefone))}</Telefone>` +
        // Fax : élément OBLIGATOIRE dans bal.xsd (pas de minOccurs=0) même si
        // la valeur importe peu — on reprend le téléphone, comme le portail SIBA
        `<Fax>${e(fitPhone(unit.telefone))}</Fax>` +
        `<Nome_Contacto>${e(trunc(unit.nomeContacto, 40))}</Nome_Contacto>` +
        `<Email_Contacto>${e(trunc(unit.emailContacto, 140))}</Email_Contacto>` +
      '</Unidade_Hoteleira>' +
      '<Boletim_Alojamento>' +
        `<Apelido>${e(trunc(guest.apelido, 40))}</Apelido>` +
        `<Nome>${e(trunc(guest.nome, 40) || ' ')}</Nome>` +
        `<Nacionalidade>${e(guest.nacionalidade)}</Nacionalidade>` +
        `<Data_Nascimento>${dayToIso(guest.dataNascimento)}</Data_Nascimento>` +
        `<Documento_Identificacao>${e(trunc(guest.documentoNumero, 16))}</Documento_Identificacao>` +
        `<Pais_Emissor_Documento>${e(guest.paisEmissorDocumento)}</Pais_Emissor_Documento>` +
        `<Tipo_Documento>${e(guest.tipoDocumento)}</Tipo_Documento>` +
        `<Data_Entrada>${dayToIso(guest.dataEntrada)}</Data_Entrada>` +
        (guest.dataSaida ? `<Data_Saida>${dayToIso(guest.dataSaida)}</Data_Saida>` : '') +
        `<Pais_Residencia_Origem>${e(guest.paisResidencia)}</Pais_Residencia_Origem>` +
        `<Local_Residencia_Origem>${e(trunc(guest.localResidencia, 30))}</Local_Residencia_Origem>` +
      '</Boletim_Alojamento>' +
      '<Envio>' +
        `<Numero_Ficheiro>${fileNumber}</Numero_Ficheiro>` +
        `<Data_Movimento>${new Date().toISOString()}</Data_Movimento>` +
      '</Envio>' +
    '</MovimentoBAL>'
  )
}

/** Enveloppe SOAP 1.2 avec les boletins encodés en Base64. */
export function buildSoapEnvelope(unit: SibaUnit, boletinsXml: string): string {
  const boletinsB64 = Buffer.from(boletinsXml, 'utf-8').toString('base64')
  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
      '<soap12:Body>' +
        '<EntregaBoletinsAlojamento xmlns="http://sef.pt/">' +
          `<UnidadeHoteleira>${escXml(unit.nipc)}</UnidadeHoteleira>` +
          `<Estabelecimento>${escXml(unit.estabelecimento)}</Estabelecimento>` +
          `<ChaveAcesso>${escXml(unit.chave)}</ChaveAcesso>` +
          `<Boletins>${boletinsB64}</Boletins>` +
        '</EntregaBoletinsAlojamento>' +
      '</soap12:Body>' +
    '</soap12:Envelope>'
  )
}

export interface SibaResult {
  ok: boolean
  code: string
  /** Description de l'erreur retournée par SIBA (déjà lisible). */
  errorMessage?: string
}

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&')
}

/** Parse la réponse SOAP : '0' = succès, sinon XML ErrosBA imbriqué. */
export function parseSibaResponse(responseText: string): SibaResult {
  const m = responseText.match(/<EntregaBoletinsAlojamentoResult>([\s\S]*?)<\/EntregaBoletinsAlojamentoResult>/)
  if (!m) return { ok: false, code: 'PARSE', errorMessage: 'Réponse SIBA illisible.' }
  const raw = m[1].trim()
  if (raw === '0') return { ok: true, code: '0' }

  const inner = unescapeXml(raw)
  const code = inner.match(/<Codigo_Retorno>([\s\S]*?)<\/Codigo_Retorno>/)?.[1]?.trim()
  const desc = inner.match(/<Descricao>([\s\S]*?)<\/Descricao>/)?.[1]?.trim()
  return {
    ok: false,
    code: code ?? raw.slice(0, 20),
    errorMessage: desc ?? 'Erreur SIBA sans description.',
  }
}

/** Envoie le boletim au Web Service SIBA. Timeout 20 s. */
export async function submitToSiba(unit: SibaUnit, guest: SibaGuest, fileNumber: number): Promise<SibaResult> {
  const envelope = buildSoapEnvelope(unit, buildMovimentoBalXml(unit, guest, fileNumber))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const res = await fetch(SIBA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
      body: envelope,
      signal: controller.signal,
      cache: 'no-store',
    })
    const text = await res.text()
    if (!res.ok) {
      return { ok: false, code: `HTTP_${res.status}`, errorMessage: `Le portail SIBA a répondu ${res.status}. Réessaye dans quelques minutes.` }
    }
    return parseSibaResponse(text)
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError'
    return {
      ok: false,
      code: aborted ? 'TIMEOUT' : 'NETWORK',
      errorMessage: aborted
        ? 'Le portail SIBA ne répond pas (timeout). Réessaye plus tard.'
        : 'Impossible de joindre le portail SIBA. Vérifie ta connexion et réessaye.',
    }
  } finally {
    clearTimeout(timer)
  }
}
