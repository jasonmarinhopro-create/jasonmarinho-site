'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  WifiHigh, HouseSimple, ListChecks, Phone, Translate,
  CheckCircle, ArrowLeft, ArrowRight, DownloadSimple,
  ArrowsClockwise, Lock, Palette,
  Cigarette, Moon, MusicNote, PawPrint, Drop,
  Recycle, Footprints,
  Car, Clock, Thermometer, BookOpen, Trash,
} from '@phosphor-icons/react/dist/ssr'
import { saveAffiche, getAfficheByLogement } from './actions'

interface Logement {
  id: string
  nom: string
  adresse?: string
  wifi_nom?: string
  wifi_mdp?: string
}

type Lang = 'fr' | 'en'
type RuleId =
  | 'no-smoking'
  | 'quiet-hours'
  | 'no-pets'
  | 'pets-ok'
  | 'no-parties'
  | 'no-shoes'
  | 'recycling'
  | 'lock-up'
  | 'save-water'

interface InfoBlock {
  enabled: boolean
  text?: string
  // host-specific
  name?: string
  phone?: string
  // checkout-specific
  time?: string
  // guide-specific
  url?: string
}

interface AfficheData {
  language: Lang
  logementNom: string
  tagline?: string
  logoUrl?: string

  wifiSsid?: string
  wifiPassword?: string

  blocks: {
    host: InfoBlock
    checkout: InfoBlock
    parking: InfoBlock
    waste: InfoBlock
    climate: InfoBlock
    guide: InfoBlock
  }

  selectedRules: RuleId[]
  showEmergency: boolean
  accentColor: string
}

interface Props {
  plan: string
  logements: Logement[]
}

const STEPS = [
  { id: 'logement',  label: 'Accueil',         icon: HouseSimple },
  { id: 'wifi',      label: 'WiFi',            icon: WifiHigh },
  { id: 'practical', label: 'Infos pratiques', icon: ListChecks },
  { id: 'rules',     label: 'Règles maison',   icon: Lock },
  { id: 'emergency', label: 'Urgences',        icon: Phone },
  { id: 'style',     label: 'Style & export',  icon: Palette },
] as const

type StepId = (typeof STEPS)[number]['id']

const ACCENT_COLORS = [
  { id: '#374151', label: 'Ardoise' },
  { id: '#D9612E', label: 'Coral' },
  { id: '#1e3a5f', label: 'Marine' },
  { id: '#7c3aed', label: 'Violet' },
  { id: '#b45309', label: 'Ambre' },
  { id: '#0f766e', label: 'Teal' },
]

// Translation table
const T = {
  welcomeFr: 'Bienvenue',
  welcomeEn: 'Welcome',
  wifi: { fr: 'WiFi', en: 'Wi-Fi' },
  password: { fr: 'Mot de passe', en: 'Password' },
  scanToConnect: { fr: 'Scannez pour vous connecter', en: 'Scan to connect' },
  host: { fr: 'Votre hôte', en: 'Your host' },
  checkout: { fr: 'Départ', en: 'Check-out' },
  parking: { fr: 'Parking', en: 'Parking' },
  waste: { fr: 'Tri sélectif', en: 'Recycling' },
  climate: { fr: 'Chauffage · Clim', en: 'Heating · AC' },
  guide: { fr: 'Livret d\'accueil', en: 'Guest guide' },
  rules: { fr: 'Règles maison', en: 'House rules' },
  emergency: { fr: 'Urgences', en: 'Emergency' },
  taglineDefault: { fr: 'Voici ce qu\'il faut savoir pour votre séjour', en: 'Here is what you need for your stay' },
}

interface RuleDef {
  id: RuleId
  fr: string
  en: string
  // canvas drawing function
  draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) => void
}

const RULES: RuleDef[] = [
  {
    id: 'no-smoking', fr: 'Non-fumeur', en: 'No smoking',
    draw: (ctx, cx, cy, r, c) => drawIconCircle(ctx, cx, cy, r, c, false, () => drawCigarette(ctx, cx, cy, r, c, true)),
  },
  {
    id: 'quiet-hours', fr: 'Calme la nuit', en: 'Quiet at night',
    draw: (ctx, cx, cy, r, c) => drawIconCircle(ctx, cx, cy, r, c, false, () => drawMoon(ctx, cx, cy, r, c)),
  },
  {
    id: 'no-parties', fr: 'Pas de fêtes', en: 'No parties',
    draw: (ctx, cx, cy, r, c) => drawIconCircle(ctx, cx, cy, r, c, false, () => drawMusicNote(ctx, cx, cy, r, c, true)),
  },
  {
    id: 'no-pets', fr: 'Pas d\'animaux', en: 'No pets',
    draw: (ctx, cx, cy, r, c) => drawIconCircle(ctx, cx, cy, r, c, false, () => drawPaw(ctx, cx, cy, r, c, true)),
  },
  {
    id: 'pets-ok', fr: 'Animaux OK', en: 'Pets welcome',
    draw: (ctx, cx, cy, r, c) => drawIconCircle(ctx, cx, cy, r, c, true, () => drawPaw(ctx, cx, cy, r, c, false)),
  },
  {
    id: 'no-shoes', fr: 'Sans chaussures', en: 'No shoes inside',
    draw: (ctx, cx, cy, r, c) => drawIconCircle(ctx, cx, cy, r, c, false, () => drawShoe(ctx, cx, cy, r, c, true)),
  },
  {
    id: 'recycling', fr: 'Tri sélectif', en: 'Sort recycling',
    draw: (ctx, cx, cy, r, c) => drawIconCircle(ctx, cx, cy, r, c, true, () => drawRecycle(ctx, cx, cy, r, c)),
  },
  {
    id: 'lock-up', fr: 'Fermer à clé', en: 'Lock when leaving',
    draw: (ctx, cx, cy, r, c) => drawIconCircle(ctx, cx, cy, r, c, true, () => drawLock(ctx, cx, cy, r, c)),
  },
  {
    id: 'save-water', fr: 'Économie d\'eau', en: 'Save water',
    draw: (ctx, cx, cy, r, c) => drawIconCircle(ctx, cx, cy, r, c, true, () => drawDrop(ctx, cx, cy, r, c)),
  },
]

const RULES_MAP: Record<RuleId, RuleDef> = Object.fromEntries(RULES.map(r => [r.id, r])) as Record<RuleId, RuleDef>

// Phosphor icon component lookup (for the wizard UI)
const RULE_ICONS_REACT: Record<RuleId, typeof Cigarette> = {
  'no-smoking': Cigarette,
  'quiet-hours': Moon,
  'no-parties': MusicNote,
  'no-pets': PawPrint,
  'pets-ok': PawPrint,
  'no-shoes': Footprints,
  'recycling': Recycle,
  'lock-up': Lock,
  'save-water': Drop,
}

// Block icon lookup for wizard
const BLOCK_ICONS_REACT = {
  host: Phone,
  checkout: Clock,
  parking: Car,
  waste: Trash,
  climate: Thermometer,
  guide: BookOpen,
}

// === Translation helper ===
function t(field: { fr: string; en: string }, lang: Lang): string {
  return lang === 'en' ? field.en : field.fr
}

