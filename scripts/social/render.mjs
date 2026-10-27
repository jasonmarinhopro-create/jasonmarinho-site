// Rendu des visuels d'une publication (24/10/2026) : PNG 1080 x 1350 pour le
// carrousel et la photo simple, MP4 1080 x 1920 (30 i/s, piste son muette)
// pour le Reel. Chromium (Playwright) rend les gabarits de templates.mjs,
// servis depuis la racine du dépôt (polices et logo du site), ffmpeg assemble
// les images du Reel.
//   node scripts/social/render.mjs <spec.json> <dossier de sortie>

import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { SIZES, normalizeSlides, slideHtml, sceneDuration, storyHtml, storyFrameHtml, assertNoBlank } from './templates.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FPS = 30
const TYPES = { '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.html': 'text/html; charset=utf-8' }

/** Serveur local : /__slide renvoie la page en cours, le reste vient du dépôt. */
function serve(cover = null) {
  let current = ''
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0])
    if (url === '/__slide') { res.writeHead(200, { 'content-type': TYPES['.html'] }); return res.end(current) }
    // Couverture du post rendue juste avant (dossier temporaire, hors dépôt)
    if (url === '/__cover' && cover) { res.writeHead(200, { 'content-type': TYPES[path.extname(cover)] || 'image/png' }); return fs.createReadStream(cover).pipe(res) }
    const file = path.join(ROOT, path.normalize(url).replace(/^(\.\.[/\\])+/, ''))
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    base: `http://127.0.0.1:${server.address().port}`,
    set: html => { current = html },
    close: () => server.close(),
  })))
}

async function launch() {
  const { chromium } = createRequire(import.meta.url)('playwright')
  return chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
}

async function load(page, srv, html) {
  srv.set(assertNoBlank(html))
  await page.goto(`${srv.base}/__slide`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
}

/** Carrousel ou photo simple : une image par diapositive. */
export async function renderFeed(spec, outDir) {
  const slides = normalizeSlides(spec)
  const size = SIZES.feed
  const srv = await serve()
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: size.w, height: size.h } })
  const files = []
  try {
    const list = spec.format === 'photo' ? [0] : slides.map((_, i) => i)
    for (const i of list) {
      await load(page, srv, slideHtml(spec, slides, i, size))
      const f = path.join(outDir, `slide-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: f })
      files.push(f)
    }
  } finally { await browser.close(); srv.close() }
  return files
}

/** Reel : scènes animées (texte qui apparaît, barres de progression, lent zoom de la photo). */
export async function renderReel(spec, outDir) {
  const slides = normalizeSlides(spec)
  const size = SIZES.reel
  const frames = fs.mkdtempSync(path.join(outDir, 'frames-'))
  const srv = await serve()
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: size.w, height: size.h } })
  let n = 0
  try {
    for (let i = 0; i < slides.length; i++) {
      const dur = sceneDuration(slides[i])
      await load(page, srv, slideHtml(spec, slides, i, size, { reel: true }))
      const last = i === slides.length - 1
      for (let f = 0; f < Math.round(dur * FPS); f++) {
        const t = f / FPS
        await page.evaluate(({ t, dur, i, last }) => {
          const clamp = v => Math.max(0, Math.min(1, v))
          const out = last ? 1 : clamp((dur - t) / 0.3)
          document.querySelectorAll('[data-in]').forEach(el => {
            const p = clamp((t - Number(el.dataset.in)) / 0.55)
            const e = 1 - Math.pow(1 - p, 3)
            el.style.opacity = String(e * out)
            el.style.transform = `translateY(${((1 - e) * 36).toFixed(1)}px)`
          })
          document.querySelectorAll('[data-kb]').forEach(el => { el.style.transform = `scale(${(1 + 0.07 * t / dur).toFixed(4)})` })
          document.querySelectorAll('[data-bar]').forEach(el => {
            const k = Number(el.dataset.bar)
            el.style.width = k < i ? '100%' : k > i ? '0%' : `${(100 * t / dur).toFixed(2)}%`
          })
        }, { t, dur, i, last })
        await page.screenshot({ path: path.join(frames, `${String(n++).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 })
      }
    }
  } finally { await browser.close(); srv.close() }
  const ffmpeg = process.env.FFMPEG || 'ffmpeg'
  const mp4 = path.join(outDir, 'reel.mp4')
  execFileSync(ffmpeg, ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(frames, '%05d.jpg'),
    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', mp4])
  // Couverture : la première scène, une fois le texte affiché
  const cover = path.join(outDir, 'cover.jpg')
  fs.copyFileSync(path.join(frames, `${String(Math.min(n - 1, Math.round(1.8 * FPS))).padStart(5, '0')}.jpg`), cover)
  fs.rmSync(frames, { recursive: true, force: true })
  return { mp4, cover, seconds: n / FPS }
}

/** Story qui annonce le post : la couverture (slide-01.png ou cover.jpg du Reel) en carte. */
export async function renderStory(spec, coverFile, outDir) {
  const srv = await serve(coverFile)
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
  const f = path.join(outDir, 'story-annonce.png')
  try {
    await load(page, srv, storyHtml(spec, '/__cover'))
    await page.screenshot({ path: f })
  } finally { await browser.close(); srv.close() }
  return f
}

/** Écrans d'une série de stories (chiffre, astuce, question…) : story-01.png, story-02.png… */
export async function renderStoryFrames(spec, frames, outDir) {
  const srv = await serve()
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
  const files = []
  try {
    for (let i = 0; i < frames.length; i++) {
      await load(page, srv, storyFrameHtml(spec, frames, i))
      const f = path.join(outDir, `story-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: f })
      files.push(f)
    }
  } finally { await browser.close(); srv.close() }
  return files
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [specPath, outDir] = process.argv.slice(2)
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
  fs.mkdirSync(outDir, { recursive: true })
  if (spec.format === 'stories') {
    console.log(JSON.stringify(await renderStoryFrames(spec, spec.frames, outDir)))
  } else {
    const res = spec.format === 'reel' ? await renderReel(spec, outDir) : await renderFeed(spec, outDir)
    const frames = spec.story?.frames?.length ? await renderStoryFrames(spec, spec.story.frames, outDir) : []
    const story = spec.story === false ? null : await renderStory(spec, spec.format === 'reel' ? res.cover : res[0], outDir)
    console.log(JSON.stringify({ res, frames, story }))
  }
}
