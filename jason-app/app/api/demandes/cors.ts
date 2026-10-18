// CORS des routes de la demande inversée, appelées depuis jasonmarinho.com
const ALLOWED = new Set(['https://jasonmarinho.com', 'https://www.jasonmarinho.com', 'https://app.jasonmarinho.com', 'http://localhost:3000', 'http://localhost:5500', 'http://localhost:8765'])

export function cors(origin: string | null, methods = 'POST, OPTIONS') {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED.has(origin) ? origin : 'https://jasonmarinho.com',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}