// === Canvas helpers ===
function buildWifiQr(ssid: string, password: string): string {
  const s = ssid.replace(/[\\;,":]/g, c => `\\${c}`)
  const p = password.replace(/[\\;,":]/g, c => `\\${c}`)
  return `WIFI:T:WPA;S:${s};P:${p};;`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function fillRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 99,
): number {
  const words = text.split(' ')
  let line = ''
  let drawn = 0
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && line) {
      if (drawn >= maxLines - 1) {
        let truncated = line
        while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
          truncated = truncated.slice(0, -1)
        }
        ctx.fillText(truncated + '…', x, y + drawn * lineHeight)
        return drawn + 1
      }
      ctx.fillText(line, x, y + drawn * lineHeight)
      drawn++
      line = word
    } else {
      line = test
    }
  }
  if (line) {
    ctx.fillText(line, x, y + drawn * lineHeight)
    drawn++
  }
  return drawn
}

// === Rule icon drawing primitives ===
function drawIconCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  positive: boolean,
  drawInner: () => void,
) {
  ctx.save()
  // Outer ring
  ctx.strokeStyle = color
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  // Faint fill
  ctx.fillStyle = color + (positive ? '14' : '08')
  ctx.beginPath()
  ctx.arc(cx, cy, r - 0.7, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  drawInner()
}

function drawSlash(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  const off = r * 0.62
  ctx.beginPath()
  ctx.moveTo(cx - off, cy + off)
  ctx.lineTo(cx + off, cy - off)
  ctx.stroke()
  ctx.restore()
}

function drawCigarette(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, withSlash: boolean) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.3
  ctx.lineCap = 'round'
  // body
  const w = r * 1.05
  const h = r * 0.32
  ctx.beginPath()
  ctx.rect(cx - w / 2, cy - h / 2, w, h)
  ctx.stroke()
  // filter section
  ctx.fillStyle = color + '60'
  ctx.fillRect(cx + w / 2 - w * 0.28, cy - h / 2, w * 0.28, h)
  // smoke wisps
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  for (let i = 0; i < 2; i++) {
    ctx.beginPath()
    ctx.moveTo(cx - w / 2 - 4 - i * 4, cy - h / 2 - 2)
    ctx.bezierCurveTo(cx - w / 2 - 6 - i * 4, cy - h / 2 - 5, cx - w / 2 - 4 - i * 4, cy - h / 2 - 7, cx - w / 2 - 6 - i * 4, cy - h / 2 - 10)
    ctx.stroke()
  }
  ctx.restore()
  if (withSlash) drawSlash(ctx, cx, cy, r, color)
}

function drawMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  const moonR = r * 0.55
  ctx.beginPath()
  ctx.arc(cx, cy, moonR, 0, Math.PI * 2)
  ctx.fill()
  // crescent: erase a circle offset
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(cx + moonR * 0.45, cy - moonR * 0.15, moonR * 0.95, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawMusicNote(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, withSlash: boolean) {
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  // stem
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.05, cy + r * 0.45)
  ctx.lineTo(cx - r * 0.05, cy - r * 0.55)
  ctx.stroke()
  // flag
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.05, cy - r * 0.55)
  ctx.quadraticCurveTo(cx + r * 0.4, cy - r * 0.45, cx + r * 0.35, cy - r * 0.05)
  ctx.stroke()
  // note head
  ctx.beginPath()
  ctx.ellipse(cx - r * 0.25, cy + r * 0.45, r * 0.22, r * 0.16, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  if (withSlash) drawSlash(ctx, cx, cy, r, color)
}

function drawPaw(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, withSlash: boolean) {
  ctx.save()
  ctx.fillStyle = color
  // main pad
  ctx.beginPath()
  ctx.ellipse(cx, cy + r * 0.25, r * 0.36, r * 0.30, 0, 0, Math.PI * 2)
  ctx.fill()
  // toes (4 small ovals)
  const toes = [
    [cx - r * 0.45, cy - r * 0.05],
    [cx - r * 0.18, cy - r * 0.40],
    [cx + r * 0.18, cy - r * 0.40],
    [cx + r * 0.45, cy - r * 0.05],
  ]
  toes.forEach(([x, y]) => {
    ctx.beginPath()
    ctx.ellipse(x, y, r * 0.16, r * 0.20, 0, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
  if (withSlash) drawSlash(ctx, cx, cy, r, color)
}

function drawShoe(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, withSlash: boolean) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color + '40'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  // simple footprint shape
  ctx.moveTo(cx - r * 0.25, cy - r * 0.5)
  ctx.bezierCurveTo(cx + r * 0.25, cy - r * 0.55, cx + r * 0.55, cy - r * 0.1, cx + r * 0.4, cy + r * 0.4)
  ctx.bezierCurveTo(cx + r * 0.25, cy + r * 0.55, cx - r * 0.25, cy + r * 0.55, cx - r * 0.4, cy + r * 0.35)
  ctx.bezierCurveTo(cx - r * 0.55, cy + r * 0.05, cx - r * 0.4, cy - r * 0.4, cx - r * 0.25, cy - r * 0.5)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
  if (withSlash) drawSlash(ctx, cx, cy, r, color)
}

function drawRecycle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const rad = r * 0.55
  // 3 arrows in triangle
  for (let i = 0; i < 3; i++) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((i * 2 * Math.PI) / 3)
    ctx.beginPath()
    ctx.moveTo(-rad * 0.5, -rad * 0.55)
    ctx.lineTo(rad * 0.45, -rad * 0.55)
    ctx.lineTo(rad * 0.05, -rad * 0.95)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

function drawLock(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.6
  // shackle
  ctx.beginPath()
  ctx.arc(cx, cy - r * 0.05, r * 0.32, Math.PI, 0)
  ctx.stroke()
  // body
  fillRoundRect(ctx, cx - r * 0.45, cy - r * 0.05, r * 0.9, r * 0.65, r * 0.1)
  ctx.fill()
  // keyhole
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx, cy + r * 0.18, r * 0.10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(cx - r * 0.04, cy + r * 0.18, r * 0.08, r * 0.20)
  ctx.restore()
}

function drawDrop(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(cx, cy - r * 0.65)
  ctx.bezierCurveTo(cx + r * 0.55, cy - r * 0.05, cx + r * 0.42, cy + r * 0.55, cx, cy + r * 0.55)
  ctx.bezierCurveTo(cx - r * 0.42, cy + r * 0.55, cx - r * 0.55, cy - r * 0.05, cx, cy - r * 0.65)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// === Block icons ===
function drawBlockIcon(ctx: CanvasRenderingContext2D, key: string, cx: number, cy: number, color: string) {
  const r = 14
  switch (key) {
    case 'host':     return drawPhoneIcon(ctx, cx, cy, r, color)
    case 'checkout': return drawClockIcon(ctx, cx, cy, r, color)
    case 'parking':  return drawCarIcon(ctx, cx, cy, r, color)
    case 'waste':    return drawTrashIcon(ctx, cx, cy, r, color)
    case 'climate':  return drawThermoIcon(ctx, cx, cy, r, color)
    case 'guide':    return drawBookIcon(ctx, cx, cy, r, color)
  }
}

function drawPhoneIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.7
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.62, cy - r * 0.62)
  ctx.bezierCurveTo(cx - r * 0.85, cy - r * 0.15, cx - r * 0.4, cy + r * 0.65, cx + r * 0.15, cy + r * 0.85)
  ctx.bezierCurveTo(cx + r * 0.55, cy + r * 0.95, cx + r * 0.85, cy + r * 0.55, cx + r * 0.55, cy + r * 0.30)
  ctx.lineTo(cx + r * 0.20, cy + r * 0.10)
  ctx.lineTo(cx + r * 0.05, cy + r * 0.30)
  ctx.bezierCurveTo(cx - r * 0.30, cy + r * 0.05, cx - r * 0.30, cy - r * 0.20, cx - r * 0.05, cy - r * 0.45)
  ctx.lineTo(cx - r * 0.30, cy - r * 0.70)
  ctx.lineTo(cx - r * 0.62, cy - r * 0.62)
  ctx.stroke()
  ctx.restore()
}

function drawClockIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2)
  ctx.stroke()
  // hands
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy - r * 0.55)
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + r * 0.42, cy + r * 0.10)
  ctx.stroke()
  ctx.restore()
}

function drawCarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  // body
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.85, cy + r * 0.30)
  ctx.lineTo(cx - r * 0.85, cy - r * 0.05)
  ctx.lineTo(cx - r * 0.55, cy - r * 0.45)
  ctx.lineTo(cx + r * 0.55, cy - r * 0.45)
  ctx.lineTo(cx + r * 0.85, cy - r * 0.05)
  ctx.lineTo(cx + r * 0.85, cy + r * 0.30)
  ctx.stroke()
  // wheels
  ctx.beginPath()
  ctx.arc(cx - r * 0.5, cy + r * 0.40, r * 0.22, 0, Math.PI * 2)
  ctx.arc(cx + r * 0.5, cy + r * 0.40, r * 0.22, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawTrashIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  // lid
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.7, cy - r * 0.45)
  ctx.lineTo(cx + r * 0.7, cy - r * 0.45)
  // handle
  ctx.moveTo(cx - r * 0.25, cy - r * 0.45)
  ctx.lineTo(cx - r * 0.25, cy - r * 0.65)
  ctx.lineTo(cx + r * 0.25, cy - r * 0.65)
  ctx.lineTo(cx + r * 0.25, cy - r * 0.45)
  // body
  ctx.moveTo(cx - r * 0.55, cy - r * 0.45)
  ctx.lineTo(cx - r * 0.45, cy + r * 0.65)
  ctx.lineTo(cx + r * 0.45, cy + r * 0.65)
  ctx.lineTo(cx + r * 0.55, cy - r * 0.45)
  // vertical lines
  ctx.moveTo(cx - r * 0.20, cy - r * 0.20)
  ctx.lineTo(cx - r * 0.18, cy + r * 0.45)
  ctx.moveTo(cx + r * 0.20, cy - r * 0.20)
  ctx.lineTo(cx + r * 0.18, cy + r * 0.45)
  ctx.stroke()
  ctx.restore()
}

function drawThermoIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  // bulb
  ctx.beginPath()
  ctx.arc(cx, cy + r * 0.55, r * 0.28, 0, Math.PI * 2)
  ctx.fill()
  // tube
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.18, cy - r * 0.60)
  ctx.lineTo(cx - r * 0.18, cy + r * 0.40)
  ctx.moveTo(cx + r * 0.18, cy - r * 0.60)
  ctx.lineTo(cx + r * 0.18, cy + r * 0.40)
  // top
  ctx.arc(cx, cy - r * 0.60, r * 0.18, Math.PI, 0)
  ctx.stroke()
  ctx.restore()
}

function drawBookIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.6
  ctx.lineJoin = 'round'
  ctx.beginPath()
  // cover
  ctx.moveTo(cx - r * 0.7, cy - r * 0.7)
  ctx.lineTo(cx - r * 0.7, cy + r * 0.7)
  ctx.lineTo(cx + r * 0.7, cy + r * 0.7)
  ctx.lineTo(cx + r * 0.7, cy - r * 0.7)
  ctx.closePath()
  ctx.stroke()
  // spine line
  ctx.beginPath()
  ctx.moveTo(cx, cy - r * 0.7)
  ctx.lineTo(cx, cy + r * 0.7)
  // page lines
  ctx.moveTo(cx - r * 0.4, cy - r * 0.30)
  ctx.lineTo(cx - r * 0.15, cy - r * 0.30)
  ctx.moveTo(cx - r * 0.4, cy + r * 0.05)
  ctx.lineTo(cx - r * 0.15, cy + r * 0.05)
  ctx.moveTo(cx + r * 0.15, cy - r * 0.30)
  ctx.lineTo(cx + r * 0.4, cy - r * 0.30)
  ctx.moveTo(cx + r * 0.15, cy + r * 0.05)
  ctx.lineTo(cx + r * 0.4, cy + r * 0.05)
  ctx.stroke()
  ctx.restore()
}

function drawWifiIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, scale = 1) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2.5 * scale
  ctx.lineCap = 'round'
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath()
    ctx.arc(cx, cy + 6 * scale, 5 * i * scale, Math.PI * 1.20, Math.PI * 1.80)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(cx, cy + 6 * scale, 1.8 * scale, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// === Default factory ===
function defaultBlock(): InfoBlock {
  return { enabled: false }
}

function makeDefaultData(): AfficheData {
  return {
    language: 'fr',
    logementNom: '',
    blocks: {
      host:     { enabled: true, name: '', phone: '' },
      checkout: { enabled: true, time: '11h00' },
      parking:  defaultBlock(),
      waste:    defaultBlock(),
      climate:  defaultBlock(),
      guide:    defaultBlock(),
    },
    selectedRules: ['no-smoking', 'quiet-hours', 'no-parties', 'recycling'],
    showEmergency: true,
    accentColor: '#374151',
  }
}

// === Main canvas render ===
async function renderPosterCanvas(
  data: AfficheData,
  qrWifiUrl: string,
  qrGuideUrl: string,
  watermark: boolean,
): Promise<HTMLCanvasElement> {
  const W = 794
  const H = 1123
  const canvas = document.createElement('canvas')
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)

  if (typeof document !== 'undefined' && 'fonts' in document) {
    try { await (document as any).fonts.ready } catch {}
  }

  const accent = data.accentColor
  const bg = '#FFFFFF'
  const textDark = '#1A1A1A'
  const textMute = '#7A7A7A'
  const hairline = accent + '20'

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Top accent line (very thin)
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, 3)

  let y = 0

  // === HEADER ===
  y = await drawHeader(ctx, W, data, accent, textDark, textMute, hairline)

  // === WIFI HERO ===
  if (data.wifiSsid) {
    y = await drawWifiHero(ctx, W, y, data, qrWifiUrl, accent, textDark, textMute)
  }

  // === INFO GRID (guide rendered separately at bottom) ===
  const enabledBlocks = (Object.keys(data.blocks) as Array<keyof typeof data.blocks>)
    .filter(k => k !== 'guide' && data.blocks[k].enabled && hasContent(k, data.blocks[k]))
  if (enabledBlocks.length > 0) {
    y = await drawInfoGrid(ctx, W, y, data, enabledBlocks, '', accent, textDark, textMute, hairline)
  }

  // === RULES ===
  if (data.selectedRules.length > 0) {
    y = drawRulesRow(ctx, W, y, data, accent, textDark, textMute)
  }

  // === GUIDE / LIVRET ===
  if (data.blocks.guide.enabled && hasContent('guide', data.blocks.guide)) {
    y = await drawGuideSection(ctx, W, y, data, qrGuideUrl, accent, textDark, textMute)
  }

  // === EMERGENCY ===
  if (data.showEmergency) {
    drawEmergencyBand(ctx, W, H, data, accent, textDark, textMute, hairline)
  }

  // === FOOTER ===
  ctx.font = '9.5px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = '#BBBBBB'
  ctx.textAlign = 'center'
  ctx.fillText('Créé avec Jason Marinho · app.jasonmarinho.com', W / 2, H - 18)

  // Bottom accent line
  ctx.fillStyle = accent
  ctx.fillRect(0, H - 3, W, 3)

  // Watermark
  if (watermark) {
    ctx.save()
    ctx.globalAlpha = 0.07
    ctx.font = 'bold 50px sans-serif'
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 5)
    for (let i = -2; i <= 2; i++) {
      ctx.fillText('APERÇU — STANDARD', 0, i * 130)
    }
    ctx.restore()
  }

  return canvas
}

function hasContent(key: string, block: InfoBlock): boolean {
  switch (key) {
    case 'host':     return Boolean(block.phone || block.name)
    case 'checkout': return Boolean(block.time)
    case 'guide':    return Boolean(block.url)
    default:         return Boolean(block.text)
  }
}

