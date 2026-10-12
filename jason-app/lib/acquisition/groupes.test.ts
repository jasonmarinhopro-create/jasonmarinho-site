import { describe, it, expect } from 'vitest'
import {
  cleanFacebookText, readMessage, findCity, pickResources, buildPrompt, trackUrl, makeGroupCode, applyOverrides, readingTitle, finalLink,
  type CatalogArticle, type CatalogPro,
} from './groupes'

const ARTICLES: CatalogArticle[] = [
  { slug: 'taxe-sejour-lcd-comment-collecter', title: 'Taxe de séjour en LCD : comment la collecter', description: 'Collecter et reverser la taxe de séjour en location courte durée.' },
  { slug: 'micro-bic-abattement-2026-airbnb', title: 'Micro-BIC 2026 : abattement et plafonds', description: 'Abattement de 30 % ou 50 % selon le classement.' },
  { slug: 'trouver-equipe-menage-airbnb-fiable', title: 'Trouver une équipe de ménage fiable', description: 'Recruter une femme de ménage pour ses turnovers.' },
  { slug: 'welcome-bag-lcd-12-idees', title: 'Welcome bag : 12 idées', description: 'Des idées de cadeaux de bienvenue.' },
]
const PROS: CatalogPro[] = [
  { kind: 'menage', slug: 'eclat-lyon', name: 'Clean Lyon', city: 'lyon' },
  { kind: 'photographe', slug: 'photo-lyon', name: 'Studio Lyon', city: 'lyon' },
]

describe('nettoyage du copier-coller Facebook', () => {
  it('retire « Facebook », les lettres isolées et les codes, garde le prénom', () => {
    const raw = 'Facebook\nFacebook\nLocation vacances en station de ski\nCyril Sanchis\ni\nam25ah\nn\n4\nl629uml3h\n1114g204\nAppartement au Corbier tout équipé, reste de la dispo\nJ’aime\nRépondre\n2 h'
    const { text, author, group } = cleanFacebookText(raw)
    expect(author).toBe('Cyril')
    expect(group).toBe('Location vacances en station de ski')
    expect(text).toBe('Appartement au Corbier tout équipé, reste de la dispo')
  })
  it('ne prend pas le nom du groupe pour l\'auteur', () => {
    const { author, group, text } = cleanFacebookText('Facebook\nHôtes Airbnb Annecy\nJulie Martin\nBonjour à tous, je loue mon T2 à Annecy depuis cet été. Comment déclarer la taxe de séjour ?')
    expect(author).toBe('Julie')
    expect(group).toBe('Hôtes Airbnb Annecy')
    expect(text.startsWith('Bonjour à tous')).toBe(true)
  })
})

describe('lecture du message', () => {
  it('question d\'hôte sur la taxe de séjour à Annecy', () => {
    const r = readMessage('Bonjour, je loue mon appartement à Annecy, quelqu’un sait comment déclarer la taxe de séjour quand je loue en direct ?')
    expect(r.profile).toBe('hote')
    expect(r.topics[0]).toBe('taxe')
    expect(r.topics).toContain('direct')
    expect(r.city).toBe('annecy')
    expect(r.clear).toBe(true)
    expect(readingTitle(r)).toBe('Question d\'hôte : taxe de séjour à Annecy')
  })
  it('cherche une femme de ménage à Lyon', () => {
    const r = readMessage('Je cherche une femme de ménage sérieuse sur Lyon 3e pour mes logements, vous connaissez quelqu’un ?')
    expect(r.topics[0]).toBe('menage')
    expect(r.seeksPro).toBe(true)
    expect(r.city).toBe('lyon')
    // « vous » s'adresse au groupe : pas un vouvoiement
    expect(r.usesVous).toBe(false)
    expect(readMessage('Madame, Monsieur, je cherche une conciergerie. Cordialement').usesVous).toBe(true)
  })
  it('un photographe qui propose ses services', () => {
    const r = readMessage('Je suis photographe professionnel à Bordeaux, je propose des shootings pour vos annonces Airbnb')
    expect(r.profile).toBe('pro')
    expect(r.topics).toContain('photo')
  })
  it('un voyageur', () => {
    expect(readMessage('Bonjour, je cherche un logement pour 4 personnes du 12 au 19 août, nous sommes une famille').profile).toBe('voyageur')
  })
  it('message vague', () => {
    const r = readMessage('Bonjour à tous, nouvelle ici !')
    expect(r.vague).toBe(true)
    expect(r.clear).toBe(false)
  })
  it('« à mon avis » ne fait pas un sujet sur les avis', () => {
    expect(readMessage('À mon avis il faut tout prévoir').topics).not.toContain('avis')
  })
})

describe('villes', () => {
  it('reconnaît les villes, avec article ou trait d\'union', () => {
    expect(findCity('un T2 à La Rochelle')).toBe('la-rochelle')
    expect(findCity('vers le Mans')).toBe('le-mans')
    expect(findCity('près de Saint Malo')).toBe('saint-malo')
    expect(findCity('aux Sables d’Olonne')).toBe('les-sables-d-olonne')
    expect(findCity('BORDEAUX centre')).toBe('bordeaux')
  })
  it('ignore les mots courants sans majuscule', () => {
    expect(findCity('il fait des tours de clé')).toBeNull()
    expect(findCity('une maison nice')).toBeNull()
    expect(findCity('les paris sportifs')).toBeNull()
    expect(findCity('visite de Tours')).toBe('tours')
  })
})

