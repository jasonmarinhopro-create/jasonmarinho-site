import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Tests unitaires des fonctions pures (lib/**) : calculs, parsing, règles.
// Les parcours complets restent dans e2e/ (Playwright).
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts'],
    environment: 'node',
  },
})