async function drawHeader(
  ctx: CanvasRenderingContext2D,
  W: number,
  data: AfficheData,
  accent: string,
  textDark: string,
  textMute: string,
  hairline: string,
): Promise<number> {
  let y = 42
  const lang = data.language

  // Logo (optional, above title)
  if (data.logoUrl) {
    try {
      const logo = await loadImage(data.logoUrl)
      const maxLogoH = 64
      const maxLogoW = 200
      const ratio = logo.width / logo.height
      let lh = maxLogoH
      let lw = lh * ratio
      if (lw > maxLogoW) {
        lw = maxLogoW
        lh = lw / ratio
      }
      ctx.drawImage(logo, W / 2 - lw / 2, y, lw, lh)
      y += lh + 12
    } catch {}
  }

  // Decorative thin bar
  ctx.fillStyle = hairline
  ctx.fillRect(W / 2 - 60, y + 6, 120, 1)
  y += 16

  // Main title
  ctx.font = 'bold 56px Georgia, "Times New Roman", serif'
  ctx.fillStyle = accent
  ctx.textAlign = 'center'
  const mainTitle = lang === 'en' ? 'WELCOME' : 'BIENVENUE'
  ctx.fillText(mainTitle, W / 2, y + 52)
  y += 68

  // Tagline
  const taglineDefault = lang === 'fr'
    ? `Bienvenue${data.logementNom ? ` à ${data.logementNom}` : ''}. Voici ce qu'il faut savoir pour votre séjour.`
    : `Welcome${data.logementNom ? ` to ${data.logementNom}` : ''}. Here is what you need for your stay.`
  ctx.font = '12.5px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = '#4A4A4A'
  ctx.textAlign = 'center'
  const taglineLines = wrapText(ctx, data.tagline || taglineDefault, W / 2, y + 14, W - 180, 18, 2)
  y += taglineLines * 18 + 20

  // Hairline separator
  ctx.strokeStyle = hairline
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(60, y + 4)
  ctx.lineTo(W - 60, y + 4)
  ctx.stroke()
  y += 20

  return y
}

async function drawWifiHero(
  ctx: CanvasRenderingContext2D,
  W: number,
  startY: number,
  data: AfficheData,
  qrUrl: string,
  accent: string,
  textDark: string,
  textMute: string,
): Promise<number> {
  const y = startY + 24
  const qrSize = 168
  const padX = 60
  const qrX = padX
  const textX = qrX + qrSize + 36
  const textW = W - textX - padX

  // Faint background card
  ctx.fillStyle = accent + '08'
  fillRoundRect(ctx, padX - 10, y - 10, W - 2 * padX + 20, qrSize + 30, 14)
  ctx.fill()

  // QR code
  if (qrUrl) {
    try {
      const qrImg = await loadImage(qrUrl)
      // QR background
      ctx.fillStyle = '#FFFFFF'
      fillRoundRect(ctx, qrX, y, qrSize, qrSize, 8)
      ctx.fill()
      ctx.drawImage(qrImg, qrX + 4, y + 4, qrSize - 8, qrSize - 8)
    } catch {}
  }

  // WiFi icon + label
  let ty = y + 8
  drawWifiIcon(ctx, textX + 14, ty + 6, accent, 1.0)
  ctx.font = 'bold 11px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = accent
  ctx.textAlign = 'left'
  ctx.fillText(t(T.wifi, data.language).toUpperCase(), textX + 36, ty + 13)
  ty += 26

  // SSID
  ctx.font = 'bold 26px Georgia, "Times New Roman", serif'
  ctx.fillStyle = textDark
  ctx.textAlign = 'left'
  ctx.fillText(data.wifiSsid || '—', textX, ty + 18)
  ty += 36

  // Password label
  if (data.wifiPassword) {
    ctx.font = '10px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textMute
    const pwLabel = t(T.password, data.language).toUpperCase()
    ctx.fillText(pwLabel, textX, ty + 8)
    ty += 14

    // Password pill
    ctx.font = 'bold 16px monospace'
    const pwText = data.wifiPassword
    const pwTextW = ctx.measureText(pwText).width
    const pillW = Math.min(Math.max(pwTextW + 24, 100), textW)
    const pillH = 32
    ctx.fillStyle = accent + '14'
    fillRoundRect(ctx, textX, ty, pillW, pillH, 6)
    ctx.fill()
    ctx.fillStyle = textDark
    ctx.textAlign = 'left'
    ctx.fillText(pwText, textX + 12, ty + 21)
    ty += pillH + 12
  }

  // Scan hint
  ctx.font = 'italic 11px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = textMute
  ctx.fillText(t(T.scanToConnect, data.language), textX, ty + 8)

  return y + qrSize + 30
}

async function drawInfoGrid(
  ctx: CanvasRenderingContext2D,
  W: number,
  startY: number,
  data: AfficheData,
  enabledKeys: Array<keyof AfficheData['blocks']>,
  qrGuideUrl: string,
  accent: string,
  textDark: string,
  textMute: string,
  hairline: string,
): Promise<number> {
  const y = startY + 22
  const padX = 60
  const innerW = W - 2 * padX
  const cols = Math.min(enabledKeys.length, 3)
  const rows = Math.ceil(enabledKeys.length / cols)
  const gap = 14
  const cardW = (innerW - (cols - 1) * gap) / cols
  const cardH = 118

  for (let i = 0; i < enabledKeys.length; i++) {
    const key = enabledKeys[i]
    const row = Math.floor(i / cols)
    const col = i % cols
    const cx = padX + col * (cardW + gap)
    const cy = y + row * (cardH + gap)

    // Card background
    ctx.strokeStyle = hairline
    ctx.lineWidth = 1
    ctx.fillStyle = '#FAFAF8'
    fillRoundRect(ctx, cx, cy, cardW, cardH, 10)
    ctx.fill()
    ctx.stroke()

    // Icon + label header
    drawBlockIcon(ctx, key as string, cx + 24, cy + 26, accent)

    ctx.font = 'bold 11px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'left'
    const labelMap = { host: T.host, checkout: T.checkout, parking: T.parking, waste: T.waste, climate: T.climate, guide: T.guide }
    const label = t(labelMap[key as keyof typeof labelMap], data.language).toUpperCase()
    ctx.fillText(label, cx + 46, cy + 22)

    // Content
    const block = data.blocks[key]
    const contentY = cy + 50
    const contentX = cx + 16
    const contentW = cardW - 32

    ctx.textAlign = 'left'
    if (key === 'host') {
      // Name + phone (clickable looking)
      if (block.name) {
        ctx.font = '12px "Outfit", "Helvetica Neue", sans-serif'
        ctx.fillStyle = textDark
        ctx.fillText(block.name, contentX, contentY)
      }
      if (block.phone) {
        ctx.font = 'bold 16px Georgia, "Times New Roman", serif'
        ctx.fillStyle = textDark
        ctx.fillText(block.phone, contentX, block.name ? contentY + 22 : contentY + 6)
      }
    } else if (key === 'checkout') {
      if (block.time) {
        ctx.font = 'bold 22px Georgia, "Times New Roman", serif'
        ctx.fillStyle = textDark
        ctx.fillText(block.time, contentX, contentY + 4)
      }
      if (block.text) {
        ctx.font = '10.5px "Outfit", "Helvetica Neue", sans-serif'
        ctx.fillStyle = textMute
        wrapText(ctx, block.text, contentX, contentY + 26, contentW, 13, 2)
      }
    } else if (key === 'guide' && qrGuideUrl) {
      try {
        const qrImg = await loadImage(qrGuideUrl)
        const qSize = cardH - 56 - 12
        ctx.drawImage(qrImg, contentX, contentY - 6, qSize, qSize)
        if (block.text) {
          ctx.font = '10px "Outfit", "Helvetica Neue", sans-serif'
          ctx.fillStyle = textMute
          wrapText(ctx, block.text, contentX + qSize + 8, contentY + 6, contentW - qSize - 8, 12, 4)
        }
      } catch {}
    } else {
      // generic text content
      const text = block.text || ''
      if (text) {
        ctx.font = '11.5px "Outfit", "Helvetica Neue", sans-serif'
        ctx.fillStyle = textDark
        wrapText(ctx, text, contentX, contentY, contentW, 14, 4)
      }
    }
  }

  return y + rows * cardH + (rows - 1) * gap + 16
}

