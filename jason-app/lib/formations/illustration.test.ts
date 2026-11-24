import { describe, it, expect } from 'vitest'
import { stepTheme } from './illustration'

describe('stepTheme', () => {
  it('choisit le thème du titre de l étape', () => {
    expect(stepTheme('Remplir ta fiche GBP à 100 %', 'x')).toBe('google')
    expect(stepTheme('La règle des tiers en 2 minutes', 'Photo')).toBe('loi')
    expect(stepTheme('Exercice, avant la séance photo', 'x')).toBe('exercice')
    expect(stepTheme('Choisir entre micro-BIC et réel', 'x')).toBe('fiscal')
    expect(stepTheme('Les erreurs qui coûtent cher', 'x')).toBe('alerte')
  })
  it('se rabat sur le titre de la leçon, puis sur « livre »', () => {
    expect(stepTheme(null, 'Trouver ton prix de base')).toBe('prix')
    expect(stepTheme('Zzz', 'Qqq')).toBe('livre')
  })
})