describe('ressources', () => {
  it('fiches de l\'annuaire de la ville, puis la page de la ville', () => {
    const text = 'Je cherche une femme de ménage à Lyon pour mes turnovers'
    const res = pickResources({ text, reading: readMessage(text), articles: ARTICLES, pros: PROS })
    expect(res[0]).toMatchObject({ kind: 'pro', url: '/annuaires/menage/eclat-lyon' })
    expect(res.map(r => r.url)).toContain('/menage-lcd-lyon')
    expect(res.map(r => r.url)).not.toContain('/annuaires/photographes/photo-lyon')
  })
  it('taxe de séjour : guide de la ville, article, simulateur', () => {
    const text = 'Comment collecter la taxe de séjour à Annecy en direct ?'
    const urls = pickResources({ text, reading: readMessage(text), articles: ARTICLES, pros: PROS }).map(r => r.url)
    expect(urls[0]).toBe('/devenir-hote-airbnb-annecy')
    expect(urls).toContain('/blog/taxe-sejour-lcd-comment-collecter')
    expect(urls).toContain('/services/simulateurs/taxe-de-sejour')
    expect(urls).not.toContain('/blog/welcome-bag-lcd-12-idees')
  })
  it('rien pour un voyageur ; lien de fin vers Driing', () => {
    const text = 'je cherche un logement pour 4 personnes à Nantes'
    expect(pickResources({ text, reading: readMessage(text), articles: ARTICLES, pros: PROS })).toEqual([])
    expect(finalLink('voyageur', []).url).toBe('https://www.driing.co')
  })
  it('les corrections à la main remplacent la lecture', () => {
    const r = applyOverrides(readMessage('Bonjour à tous'), { city: 'nice', topics: ['fiscal'], profile: 'investisseur' })
    expect(r).toMatchObject({ city: 'nice', topics: ['fiscal'], profile: 'investisseur', vague: false, profileSure: true })
  })
})

describe('message à deux questions', () => {
  it('taxe citée en premier : sujet principal, un lien par question en tête, pas de fait Île-de-France à Annecy', () => {
    const text = 'Je loue mon T2 à Annecy. Comment déclarer la taxe de séjour en direct ? Et je cherche une femme de ménage fiable, vous connaissez ?'
    const reading = readMessage(text)
    expect(reading.topics.slice(0, 2)).toEqual(['taxe', 'menage'])
    expect(readingTitle(reading)).toBe('Cherche un prestataire : ménage à Annecy, et taxe de séjour, réservation directe')
    const res = pickResources({ text, reading, articles: ARTICLES, pros: [{ kind: 'menage', slug: 'net-annecy', name: 'Net Annecy', city: 'annecy' }] })
    expect(res[0].url).toBe('/devenir-hote-airbnb-annecy')
    expect(res[0].why).toBe("règles d'Annecy")
    expect(res[1].url).toBe('/annuaires/menage/net-annecy')
    const p = buildPrompt({ message: text, author: null, reading, resources: res, code: 'gabcdef' })
    expect(p).not.toContain('Île-de-France')
  })
})

describe('suivi et prompt', () => {
  it('ajoute le suivi aux pages du site, pas à Driing', () => {
    expect(trackUrl('/calculateurs/revenus-lcd?ville=Nice', 'gabc234')).toBe('https://jasonmarinho.com/calculateurs/revenus-lcd?ville=Nice&utm_source=facebook&utm_medium=groupe&utm_campaign=gabc234')
    expect(trackUrl('https://app.jasonmarinho.com/auth/register', 'gx')).toContain('app.jasonmarinho.com/auth/register?utm_source=facebook')
    expect(trackUrl('https://www.driing.co', 'gx')).toBe('https://www.driing.co')
  })
  it('code court', () => {
    expect(makeGroupCode(() => 0)).toBe('gaaaaaa')
    expect(makeGroupCode()).toMatch(/^g[a-z2-9]{6}$/)
  })
  it('le prompt contient les faits du sujet, les liens suivis et le message, sans tiret long', () => {
    const text = 'Je loue à Annecy, combien de taxe de séjour pour un meublé non classé ?'
    const reading = readMessage(text)
    const resources = pickResources({ text, reading, articles: ARTICLES, pros: PROS })
    const p = buildPrompt({ message: text, author: 'Julie', reading, resources, code: 'gtest12', group: 'Hôtes Airbnb Haute-Savoie' })
    expect(p).toContain('1 % à 5 % du prix HT')
    expect(p).toContain('https://jasonmarinho.com/devenir-hote-airbnb-annecy?utm_source=facebook&utm_medium=groupe&utm_campaign=gtest12')
    expect(p).toContain('prénom : Julie')
    expect(p).toContain('Hôtes Airbnb Haute-Savoie')
    expect(p).toContain(text)
    expect(p).not.toMatch(/—/)
    const short = buildPrompt({ message: text, author: null, reading, resources, code: 'gtest12', short: true })
    expect(short.length).toBeLessThan(p.length)
    expect(short).not.toContain('RÈGLES')
  })
})

describe('catalogue des articles', () => {
  it('lit le registre du blog du site', async () => {
    const { readFileSync } = await import('node:fs')
    const { parseArticlesData } = await import('./groupes')
    const src = readFileSync(new URL('../../../blog/articles-data.mjs', import.meta.url), 'utf8')
    const list = parseArticlesData(src)
    expect(list.length).toBeGreaterThan(150)
    expect(list.every(a => /^[a-z0-9-]+$/.test(a.slug) && a.title.length > 5)).toBe(true)
    expect(list.some(a => a.title.includes('\\'))).toBe(false)
  })
})