function drawRulesRow(
  ctx: CanvasRenderingContext2D,
  W: number,
  startY: number,
  data: AfficheData,
  accent: string,
  textDark: string,
  textMute: string,
): number {
  const y = startY + 20
  const padX = 50
  const innerW = W - 2 * padX
  const rules = data.selectedRules.slice(0, 6)

  // Section header
  ctx.font = 'bold 11px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = accent
  ctx.textAlign = 'center'
  const titleText = t(T.rules, data.language).toUpperCase()
  ctx.fillText(titleText, W / 2, y + 14)

  // Hairline below header
  const lineY = y + 26
  ctx.strokeStyle = accent + '30'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W / 2 - 22, lineY)
  ctx.lineTo(W / 2 + 22, lineY)
  ctx.stroke()

  const itemY = y + 50
  const cellW = innerW / rules.length
  const iconR = 22

  rules.forEach((id, i) => {
    const cx = padX + cellW * (i + 0.5)
    const def = RULES_MAP[id]
    if (!def) return
    def.draw(ctx, cx, itemY, iconR, accent)

    // Label below
    ctx.font = '11px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textDark
    ctx.textAlign = 'center'
    ctx.fillText(data.language === 'fr' ? def.fr : def.en, cx, itemY + iconR + 18)
  })

  return itemY + iconR + 34
}

function drawEmergencyBand(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  data: AfficheData,
  accent: string,
  textDark: string,
  textMute: string,
  hairline: string,
) {
  const bandH = 92
  const bandTop = H - bandH - 32

  ctx.fillStyle = accent + '0E'
  ctx.fillRect(0, bandTop, W, bandH)

  ctx.strokeStyle = hairline
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, bandTop)
  ctx.lineTo(W, bandTop)
  ctx.moveTo(0, bandTop + bandH)
  ctx.lineTo(W, bandTop + bandH)
  ctx.stroke()

  // Header
  ctx.font = 'bold 10px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = accent
  ctx.textAlign = 'center'
  ctx.fillText(t(T.emergency, data.language).toUpperCase(), W / 2, bandTop + 16)

  const cells: { fr: string; en: string; value: string }[] = [
    { fr: 'Pompier', en: 'Fire',      value: '18' },
    { fr: 'Samu',    en: 'Ambulance', value: '15' },
    { fr: 'Police',  en: 'Police',    value: '17' },
  ]
  if (data.blocks.host.enabled && data.blocks.host.phone) {
    cells.push({ fr: 'Hôte', en: 'Host', value: data.blocks.host.phone })
  }

  const cellW = W / cells.length
  cells.forEach((cell, i) => {
    const cx = cellW * (i + 0.5)
    ctx.font = 'bold 12px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'center'
    ctx.fillText(data.language === 'fr' ? cell.fr : cell.en, cx, bandTop + 38)

    ctx.font = `bold ${cells.length > 3 ? 18 : 24}px Georgia, "Times New Roman", serif`
    ctx.fillStyle = textDark
    ctx.fillText(cell.value, cx, bandTop + 72)

    if (i < cells.length - 1) {
      ctx.strokeStyle = hairline
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cellW * (i + 1), bandTop + 22)
      ctx.lineTo(cellW * (i + 1), bandTop + bandH - 14)
      ctx.stroke()
    }
  })
}

async function drawGuideSection(
  ctx: CanvasRenderingContext2D,
  W: number,
  startY: number,
  data: AfficheData,
  qrGuideUrl: string,
  accent: string,
  textDark: string,
  textMute: string,
): Promise<number> {
  const guide = data.blocks.guide
  if (!guide.url) return startY

  const y = startY + 20
  const padX = 60
  const innerW = W - 2 * padX
  const qrSize = 110
  const sectionH = qrSize + 36

  // Section label
  ctx.font = 'bold 11px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = accent
  ctx.textAlign = 'center'
  ctx.fillText(t(T.guide, data.language).toUpperCase(), W / 2, y + 14)
  ctx.strokeStyle = accent + '30'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W / 2 - 22, y + 26)
  ctx.lineTo(W / 2 + 22, y + 26)
  ctx.stroke()

  // Card
  ctx.fillStyle = accent + '07'
  fillRoundRect(ctx, padX, y + 36, innerW, sectionH, 12)
  ctx.fill()

  // QR
  const qrX = padX + 20
  const qrY = y + 36 + (sectionH - qrSize) / 2
  if (qrGuideUrl) {
    try {
      const qrImg = await loadImage(qrGuideUrl)
      ctx.fillStyle = '#FFFFFF'
      fillRoundRect(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 8)
      ctx.fill()
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    } catch {}
  }

  // Text side
  const textX = qrX + qrSize + 20
  const textW = innerW - qrSize - 56
  let ty = qrY + 8

  if (guide.text) {
    ctx.font = '12.5px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textDark
    ctx.textAlign = 'left'
    const lines = wrapText(ctx, guide.text, textX, ty, textW, 16, 3)
    ty += lines * 16 + 12
  }

  ctx.font = 'italic 10px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = textMute
  ctx.textAlign = 'left'
  ctx.fillText('Créez votre livret avec Driing', textX, ty + 12)

  return y + 36 + sectionH + 16
}

async function generateQrPng(content: string, accentColor: string): Promise<string> {
  if (!content) return ''
  const { default: QRCodeStyling } = await import('qr-code-styling')
  const qr = new QRCodeStyling({
    width: 360, height: 360,
    data: content,
    backgroundOptions: { color: '#FFFFFF' },
    dotsOptions: { color: accentColor, type: 'rounded' },
    cornersSquareOptions: { color: accentColor },
    cornersDotOptions: { color: accentColor },
    qrOptions: { errorCorrectionLevel: 'M' },
  })
  return new Promise<string>((resolve) => {
    qr.getRawData('png').then((raw: unknown) => {
      const blob = raw instanceof Blob ? raw : null
      if (!blob) { resolve(''); return }
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string ?? '')
      reader.readAsDataURL(blob)
    })
  })
}

// === COMPONENT ===
export default function AfficheTab({ plan, logements }: Props) {
  const isStandard = plan !== 'decouverte'
  const [step, setStep] = useState<StepId>('logement')
  const [data, setData] = useState<AfficheData>(makeDefaultData)
  const [hexDraft, setHexDraft] = useState('374151')
  const [selectedLogementId, setSelectedLogementId] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isRendering, setIsRendering] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stepIdx = STEPS.findIndex(s => s.id === step)

  function setField<K extends keyof AfficheData>(key: K, value: AfficheData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  function setBlock<K extends keyof AfficheData['blocks']>(key: K, patch: Partial<InfoBlock>) {
    setData(prev => ({
      ...prev,
      blocks: { ...prev.blocks, [key]: { ...prev.blocks[key], ...patch } },
    }))
  }

  function toggleRule(id: RuleId) {
    setData(prev => {
      const has = prev.selectedRules.includes(id)
      if (has) return { ...prev, selectedRules: prev.selectedRules.filter(r => r !== id) }
      if (prev.selectedRules.length >= 6) return prev
      return { ...prev, selectedRules: [...prev.selectedRules, id] }
    })
  }

  function setAccentColor(c: string) {
    setData(prev => ({ ...prev, accentColor: c }))
    setHexDraft(c.replace('#', '').toUpperCase())
  }

  // Prefill from logement
  useEffect(() => {
    if (!selectedLogementId) return
    const l = logements.find(x => x.id === selectedLogementId)
    if (!l) return
    setData(prev => ({
      ...prev,
      logementNom: l.nom,
      wifiSsid: l.wifi_nom ?? prev.wifiSsid,
      wifiPassword: l.wifi_mdp ?? prev.wifiPassword,
    }))
    getAfficheByLogement(selectedLogementId).then(existing => {
      if (existing?.data) {
        const loaded = existing.data as Partial<AfficheData>
        // Merge with defaults to handle older saves
        setData(d => ({
          ...d,
          ...loaded,
          blocks: { ...d.blocks, ...(loaded.blocks ?? {}) },
        }))
        setSavedId(existing.id)
      }
    })
  }, [selectedLogementId, logements])

  const renderPreview = useCallback(async () => {
    setIsRendering(true)
    try {
      const qrWifi = data.wifiSsid
        ? await generateQrPng(buildWifiQr(data.wifiSsid, data.wifiPassword ?? ''), data.accentColor)
        : ''
      const qrGuide = (data.blocks.guide.enabled && data.blocks.guide.url)
        ? await generateQrPng(data.blocks.guide.url, data.accentColor)
        : ''
      const canvas = await renderPosterCanvas(data, qrWifi, qrGuide, !isStandard)
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92))
    } catch (e) {
      console.error(e)
    } finally {
      setIsRendering(false)
    }
  }, [data, isStandard])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(renderPreview, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [renderPreview])

  async function downloadPng() {
    const qrWifi = data.wifiSsid ? await generateQrPng(buildWifiQr(data.wifiSsid, data.wifiPassword ?? ''), data.accentColor) : ''
    const qrGuide = (data.blocks.guide.enabled && data.blocks.guide.url) ? await generateQrPng(data.blocks.guide.url, data.accentColor) : ''
    const canvas = await renderPosterCanvas(data, qrWifi, qrGuide, !isStandard)
    const link = document.createElement('a')
    link.download = `affiche-${data.logementNom || 'logement'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function downloadPdf() {
    const { jsPDF } = await import('jspdf')
    const qrWifi = data.wifiSsid ? await generateQrPng(buildWifiQr(data.wifiSsid, data.wifiPassword ?? ''), data.accentColor) : ''
    const qrGuide = (data.blocks.guide.enabled && data.blocks.guide.url) ? await generateQrPng(data.blocks.guide.url, data.accentColor) : ''
    const canvas = await renderPosterCanvas(data, qrWifi, qrGuide, !isStandard)
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
    pdf.save(`affiche-${data.logementNom || 'logement'}.pdf`)
  }

  async function handleSave() {
    if (!selectedLogementId) return
    setIsSaving(true)
    try {
      const result = await saveAffiche({ logementId: selectedLogementId, data: data as unknown as Record<string, unknown>, existingId: savedId ?? undefined })
      if (result.id) setSavedId(result.id)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={s.layout} className="affiche-layout">
      <style>{`
        @media (max-width: 980px) {
          .affiche-layout { grid-template-columns: 1fr !important; }
          .affiche-preview-col { position: static !important; top: auto !important; }
        }
      `}</style>
      <div style={s.wizardCol}>
        {/* Step bar */}
        <div style={s.stepBar}>
          {STEPS.map((st, i) => {
            const Icon = st.icon
            const done = i < stepIdx
            const active = st.id === step
            return (
              <button
                key={st.id}
                onClick={() => setStep(st.id)}
                style={{ ...s.stepBtn, ...(active ? s.stepBtnActive : done ? s.stepBtnDone : {}) }}
              >
                <div style={{ ...s.stepNum, ...(active ? s.stepNumActive : done ? s.stepNumDone : {}) }}>
                  {done ? <CheckCircle size={14} weight="fill" /> : <Icon size={14} />}
                </div>
                <span style={s.stepLabel}>{st.label}</span>
              </button>
            )
          })}
        </div>

        {/* Step content */}
        <div style={s.stepContent}>
          {step === 'logement' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Accueil voyageurs</h3>
              <p style={s.stepDesc}>Le titre de l&apos;affiche s&apos;adapte à la langue choisie : <strong>BIENVENUE</strong>, <strong>WELCOME</strong>, ou les deux.</p>

              {logements.length > 0 && (
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Logement existant (préremplit + sauvegarde)</label>
                  <div style={s.selectWrap}>
                    <select
                      value={selectedLogementId}
                      onChange={e => setSelectedLogementId(e.target.value)}
                      style={s.select}
                    >
                      <option value="">— Sélectionner —</option>
                      {logements.map(l => (
                        <option key={l.id} value={l.id}>{l.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Nom du logement *</label>
                <input
                  style={s.input}
                  placeholder="Studio Marais, Chalet Savoie…"
                  value={data.logementNom}
                  onChange={e => setField('logementNom', e.target.value)}
                />
              </div>

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Logo (optionnel, affiché au-dessus du titre)</label>
                {data.logoUrl ? (
                  <div style={s.logoPreviewRow}>
                    <div style={s.logoPreviewBox}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={data.logoUrl} alt="Logo" style={s.logoPreviewImg} />
                    </div>
                    <button onClick={() => setField('logoUrl', undefined)} style={s.logoRemoveBtn}>
                      Retirer
                    </button>
                  </div>
                ) : (
                  <label style={s.logoUploadBtn}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = ev => setField('logoUrl', ev.target?.result as string)
                        reader.readAsDataURL(file)
                      }}
                      style={{ display: 'none' }}
                    />
                    <span>Téléverser un logo</span>
                  </label>
                )}
                <span style={s.hint}>PNG, JPEG ou SVG · idéalement avec fond transparent · hauteur ~200 px.</span>
              </div>

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Message d&apos;accueil (optionnel)</label>
                <textarea
                  style={{ ...s.input, minHeight: '70px', resize: 'vertical' as const }}
                  placeholder={data.language === 'en' ? 'Welcome to our home…' : 'Bienvenue chez nous…'}
                  value={data.tagline ?? ''}
                  onChange={e => setField('tagline', e.target.value)}
                />
                <span style={s.hint}>Si vide, un message par défaut sera utilisé selon la langue.</span>
              </div>

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}><Translate size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Langue de l&apos;affiche</label>
                <div style={s.langGrid}>
                  {([
                    { id: 'fr', label: 'Français' },
                    { id: 'en', label: 'English' },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setField('language', opt.id)}
                      style={{
                        ...s.langBtn,
                        ...(data.language === opt.id ? s.langBtnActive : {}),
                      }}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'wifi' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Connexion WiFi</h3>
              <p style={s.stepDesc}>Le QR code est l&apos;élément <strong>héro</strong> de l&apos;affiche : tes voyageurs scannent et sont connectés en 1 seconde.</p>

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Nom du réseau (SSID) *</label>
                <input
                  style={s.input}
                  placeholder="MonWiFi-5G"
                  value={data.wifiSsid ?? ''}
                  onChange={e => setField('wifiSsid', e.target.value)}
                />
              </div>
              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Mot de passe</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="MotDePasseWifi"
                  value={data.wifiPassword ?? ''}
                  onChange={e => setField('wifiPassword', e.target.value)}
                />
              </div>
              <div style={s.callout}>
                💡 Astuce : utilise un mot de passe simple (pas de caractères ambigus comme O/0, l/1) pour faciliter la saisie manuelle si nécessaire.
              </div>
            </div>
          )}

          {step === 'practical' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Infos pratiques</h3>
              <p style={s.stepDesc}>Les voyageurs cherchent ces 6 infos en priorité. Active uniquement celles qui sont pertinentes pour ton logement.</p>

              {(['host', 'checkout', 'parking', 'waste', 'climate', 'guide'] as const).map(key => {
                const Icon = BLOCK_ICONS_REACT[key]
                const labelMap = { host: 'Hôte (contact)', checkout: 'Heure de départ', parking: 'Parking · Accès', waste: 'Tri · Poubelles', climate: 'Chauffage · Clim', guide: 'Livret digital (QR)' }
                const block = data.blocks[key]
                return (
                  <div key={key} style={s.blockEditor}>
                    <div style={s.blockHeader}>
                      <div style={s.blockHeaderLeft}>
                        <div style={s.blockIcon}><Icon size={15} /></div>
                        <span style={s.blockLabel}>{labelMap[key]}</span>
                      </div>
                      <ToggleSwitch value={block.enabled} onChange={v => setBlock(key, { enabled: v })} />
                    </div>
                    {block.enabled && (
                      <div style={s.blockFields}>
                        {key === 'host' && (
                          <>
                            <input style={s.input} placeholder="Prénom (ex: Jason)" value={block.name ?? ''} onChange={e => setBlock(key, { name: e.target.value })} />
                            <input style={s.input} placeholder="+33 6 12 34 56 78" value={block.phone ?? ''} onChange={e => setBlock(key, { phone: e.target.value })} />
                          </>
                        )}
                        {key === 'checkout' && (
                          <>
                            <input style={s.input} placeholder="11h00" value={block.time ?? ''} onChange={e => setBlock(key, { time: e.target.value })} />
                            <input style={s.input} placeholder="Note (ex: laissez les clés sur la table)" value={block.text ?? ''} onChange={e => setBlock(key, { text: e.target.value })} />
                          </>
                        )}
                        {key === 'parking' && (
                          <textarea style={{ ...s.input, minHeight: '52px' }} placeholder="Ex: Parking gratuit dans la rue · 2 places privées au sous-sol (code 1234)" value={block.text ?? ''} onChange={e => setBlock(key, { text: e.target.value })} />
                        )}
                        {key === 'waste' && (
                          <textarea style={{ ...s.input, minHeight: '52px' }} placeholder="Ex: Verre jaune · Tri vert · Collecte le mardi soir" value={block.text ?? ''} onChange={e => setBlock(key, { text: e.target.value })} />
                        )}
                        {key === 'climate' && (
                          <textarea style={{ ...s.input, minHeight: '52px' }} placeholder="Ex: Thermostat 19-21°C · Clim télécommande sur le mur" value={block.text ?? ''} onChange={e => setBlock(key, { text: e.target.value })} />
                        )}
                        {key === 'guide' && (
                          <>
                            <input style={s.input} type="url" placeholder="https://votre-livret-digital.com" value={block.url ?? ''} onChange={e => setBlock(key, { url: e.target.value })} />
                            <input style={s.input} placeholder="Description courte (ex: Bonnes adresses, équipements…)" value={block.text ?? ''} onChange={e => setBlock(key, { text: e.target.value })} />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {step === 'rules' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Règles maison</h3>
              <p style={s.stepDesc}>Sélectionne jusqu&apos;à 6 règles. L&apos;affichage se fait avec icônes claires plutôt que du texte (plus scannable). <strong>{data.selectedRules.length}/6 sélectionnées</strong>.</p>

              <div style={s.rulesGrid}>
                {RULES.map(r => {
                  const ReactIcon = RULE_ICONS_REACT[r.id]
                  const active = data.selectedRules.includes(r.id)
                  const disabled = !active && data.selectedRules.length >= 6
                  return (
                    <button
                      key={r.id}
                      onClick={() => !disabled && toggleRule(r.id)}
                      disabled={disabled}
                      style={{
                        ...s.ruleCard,
                        ...(active ? s.ruleCardActive : {}),
                        ...(disabled ? s.ruleCardDisabled : {}),
                      }}
                    >
                      <div style={{ ...s.ruleIcon, ...(active ? s.ruleIconActive : {}) }}>
                        <ReactIcon size={20} weight={active ? 'fill' : 'regular'} />
                      </div>
                      <div style={s.ruleLabel}>{r.fr}</div>
                      <div style={s.ruleSub}>{r.en}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'emergency' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Numéros d&apos;urgence</h3>
              <p style={s.stepDesc}>Numéros d&apos;urgence français en bas de l&apos;affiche : Pompier 18, Samu 15, Police 17. Si tu as activé le bloc &quot;Hôte&quot; avec un numéro, il sera ajouté automatiquement.</p>

              <div style={s.toggleRow}>
                <label style={s.toggleLabel}>Afficher la bande d&apos;urgences</label>
                <ToggleSwitch value={data.showEmergency} onChange={v => setField('showEmergency', v)} />
              </div>

              {data.showEmergency && (
                <div style={s.callout}>
                  <strong>📞 Numéros affichés :</strong><br />
                  • Pompier : 18 (incendie, accident)<br />
                  • Samu : 15 (urgence médicale)<br />
                  • Police : 17 (sécurité)<br />
                  {data.blocks.host.phone && <>• Hôte : {data.blocks.host.phone}<br /></>}
                  <br />
                  <em>Tip : 112 fonctionne aussi partout en Europe.</em>
                </div>
              )}
            </div>
          )}

          {step === 'style' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Style & export</h3>
              <p style={s.stepDesc}>Choisis la couleur principale puis télécharge ton affiche.</p>

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Couleur principale</label>
                <div style={s.colorGrid}>
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setAccentColor(c.id)}
                      style={{
                        ...s.colorCard,
                        border: data.accentColor === c.id ? `2px solid ${c.id}` : '2px solid transparent',
                      }}
                    >
                      <div style={{ ...s.colorDot, background: c.id }} />
                      <span style={s.colorLabel}>{c.label}</span>
                    </button>
                  ))}
                </div>
                <div style={s.hexWrap}>
                  <span style={s.hexHash}>#</span>
                  <input
                    type="text"
                    value={hexDraft}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase()
                      setHexDraft(raw)
                      if (raw.length === 6) setField('accentColor', '#' + raw)
                      else if (raw.length === 3) setField('accentColor', '#' + raw.split('').map(c => c + c).join(''))
                    }}
                    onBlur={() => setHexDraft(data.accentColor.replace('#', '').toUpperCase())}
                    placeholder="0B4C3F"
                    spellCheck={false}
                    maxLength={6}
                    style={s.hexInput}
                  />
                  <div style={{ ...s.hexPreview, background: data.accentColor }} />
                </div>
              </div>

              <div style={s.actionBox}>
                {!isStandard && (
                  <div style={s.watermarkNotice}>
                    <Lock size={13} weight="fill" />
                    <span>En plan Découverte, l&apos;affiche est exportée avec un filigrane. Passe en Standard pour l&apos;affiche sans filigrane.</span>
                  </div>
                )}
                <div style={s.dlRow}>
                  <button onClick={downloadPng} style={s.dlBtn}>
                    <DownloadSimple size={15} weight="bold" />
                    Télécharger PNG
                  </button>
                  <button onClick={downloadPdf} style={{ ...s.dlBtn, ...s.dlBtnSecondary }}>
                    <DownloadSimple size={15} weight="bold" />
                    PDF A4 imprimable
                  </button>
                </div>
                {selectedLogementId && (
                  <button onClick={handleSave} disabled={isSaving} style={s.saveBtn}>
                    {isSaving ? 'Sauvegarde…' : savedId ? '✓ Design sauvegardé' : 'Sauvegarder pour ce logement'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={s.navButtons}>
          {stepIdx > 0 && (
            <button onClick={() => setStep(STEPS[stepIdx - 1].id)} style={s.navBtn}>
              <ArrowLeft size={15} />
              Précédent
            </button>
          )}
          {stepIdx < STEPS.length - 1 && (
            <button
              onClick={() => setStep(STEPS[stepIdx + 1].id)}
              style={{ ...s.navBtn, ...s.navBtnPrimary, marginLeft: 'auto' }}
            >
              Suivant
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div style={s.previewCol} className="affiche-preview-col">
        <div style={s.previewCard}>
          <div style={s.previewHeader}>
            <div style={s.previewLabel}>Aperçu en direct</div>
            {isRendering && (
              <div style={s.renderingChip}>
                <ArrowsClockwise size={11} />
                Mise à jour…
              </div>
            )}
          </div>
          <div style={s.previewWrap}>
            {previewUrl ? (
              <img src={previewUrl} alt="Aperçu affiche" style={s.previewImg} />
            ) : (
              <div style={s.previewEmpty}>
                <ArrowsClockwise size={24} style={{ opacity: 0.4 }} />
                <span>Génération de l&apos;aperçu…</span>
              </div>
            )}
          </div>
          <p style={s.previewNote}>Format A4 · 210 × 297 mm · Prêt à imprimer</p>
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        ...ts.track,
        background: value ? 'var(--accent-text)' : 'var(--border-2)',
      }}
      aria-pressed={value}
    >
      <div style={{ ...ts.thumb, transform: value ? 'translateX(18px)' : 'translateX(2px)' }} />
    </button>
  )
}

const ts: Record<string, React.CSSProperties> = {
  track: {
    width: '38px', height: '22px', borderRadius: '999px',
    border: 'none', cursor: 'pointer', position: 'relative' as const,
    transition: 'background 0.2s', flexShrink: 0,
    padding: 0,
  },
  thumb: {
    position: 'absolute' as const,
    top: '2px',
    width: '18px', height: '18px',
    borderRadius: '50%', background: '#FFFFFF',
    transition: 'transform 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
  },
}

const s: Record<string, React.CSSProperties> = {
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
    gap: 'clamp(20px, 3vw, 40px)',
    alignItems: 'start',
    width: '100%',
  },
  wizardCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  stepBar: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
  stepBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '8px 14px', borderRadius: '10px',
    fontSize: '12.5px', fontWeight: 400,
    color: 'var(--text-3)', background: 'var(--surface)',
    border: '1px solid var(--border-2)', cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },
  stepBtnActive: {
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)', fontWeight: 600,
  },
  stepBtnDone: { color: 'var(--text-2)', background: 'var(--surface-2)' },
  stepNum: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' },
  stepNumActive: { color: 'var(--accent-text)' },
  stepNumDone: { color: 'var(--text-2)' },
  stepLabel: {},
  stepContent: {
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    borderRadius: '16px', overflow: 'hidden',
  },
  stepInner: {
    padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  stepTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '20px', fontWeight: 400,
    color: 'var(--text)', margin: 0,
    letterSpacing: '-0.2px',
  },
  stepDesc: {
    fontSize: '13.5px', color: 'var(--text-2)',
    margin: 0, lineHeight: 1.6,
  },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.1px' },
  hint: { fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' as const },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '10px', padding: '10px 13px',
    fontSize: '14px', color: 'var(--text)',
    fontFamily: 'var(--font-outfit), sans-serif',
    outline: 'none', width: '100%',
    boxSizing: 'border-box' as const,
  },
  selectWrap: { position: 'relative' as const },
  select: {
    background: 'var(--bg)', border: '1px solid var(--border-2)',
    borderRadius: '10px', padding: '10px 36px 10px 13px',
    fontSize: '13.5px', color: 'var(--text)',
    fontFamily: 'var(--font-outfit), sans-serif',
    outline: 'none', width: '100%',
    appearance: 'none' as const, cursor: 'pointer',
  },
  toggleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px', padding: '10px 0',
    borderBottom: '1px solid var(--border-2)',
  },
  toggleLabel: { fontSize: '13.5px', fontWeight: 500, color: 'var(--text)' },
  langGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  langBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '6px', padding: '12px 8px',
    borderRadius: '10px', background: 'var(--bg)',
    border: '1px solid var(--border-2)', cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    fontSize: '12.5px', color: 'var(--text)', fontWeight: 500,
    transition: 'all 0.15s',
  },
  langBtnActive: {
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)', fontWeight: 600,
  },
  callout: {
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    borderRadius: '10px', padding: '12px 14px',
    fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.6,
  },
  blockEditor: {
    background: 'var(--bg)', border: '1px solid var(--border-2)',
    borderRadius: '10px', padding: '12px',
    display: 'flex', flexDirection: 'column' as const, gap: '10px',
  },
  blockHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px',
  },
  blockHeaderLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  blockIcon: {
    width: '28px', height: '28px',
    borderRadius: '7px',
    background: 'var(--surface-2)', color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  blockLabel: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' },
  blockFields: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  rulesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))',
    gap: '10px',
  },
  ruleCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '8px', padding: '14px 10px',
    borderRadius: '12px',
    background: 'var(--bg)', border: '1px solid var(--border-2)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },
  ruleCardActive: {
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
  },
  ruleCardDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  ruleIcon: {
    width: '40px', height: '40px',
    borderRadius: '50%',
    background: 'var(--surface-2)', color: 'var(--text-3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  ruleIconActive: { background: 'var(--accent-text)', color: '#1A1A1A' },
  ruleLabel: { fontSize: '12px', fontWeight: 600, color: 'var(--text)', textAlign: 'center' as const },
  ruleSub: { fontSize: '10.5px', color: 'var(--text-muted)', textAlign: 'center' as const },
  colorGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
  colorCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '6px', padding: '10px 14px',
    borderRadius: '10px', background: 'var(--bg)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },
  colorDot: { width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 },
  colorLabel: {
    fontSize: '11.5px', color: 'var(--text-2)', fontWeight: 500,
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  hexWrap: {
    display: 'flex', alignItems: 'center', gap: '0',
    marginTop: '8px',
    background: 'var(--bg)', border: '1px solid var(--border-2)',
    borderRadius: '10px', padding: '4px 10px',
    width: 'fit-content',
  },
  hexHash: {
    fontSize: '13px', color: 'var(--text-muted)',
    fontFamily: 'monospace', fontWeight: 500,
  },
  logoUploadBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '10px 16px', borderRadius: '10px',
    fontSize: '13px', fontWeight: 500,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)', border: '1px dashed var(--accent-border)',
    cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
    width: 'fit-content',
  },
  logoPreviewRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  logoPreviewBox: {
    width: '80px', height: '64px',
    background: 'var(--bg)', border: '1px solid var(--border-2)',
    borderRadius: '8px', padding: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  logoPreviewImg: {
    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const,
  },
  logoRemoveBtn: {
    padding: '7px 12px', borderRadius: '8px',
    fontSize: '12px', fontWeight: 500,
    color: 'var(--text-2)', background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
  },
  hexInput: {
    width: '74px', background: 'transparent', border: 'none',
    padding: '7px 6px', fontSize: '13px', color: 'var(--text)',
    fontFamily: 'monospace', fontWeight: 500,
    outline: 'none', letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  hexPreview: {
    width: '20px', height: '20px',
    borderRadius: '5px', border: '1px solid var(--border-2)',
    flexShrink: 0,
  },
  actionBox: {
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    borderRadius: '12px', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    marginTop: '4px',
  },
  watermarkNotice: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    fontSize: '12.5px', color: 'var(--accent-text)', lineHeight: 1.5,
  },
  dlRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
  dlBtn: {
    flex: 1, minWidth: '140px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '6px', padding: '10px 16px',
    borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    color: 'var(--accent-text)',
    background: 'var(--surface)', border: '1px solid var(--accent-border)',
    cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
  },
  dlBtnSecondary: { background: 'transparent', color: 'var(--accent-text)' },
  saveBtn: {
    padding: '8px 16px', borderRadius: '10px',
    fontSize: '12.5px', fontWeight: 500,
    color: 'var(--accent-text)', background: 'transparent',
    border: '1px solid var(--accent-border)',
    cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
    alignSelf: 'flex-start' as const,
  },
  navButtons: { display: 'flex', gap: '10px' },
  navBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 18px', borderRadius: '10px',
    fontSize: '13.5px', fontWeight: 500,
    color: 'var(--text-2)', background: 'var(--surface)',
    border: '1px solid var(--border-2)', cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },
  navBtnPrimary: {
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)', fontWeight: 600,
  },
  previewCol: {
    position: 'sticky' as const,
    top: 'calc(var(--header-h) + 16px)',
  },
  previewCard: {
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    borderRadius: '16px', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  previewHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  previewLabel: {
    fontSize: '11px', fontWeight: 700,
    letterSpacing: '0.7px', textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
  },
  renderingChip: {
    display: 'inline-flex', alignItems: 'center',
    gap: '5px', fontSize: '10.5px',
    color: 'var(--accent-text)', background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '999px', padding: '3px 9px',
  },
  previewWrap: {
    width: '100%', aspectRatio: '210 / 297',
    background: 'var(--bg)', borderRadius: '8px', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--border-2)',
  },
  previewImg: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  previewEmpty: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    gap: '10px', fontSize: '13px', color: 'var(--text-muted)',
  },
  previewNote: {
    fontSize: '11.5px', color: 'var(--text-muted)',
    margin: 0, textAlign: 'center' as const,
  },
}
