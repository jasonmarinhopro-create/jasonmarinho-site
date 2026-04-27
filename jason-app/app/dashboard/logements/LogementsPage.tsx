'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { Plus, X, House, PencilSimple, Trash, Warning, Check, Copy, WifiHigh, Key, Clock, Star, Leaf, MapPin, CurrencyEur, ArrowSquareOut, MagnifyingGlass, SquaresFour, Rows, ArrowRight } from '@phosphor-icons/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createLogement, updateLogement, deleteLogement, type LogementData } from './actions'

const DEFAULT_ANNULATION =
  `En cas d'annulation par le locataire plus de 30 jours avant l'arrivée, l'acompte versé est remboursé intégralement. En cas d'annulation moins de 30 jours avant l'arrivée, l'acompte reste acquis au bailleur.`
const DEFAULT_REGLEMENT =
  `- Respecter le calme et la tranquillité du voisinage.\n- Interdiction de fumer à l'intérieur du logement.\n- Les animaux de compagnie ne sont pas admis sauf accord préalable du bailleur.\n- Toute fête ou rassemblement est interdit sans autorisation écrite du bailleur.\n- Le locataire s'engage à laisser le logement dans l'état dans lequel il l'a trouvé.`

type TypeLogement = 'gite' | 'chambres-hotes' | 'appartement' | 'studio' | 'maison' | 'villa' | 'autre'

const TYPE_LOGEMENT_LABELS: Record<TypeLogement, string> = {
  'gite': 'Gîte',
  'chambres-hotes': "Chambres d'hôtes",
  'appartement': 'Appartement',
  'studio': 'Studio',
  'maison': 'Maison',
  'villa': 'Villa',
  'autre': 'Autre',
}

const EQUIPEMENTS: { slug: string; label: string; emoji: string }[] = [
  { slug: 'wifi',           label: 'Wi-Fi',          emoji: '📶' },
  { slug: 'parking',        label: 'Parking',        emoji: '🅿️' },
  { slug: 'piscine',        label: 'Piscine',        emoji: '🏊' },
  { slug: 'climatisation',  label: 'Climatisation',  emoji: '❄️' },
  { slug: 'chauffage',      label: 'Chauffage',      emoji: '🔥' },
  { slug: 'lave-linge',     label: 'Lave-linge',     emoji: '🧺' },
  { slug: 'lave-vaisselle', label: 'Lave-vaisselle', emoji: '🍽️' },
  { slug: 'tv',             label: 'TV',             emoji: '📺' },
  { slug: 'jardin',         label: 'Jardin',         emoji: '🌳' },
  { slug: 'terrasse',       label: 'Terrasse',       emoji: '🪑' },
  { slug: 'balcon',         label: 'Balcon',         emoji: '🌿' },
  { slug: 'pmr',            label: 'Accès PMR',      emoji: '♿' },
  { slug: 'ascenseur',      label: 'Ascenseur',      emoji: '🛗' },
  { slug: 'cheminee',       label: 'Cheminée',       emoji: '🪵' },
  { slug: 'spa',            label: 'Spa / jacuzzi',  emoji: '🛁' },
]

type Logement = {
  id: string
  nom: string
  adresse: string
  telephone: string | null
  description: string | null
  type_logement: TypeLogement | null
  capacite_max: number
  surface_m2: number | null
  nb_chambres: number | null
  nb_lits: number | null
  nb_sdb: number | null
  numero_enregistrement: string | null
  classement_etoiles: number | null
  dpe: string | null
  tarif_nuitee_moyen: number | null
  frais_menage: number | null
  caution: number | null
  equipements: string[]
  lien_airbnb: string | null
  lien_booking: string | null
  lien_gmb: string | null
  lien_site_direct: string | null
  photo_couverture_url: string | null
  photos_urls: string[]
  contact_urgence_nom: string | null
  contact_urgence_tel: string | null
  contact_menage_nom: string | null
  contact_menage_tel: string | null
  actif: boolean
  proprietaire_nom: string | null
  proprietaire_email: string | null
  proprietaire_telephone: string | null
  honoraires_pct: number | null
  reglement_interieur: string | null
  conditions_annulation: string | null
  animaux_acceptes: boolean
  fumeur_accepte: boolean
  methodes_paiement: string | null
  heure_arrivee: string | null
  heure_depart: string | null
  code_acces: string | null
  wifi_nom: string | null
  wifi_mdp: string | null
}

interface Props {
  logements: Logement[]
}

function emptyForm(): LogementData {
  return {
    nom: '',
    adresse: '',
    telephone: '',
    description: '',
    type_logement: null,
    capacite_max: 1,
    surface_m2: null,
    nb_chambres: null,
    nb_lits: null,
    nb_sdb: null,
    numero_enregistrement: null,
    classement_etoiles: null,
    dpe: null,
    tarif_nuitee_moyen: null,
    frais_menage: null,
    caution: null,
    equipements: [],
    lien_airbnb: null,
    lien_booking: null,
    lien_gmb: null,
    lien_site_direct: null,
    photo_couverture_url: null,
    photos_urls: [],
    contact_urgence_nom: null,
    contact_urgence_tel: null,
    contact_menage_nom: null,
    contact_menage_tel: null,
    actif: true,
    proprietaire_nom: null,
    proprietaire_email: null,
    proprietaire_telephone: null,
    honoraires_pct: null,
    reglement_interieur: DEFAULT_REGLEMENT,
    conditions_annulation: DEFAULT_ANNULATION,
    animaux_acceptes: false,
    fumeur_accepte: false,
    methodes_paiement: 'virement',
    heure_arrivee: '15:00',
    heure_depart: '11:00',
    code_acces: '',
    wifi_nom: '',
    wifi_mdp: '',
  }
}

export default function LogementsPage({ logements: initial }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [logements, setLogements] = useState<Logement[]>(initial)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Logement | null>(null)
  const [form, setForm] = useState<LogementData>(emptyForm())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'actifs' | 'en-pause' | string>('all') // string = type slug
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(initial.length >= 5 ? 'table' : 'cards')

  // Si la page est ouverte avec ?edit=id (depuis le détail), ouvrir directement la modal d'édition
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (!editId) return
    const target = logements.find(l => l.id === editId)
    if (target) openEdit(target)
    // Nettoyer l'URL pour ne pas réouvrir au refresh
    router.replace('/dashboard/logements')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Liste filtrée
  const filteredLogements = useMemo(() => {
    const q = search.trim().toLowerCase()
    return logements.filter(l => {
      if (filter === 'actifs' && l.actif === false) return false
      if (filter === 'en-pause' && l.actif !== false) return false
      // filter par type
      if (filter !== 'all' && filter !== 'actifs' && filter !== 'en-pause') {
        if (l.type_logement !== filter) return false
      }
      if (q) {
        const haystack = [l.nom, l.adresse, l.description ?? '', l.numero_enregistrement ?? ''].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [logements, search, filter])

  // Types présents dans la liste pour les chips de filtre dynamique
  const typesPresent = useMemo(() => {
    const set = new Set<string>()
    logements.forEach(l => { if (l.type_logement) set.add(l.type_logement) })
    return Array.from(set)
  }, [logements])

  function set(field: string, value: string | number | boolean | null | string[]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function openCreate() {
    setForm(emptyForm())
    setEditing(null)
    setError('')
    setModal('create')
  }

  function openEdit(l: Logement) {
    setForm({
      nom: l.nom,
      adresse: l.adresse,
      telephone: l.telephone ?? '',
      description: l.description ?? '',
      type_logement: l.type_logement,
      capacite_max: l.capacite_max,
      surface_m2: l.surface_m2,
      nb_chambres: l.nb_chambres,
      nb_lits: l.nb_lits,
      nb_sdb: l.nb_sdb,
      numero_enregistrement: l.numero_enregistrement,
      classement_etoiles: l.classement_etoiles,
      dpe: l.dpe,
      tarif_nuitee_moyen: l.tarif_nuitee_moyen,
      frais_menage: l.frais_menage,
      caution: l.caution,
      equipements: l.equipements ?? [],
      lien_airbnb: l.lien_airbnb,
      lien_booking: l.lien_booking,
      lien_gmb: l.lien_gmb,
      lien_site_direct: l.lien_site_direct,
      photo_couverture_url: l.photo_couverture_url,
      photos_urls: l.photos_urls ?? [],
      contact_urgence_nom: l.contact_urgence_nom,
      contact_urgence_tel: l.contact_urgence_tel,
      contact_menage_nom: l.contact_menage_nom,
      contact_menage_tel: l.contact_menage_tel,
      actif: l.actif ?? true,
      proprietaire_nom: l.proprietaire_nom,
      proprietaire_email: l.proprietaire_email,
      proprietaire_telephone: l.proprietaire_telephone,
      honoraires_pct: l.honoraires_pct,
      reglement_interieur: l.reglement_interieur ?? DEFAULT_REGLEMENT,
      conditions_annulation: l.conditions_annulation ?? DEFAULT_ANNULATION,
      animaux_acceptes: l.animaux_acceptes,
      fumeur_accepte: l.fumeur_accepte,
      methodes_paiement: l.methodes_paiement ?? 'virement',
      heure_arrivee: l.heure_arrivee ?? '15:00',
      heure_depart: l.heure_depart ?? '11:00',
      code_acces: l.code_acces ?? '',
      wifi_nom: l.wifi_nom ?? '',
      wifi_mdp: l.wifi_mdp ?? '',
    })
    setEditing(l)
    setError('')
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditing(null)
    setError('')
  }

  function validate(): string {
    if (!form.nom.trim()) return 'Le nom du logement est requis.'
    if (!form.adresse.trim()) return "L'adresse est requise."
    if (form.capacite_max < 1) return 'La capacité doit être au moins 1.'
    return ''
  }

  function handleSave() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')

    function buildLogementFromForm(id: string): Logement {
      return {
        id,
        nom: form.nom,
        adresse: form.adresse,
        telephone: form.telephone ?? null,
        description: form.description ?? null,
        type_logement: (form.type_logement as TypeLogement | null) ?? null,
        capacite_max: form.capacite_max,
        surface_m2: form.surface_m2 ?? null,
        nb_chambres: form.nb_chambres ?? null,
        nb_lits: form.nb_lits ?? null,
        nb_sdb: form.nb_sdb ?? null,
        numero_enregistrement: form.numero_enregistrement ?? null,
        classement_etoiles: form.classement_etoiles ?? null,
        dpe: form.dpe ?? null,
        tarif_nuitee_moyen: form.tarif_nuitee_moyen ?? null,
        frais_menage: form.frais_menage ?? null,
        caution: form.caution ?? null,
        equipements: form.equipements ?? [],
        lien_airbnb: form.lien_airbnb ?? null,
        lien_booking: form.lien_booking ?? null,
        lien_gmb: form.lien_gmb ?? null,
        lien_site_direct: form.lien_site_direct ?? null,
        photo_couverture_url: form.photo_couverture_url ?? null,
        photos_urls: form.photos_urls ?? [],
        contact_urgence_nom: form.contact_urgence_nom ?? null,
        contact_urgence_tel: form.contact_urgence_tel ?? null,
        contact_menage_nom: form.contact_menage_nom ?? null,
        contact_menage_tel: form.contact_menage_tel ?? null,
        actif: form.actif ?? true,
        proprietaire_nom: form.proprietaire_nom ?? null,
        proprietaire_email: form.proprietaire_email ?? null,
        proprietaire_telephone: form.proprietaire_telephone ?? null,
        honoraires_pct: form.honoraires_pct ?? null,
        reglement_interieur: form.reglement_interieur ?? null,
        conditions_annulation: form.conditions_annulation ?? null,
        animaux_acceptes: form.animaux_acceptes,
        fumeur_accepte: form.fumeur_accepte,
        methodes_paiement: form.methodes_paiement ?? 'virement',
        heure_arrivee: form.heure_arrivee ?? null,
        heure_depart: form.heure_depart ?? null,
        code_acces: form.code_acces ?? null,
        wifi_nom: form.wifi_nom ?? null,
        wifi_mdp: form.wifi_mdp ?? null,
      }
    }

    startTransition(async () => {
      if (modal === 'create') {
        const res = await createLogement(form)
        if (res.error) { setError(res.error); return }
        setLogements(prev => [buildLogementFromForm(res.id!), ...prev])
        setSuccess('Logement créé !')
      } else if (modal === 'edit' && editing) {
        const res = await updateLogement(editing.id, form)
        if (res.error) { setError(res.error); return }
        setLogements(prev => prev.map(l => l.id === editing.id ? buildLogementFromForm(editing.id) : l))
        setSuccess('Modifications enregistrées !')
      }
      closeModal()
      setTimeout(() => setSuccess(''), 3000)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteLogement(id)
      if (res.error) { setError(res.error); return }
      setLogements(prev => prev.filter(l => l.id !== id))
      setDeleteConfirm(null)
    })
  }

  return (
    <div style={page}>
      <div style={container}>
        {/* Header */}
        <div style={headerRow}>
          <div>
            <h1 style={pageTitle}>
              Mes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>logements</em>
            </h1>
            <p style={pageSubtitle}>
              Créez des fiches pour chacun de vos biens — elles pré-rempliront automatiquement les contrats.
            </p>
          </div>
          <button onClick={openCreate} style={addBtn}>
            <Plus size={16} weight="bold" />
            Nouveau logement
          </button>
        </div>

        {success && (
          <div style={successBanner}>
            <Check size={14} weight="bold" />
            {success}
          </div>
        )}

        {/* Filter bar (visible si > 0 logement) */}
        {logements.length > 0 && (
          <div style={filterBar}>
            <div style={filterChips}>
              <button
                onClick={() => setFilter('all')}
                style={{ ...filterChip, ...(filter === 'all' ? filterChipActive : {}) }}
              >
                Tous <span style={chipCount}>{logements.length}</span>
              </button>
              <button
                onClick={() => setFilter('actifs')}
                style={{ ...filterChip, ...(filter === 'actifs' ? filterChipActive : {}) }}
              >
                Actifs <span style={chipCount}>{logements.filter(l => l.actif !== false).length}</span>
              </button>
              {logements.some(l => l.actif === false) && (
                <button
                  onClick={() => setFilter('en-pause')}
                  style={{ ...filterChip, ...(filter === 'en-pause' ? filterChipActive : {}) }}
                >
                  En pause <span style={chipCount}>{logements.filter(l => l.actif === false).length}</span>
                </button>
              )}
              {typesPresent.length > 1 && typesPresent.map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  style={{ ...filterChip, ...(filter === t ? filterChipActive : {}) }}
                >
                  {TYPE_LOGEMENT_LABELS[t as TypeLogement] ?? t}
                </button>
              ))}
            </div>

            <div style={filterRight}>
              <div style={searchWrap}>
                <span style={searchIcon}><MagnifyingGlass size={13} weight="bold" /></span>
                <input
                  type="text"
                  placeholder="Rechercher un logement…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={searchInput}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={searchClear} aria-label="Effacer">×</button>
                )}
              </div>
              <div style={viewToggle}>
                <button
                  onClick={() => setViewMode('cards')}
                  style={{ ...viewBtn, ...(viewMode === 'cards' ? viewBtnActive : {}) }}
                  title="Vue cards"
                >
                  <SquaresFour size={13} weight="fill" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  style={{ ...viewBtn, ...(viewMode === 'table' ? viewBtnActive : {}) }}
                  title="Vue tableau"
                >
                  <Rows size={13} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hint si 1 seul logement */}
        {logements.length === 1 && !search && filter === 'all' && (
          <div
            role="button" tabIndex={0}
            onClick={() => router.push(`/dashboard/logements/${logements[0].id}`)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/dashboard/logements/${logements[0].id}`) }}
            style={singleHint}
          >
            <House size={20} weight="fill" color="var(--accent-text)" />
            <div style={{ flex: 1 }}>
              <div style={singleHintTitle}>Découvre le dashboard de ton bien</div>
              <div style={singleHintDesc}>Stats, prochains séjours, voyageurs récents, infos pratiques — tout est centralisé dans la fiche détaillée.</div>
            </div>
            <ArrowRight size={14} weight="bold" color="var(--accent-text)" />
          </div>
        )}

        {/* Empty state */}
        {logements.length === 0 && (
          <div style={emptyState}>
            <div style={emptyIcon}><House size={32} color="#34D399" weight="thin" /></div>
            <p style={emptyTitle}>Aucun logement enregistré</p>
            <p style={emptyText}>
              Créez votre première fiche logement pour gagner du temps lors de la création de vos contrats.
            </p>
            <button onClick={openCreate} style={addBtnAlt}>
              <Plus size={15} weight="bold" />
              Créer un logement
            </button>
          </div>
        )}

        {/* Empty filter state */}
        {logements.length > 0 && filteredLogements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <p style={{ marginBottom: '12px' }}>Aucun logement ne correspond à ces filtres.</p>
            <button
              onClick={() => { setSearch(''); setFilter('all') }}
              style={{ ...addBtnAlt, fontSize: '12px', padding: '7px 14px' }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Vue Tableau */}
        {filteredLogements.length > 0 && viewMode === 'table' && (
          <div style={tableWrap}>
            <table style={tableEl}>
              <thead>
                <tr>
                  <th style={tableTh}>Nom</th>
                  <th style={tableTh}>Type</th>
                  <th style={tableTh}>Adresse</th>
                  <th style={tableThNum}>Capacité</th>
                  <th style={tableThNum}>Tarif/nuit</th>
                  <th style={tableTh}>Statut</th>
                  <th style={tableTh}></th>
                </tr>
              </thead>
              <tbody>
                {filteredLogements.map(l => (
                  <tr
                    key={l.id}
                    onClick={() => router.push(`/dashboard/logements/${l.id}`)}
                    style={{ ...tableRow, opacity: l.actif === false ? 0.6 : 1 }}
                  >
                    <td style={tableTd}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ ...tableThumb, background: l.photo_couverture_url ? `center/cover no-repeat url(${l.photo_couverture_url})` : 'var(--accent-bg)' }}>
                          {!l.photo_couverture_url && <House size={14} weight="fill" color="var(--accent-text)" />}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{l.nom}</span>
                      </div>
                    </td>
                    <td style={tableTd}>
                      {l.type_logement ? TYPE_LOGEMENT_LABELS[l.type_logement] ?? l.type_logement : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ ...tableTd, color: 'var(--text-2)' }}>{l.adresse}</td>
                    <td style={tableTdNum}>{l.capacite_max} pers.</td>
                    <td style={tableTdNum}>{l.tarif_nuitee_moyen ? `${l.tarif_nuitee_moyen} €` : '—'}</td>
                    <td style={tableTd}>
                      {l.actif === false ? (
                        <span style={{ ...chip, background: 'rgba(148,163,184,0.12)', borderColor: 'rgba(148,163,184,0.3)', color: 'var(--text-muted)' }}>En pause</span>
                      ) : (
                        <span style={{ ...chip, background: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.25)', color: '#10b981' }}>Actif</span>
                      )}
                    </td>
                    <td style={tableTd}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(l) }}
                          style={iconBtn} title="Modifier"
                        >
                          <PencilSimple size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(l.id) }}
                          style={iconBtn} title="Supprimer"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Vue Cards */}
        {filteredLogements.length > 0 && viewMode === 'cards' && (
          <div style={grid}>
            {filteredLogements.map(l => (
              <div
                key={l.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/dashboard/logements/${l.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/dashboard/logements/${l.id}`) } }}
                style={{ ...card, opacity: l.actif === false ? 0.65 : 1, cursor: 'pointer' }}
              >
                {/* Photo couverture si présente */}
                {l.photo_couverture_url && (
                  <div style={cardCover}>
                    <img src={l.photo_couverture_url} alt={l.nom} style={cardCoverImg} />
                    {l.actif === false && (
                      <span style={cardCoverBadge}>En pause</span>
                    )}
                  </div>
                )}
                <div style={cardTop}>
                  {!l.photo_couverture_url ? (
                    <div style={cardIcon}><House size={18} color="var(--accent-text)" weight="fill" /></div>
                  ) : <span />}
                  <div style={cardActions}>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(l) }}
                      style={iconBtn} title="Modifier"
                    >
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm(l.id) }}
                      style={iconBtn} title="Supprimer"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>

                {/* Type + statut */}
                {(l.type_logement || l.classement_etoiles || l.actif === false) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '4px' }}>
                    {l.type_logement && (
                      <span style={typeChip}>{TYPE_LOGEMENT_LABELS[l.type_logement] ?? l.type_logement}</span>
                    )}
                    {l.classement_etoiles !== null && l.classement_etoiles > 0 && (
                      <span style={starChip}>
                        {Array.from({ length: l.classement_etoiles }).map((_, i) => (
                          <Star key={i} size={10} weight="fill" />
                        ))}
                      </span>
                    )}
                    {l.dpe && (
                      <span style={{ ...dpeChip, background: dpeColor(l.dpe).bg, color: dpeColor(l.dpe).fg, borderColor: dpeColor(l.dpe).border }}>
                        DPE {l.dpe}
                      </span>
                    )}
                    {!l.actif && (
                      <span style={{ ...chip, background: 'rgba(148,163,184,0.12)', borderColor: 'rgba(148,163,184,0.3)', color: 'var(--text-muted)' }}>
                        En pause
                      </span>
                    )}
                  </div>
                )}

                <h3 style={cardName}>{l.nom}</h3>
                <p style={cardAddress}>
                  <MapPin size={11} weight="fill" style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: 'var(--text-muted)' }} />
                  {l.adresse}
                </p>

                {/* Caractéristiques physiques */}
                <div style={cardMeta}>
                  <span style={chip}>{l.capacite_max} pers.</span>
                  {l.surface_m2 && <span style={chip}>{l.surface_m2} m²</span>}
                  {l.nb_chambres && <span style={chip}>{l.nb_chambres} ch.</span>}
                  {l.nb_lits && <span style={chip}>{l.nb_lits} lit{l.nb_lits > 1 ? 's' : ''}</span>}
                  {l.animaux_acceptes && <span style={chip}>🐾 Animaux</span>}
                  {l.fumeur_accepte && <span style={chip}>🚬 Fumeur</span>}
                </div>

                {/* Tarifs */}
                {(l.tarif_nuitee_moyen || l.frais_menage || l.caution) && (
                  <div style={tarifRow}>
                    {l.tarif_nuitee_moyen && (
                      <span style={tarifChip}>
                        <CurrencyEur size={11} weight="fill" />
                        <strong>{l.tarif_nuitee_moyen}</strong> /nuit
                      </span>
                    )}
                    {l.frais_menage && (
                      <span style={tarifChip}>Ménage {l.frais_menage}€</span>
                    )}
                    {l.caution && (
                      <span style={tarifChip}>Caution {l.caution}€</span>
                    )}
                  </div>
                )}

                {/* Liens annonces */}
                {(l.lien_airbnb || l.lien_booking || l.lien_gmb || l.lien_site_direct) && (
                  <div style={linksRow}>
                    {l.lien_airbnb && <a href={l.lien_airbnb} target="_blank" rel="noopener noreferrer" style={linkBtn} onClick={e => e.stopPropagation()} title="Voir sur Airbnb">Airbnb <ArrowSquareOut size={9} /></a>}
                    {l.lien_booking && <a href={l.lien_booking} target="_blank" rel="noopener noreferrer" style={linkBtn} onClick={e => e.stopPropagation()} title="Voir sur Booking">Booking <ArrowSquareOut size={9} /></a>}
                    {l.lien_gmb && <a href={l.lien_gmb} target="_blank" rel="noopener noreferrer" style={linkBtn} onClick={e => e.stopPropagation()} title="Voir sur Google">Google <ArrowSquareOut size={9} /></a>}
                    {l.lien_site_direct && <a href={l.lien_site_direct} target="_blank" rel="noopener noreferrer" style={linkBtn} onClick={e => e.stopPropagation()} title="Voir le site">Site <ArrowSquareOut size={9} /></a>}
                  </div>
                )}

                {/* Infos pratiques */}
                {(l.heure_arrivee || l.heure_depart || l.wifi_nom || l.code_acces) && (
                  <div style={practicalRow}>
                    {(l.heure_arrivee || l.heure_depart) && (
                      <div style={practicalItem}>
                        <Clock size={12} color="#60BEFF" />
                        <span style={practicalText}>
                          {l.heure_arrivee && <>Arrivée {l.heure_arrivee}</>}
                          {l.heure_arrivee && l.heure_depart && ' · '}
                          {l.heure_depart && <>Départ {l.heure_depart}</>}
                        </span>
                      </div>
                    )}
                    {l.wifi_nom && (
                      <CopyChip icon={<WifiHigh size={12} color="#34D399" />} label={l.wifi_nom} value={`${l.wifi_nom}${l.wifi_mdp ? ` / ${l.wifi_mdp}` : ''}`} />
                    )}
                    {l.code_acces && (
                      <CopyChip icon={<Key size={12} color="var(--accent-text)" />} label={l.code_acces} value={l.code_acces} />
                    )}
                  </div>
                )}

                {l.description && (
                  <p style={cardDesc}>{l.description.slice(0, 80)}{l.description.length > 80 ? '…' : ''}</p>
                )}

                {/* Delete confirm */}
                {deleteConfirm === l.id && (
                  <div style={deleteBox}>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-2)' }}>
                      Supprimer ce logement ? Cette action est irréversible.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleDelete(l.id)} disabled={isPending} style={deleteConfirmBtn}>
                        {isPending ? 'Suppression…' : 'Supprimer'}
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} style={cancelBtn}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div style={overlay} onClick={closeModal}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <div>
                <p style={modalTag}>{modal === 'create' ? 'Nouveau logement' : 'Modifier le logement'}</p>
                <h3 style={modalTitle}>{modal === 'create' ? 'Créer une fiche logement' : form.nom || 'Modifier'}</h3>
              </div>
              <button onClick={closeModal} style={closeBtn}><X size={18} /></button>
            </div>

            <div style={modalBody}>
              <div style={fieldRow}>
                <Field label="Nom du logement *" value={form.nom} onChange={v => set('nom', v)} placeholder="Villa les Pins, Appartement Paris 11…" />
              </div>
              <div style={fieldRow}>
                <label style={label}>Type de logement</label>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                  {(Object.entries(TYPE_LOGEMENT_LABELS) as [TypeLogement, string][]).map(([key, lbl]) => {
                    const selected = form.type_logement === key
                    return (
                      <button
                        key={key} type="button"
                        onClick={() => set('type_logement', key)}
                        style={{
                          padding: '6px 12px', borderRadius: '100px',
                          fontSize: '12px', fontWeight: 500,
                          background: selected ? 'var(--accent-bg)' : 'var(--surface)',
                          border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border)'}`,
                          color: selected ? 'var(--accent-text)' : 'var(--text-2)',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {lbl}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={fieldRow}>
                <Field label="Adresse complète *" value={form.adresse} onChange={v => set('adresse', v)} placeholder="12 rue de la Paix, 75001 Paris" />
              </div>
              <div style={fieldRow}>
                <Field label="Téléphone du logement" value={form.telephone ?? ''} onChange={v => set('telephone', v)} placeholder="+33 6 12 34 56 78" type="tel" />
              </div>
              <div style={fieldRow}>
                <Field label="Description (type, superficie, équipements)" value={form.description ?? ''} onChange={v => set('description', v)} placeholder="Studio de 25m², cuisine équipée, Wi-Fi, vue mer…" />
              </div>

              {/* ── Caractéristiques physiques ── */}
              <h4 style={sectionTitle}>Caractéristiques</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={label}>Capacité (pers.) *</label>
                  <input style={input} type="number" min={1} max={30} value={form.capacite_max} onChange={e => set('capacite_max', parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label style={label}>Surface (m²)</label>
                  <input style={input} type="number" min={0} value={form.surface_m2 ?? ''} onChange={e => set('surface_m2', e.target.value ? parseInt(e.target.value) : null)} placeholder="45" />
                </div>
                <div>
                  <label style={label}>Chambres</label>
                  <input style={input} type="number" min={0} value={form.nb_chambres ?? ''} onChange={e => set('nb_chambres', e.target.value ? parseInt(e.target.value) : null)} placeholder="2" />
                </div>
                <div>
                  <label style={label}>Lits</label>
                  <input style={input} type="number" min={0} value={form.nb_lits ?? ''} onChange={e => set('nb_lits', e.target.value ? parseInt(e.target.value) : null)} placeholder="3" />
                </div>
                <div>
                  <label style={label}>Salles de bain</label>
                  <input style={input} type="number" min={0} value={form.nb_sdb ?? ''} onChange={e => set('nb_sdb', e.target.value ? parseInt(e.target.value) : null)} placeholder="1" />
                </div>
              </div>

              {/* ── Conformité légale ── */}
              <h4 style={sectionTitle}>Conformité & classement</h4>
              <div style={fieldRow}>
                <Field label="Numéro d'enregistrement (Cerfa)" value={form.numero_enregistrement ?? ''} onChange={v => set('numero_enregistrement', v || null)} placeholder="Obligatoire dans certaines communes" />
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={label}>Classement Atout France</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2, 3, 4, 5].map(n => {
                      const selected = (form.classement_etoiles ?? 0) === n
                      return (
                        <button
                          key={n} type="button"
                          onClick={() => set('classement_etoiles', n === 0 ? null : n)}
                          style={{
                            flex: 1,
                            padding: '8px 6px', borderRadius: '8px',
                            background: selected ? 'rgba(245,158,11,0.14)' : 'var(--surface)',
                            border: `1px solid ${selected ? 'rgba(245,158,11,0.40)' : 'var(--border)'}`,
                            color: selected ? '#d97706' : 'var(--text-2)',
                            fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {n === 0 ? '—' : '★'.repeat(n)}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={label}>DPE (étiquette énergie)</label>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[null, 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(d => {
                      const selected = form.dpe === d
                      const dc = d ? dpeColor(d) : { bg: 'var(--surface)', fg: 'var(--text-2)', border: 'var(--border)' }
                      return (
                        <button
                          key={d ?? 'none'} type="button"
                          onClick={() => set('dpe', d)}
                          style={{
                            flex: 1, padding: '8px 0', borderRadius: '7px',
                            background: selected ? dc.bg : 'var(--surface)',
                            border: `1px solid ${selected ? dc.border : 'var(--border)'}`,
                            color: selected ? dc.fg : 'var(--text-3)',
                            fontSize: '12px', fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {d ?? '—'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── Tarifs ── */}
              <h4 style={sectionTitle}>Tarifs (indicatifs)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={label}>Nuitée moyenne (€)</label>
                  <input style={input} type="number" min={0} step="0.01" value={form.tarif_nuitee_moyen ?? ''} onChange={e => set('tarif_nuitee_moyen', e.target.value ? parseFloat(e.target.value) : null)} placeholder="120" />
                </div>
                <div>
                  <label style={label}>Frais de ménage (€)</label>
                  <input style={input} type="number" min={0} step="0.01" value={form.frais_menage ?? ''} onChange={e => set('frais_menage', e.target.value ? parseFloat(e.target.value) : null)} placeholder="50" />
                </div>
                <div>
                  <label style={label}>Caution (€)</label>
                  <input style={input} type="number" min={0} step="0.01" value={form.caution ?? ''} onChange={e => set('caution', e.target.value ? parseFloat(e.target.value) : null)} placeholder="500" />
                </div>
              </div>

              {/* ── Équipements ── */}
              <h4 style={sectionTitle}>Équipements</h4>
              <div style={equipementGrid}>
                {EQUIPEMENTS.map(eq => {
                  const selected = (form.equipements ?? []).includes(eq.slug)
                  const toggle = () => {
                    const cur = form.equipements ?? []
                    set('equipements', selected ? cur.filter(s => s !== eq.slug) : [...cur, eq.slug])
                  }
                  return (
                    <button
                      key={eq.slug} type="button" onClick={toggle}
                      style={{
                        ...equipementChip,
                        background: selected ? 'var(--accent-bg)' : 'var(--surface)',
                        border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border)'}`,
                        color: selected ? 'var(--accent-text)' : 'var(--text-2)',
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      <span>{eq.emoji}</span>
                      {eq.label}
                    </button>
                  )
                })}
              </div>

              {/* ── Liens annonces ── */}
              <h4 style={sectionTitle}>Liens annonces externes</h4>
              <div style={fieldRow}>
                <Field label="🏠 URL Airbnb" value={form.lien_airbnb ?? ''} onChange={v => set('lien_airbnb', v || null)} placeholder="https://airbnb.fr/rooms/…" />
              </div>
              <div style={fieldRow}>
                <Field label="🛎️ URL Booking.com" value={form.lien_booking ?? ''} onChange={v => set('lien_booking', v || null)} placeholder="https://booking.com/…" />
              </div>
              <div style={fieldRow}>
                <Field label="📍 URL Google Business Profile" value={form.lien_gmb ?? ''} onChange={v => set('lien_gmb', v || null)} placeholder="https://maps.google.com/…" />
              </div>
              <div style={fieldRow}>
                <Field label="🌐 Site direct / Driing" value={form.lien_site_direct ?? ''} onChange={v => set('lien_site_direct', v || null)} placeholder="https://…" />
              </div>

              {/* ── Photo ── */}
              <h4 style={sectionTitle}>Photo de couverture</h4>
              <div style={fieldRow}>
                <Field label="URL de la photo" value={form.photo_couverture_url ?? ''} onChange={v => set('photo_couverture_url', v || null)} placeholder="https://…/photo.jpg" />
              </div>

              {/* ── Contacts utiles ── */}
              <h4 style={sectionTitle}>Contacts utiles</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <Field label="Contact urgence (nom)" value={form.contact_urgence_nom ?? ''} onChange={v => set('contact_urgence_nom', v || null)} placeholder="Plombier 24h/24" />
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <Field label="Téléphone urgence" value={form.contact_urgence_tel ?? ''} onChange={v => set('contact_urgence_tel', v || null)} placeholder="+33 …" type="tel" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <Field label="Ménage (nom)" value={form.contact_menage_nom ?? ''} onChange={v => set('contact_menage_nom', v || null)} placeholder="Marie" />
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <Field label="Téléphone ménage" value={form.contact_menage_tel ?? ''} onChange={v => set('contact_menage_tel', v || null)} placeholder="+33 …" type="tel" />
                </div>
              </div>

              {/* ── Statut ── */}
              <div style={{ marginTop: '8px' }}>
                <Toggle label="Logement actif (visible dans les listes et stats)" value={form.actif ?? true} onChange={v => set('actif', v)} />
              </div>
              {/* ── Informations pratiques ── */}
              <div style={sectionDivider}>
                <span style={sectionLabel}>Informations pratiques</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label style={label}>Heure d&apos;arrivée</label>
                  <input style={input} type="time" value={form.heure_arrivee ?? ''} onChange={e => set('heure_arrivee', e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label style={label}>Heure de départ</label>
                  <input style={input} type="time" value={form.heure_depart ?? ''} onChange={e => set('heure_depart', e.target.value)} />
                </div>
              </div>
              <div style={fieldRow}>
                <Field label="Code d'accès (porte, boîte à clés…)" value={form.code_acces ?? ''} onChange={v => set('code_acces', v)} placeholder="1234# ou A2B9" />
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <Field label="Nom du réseau Wi-Fi" value={form.wifi_nom ?? ''} onChange={v => set('wifi_nom', v)} placeholder="MonWifi_5G" />
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <Field label="Mot de passe Wi-Fi" value={form.wifi_mdp ?? ''} onChange={v => set('wifi_mdp', v)} placeholder="motdepasse123" />
                </div>
              </div>

              {/* ── Conditions & règlement ── */}
              <div style={sectionDivider}>
                <span style={sectionLabel}>Conditions & règlement</span>
              </div>
              <div style={fieldRow}>
                <label style={label}>Conditions d&apos;annulation</label>
                <textarea
                  style={{ ...input, height: '80px', resize: 'vertical' as const, fontFamily: 'inherit' }}
                  value={form.conditions_annulation ?? ''}
                  onChange={e => set('conditions_annulation', e.target.value)}
                />
              </div>
              <div style={fieldRow}>
                <label style={label}>Règlement intérieur</label>
                <textarea
                  style={{ ...input, height: '100px', resize: 'vertical' as const, fontFamily: 'inherit' }}
                  value={form.reglement_interieur ?? ''}
                  onChange={e => set('reglement_interieur', e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
                <Toggle label="Animaux admis" value={form.animaux_acceptes} onChange={v => set('animaux_acceptes', v)} />
                <Toggle label="Tabac autorisé" value={form.fumeur_accepte} onChange={v => set('fumeur_accepte', v)} />
              </div>
              <div style={fieldRow}>
                <label style={label}>Méthodes de paiement acceptées</label>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                  {([
                    { value: 'virement', label: '🏦 Virement bancaire' },
                    { value: 'stripe',   label: '💳 Paiement Stripe (en ligne)' },
                    { value: 'especes',  label: '💵 Espèces' },
                    { value: 'cheque',   label: '📄 Chèque' },
                    { value: 'paypal',   label: '🅿️ PayPal' },
                    { value: 'airbnb',   label: '🏠 Airbnb / Booking' },
                    { value: 'carte',    label: '💳 Carte bancaire (TPE)' },
                  ] as { value: string; label: string }[]).map(opt => {
                    const selected = (form.methodes_paiement ?? 'virement').split(',').map(s => s.trim())
                    const checked = selected.includes(opt.value)
                    const toggle = () => {
                      const next = checked ? selected.filter(v => v !== opt.value) : [...selected, opt.value]
                      set('methodes_paiement', next.length ? next.join(',') : 'virement')
                    }
                    return (
                      <label key={opt.value} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '7px',
                        padding: '7px 12px', borderRadius: '10px', cursor: 'pointer',
                        background: checked ? 'rgba(52,211,153,0.1)' : 'var(--surface)',
                        border: `1px solid ${checked ? 'rgba(52,211,153,0.35)' : 'var(--border)'}`,
                        fontSize: '13px', fontWeight: checked ? 600 : 400,
                        color: checked ? '#34D399' : 'var(--text-2)',
                        transition: 'all 0.15s', userSelect: 'none' as const,
                      }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={toggle}
                          style={{ display: 'none' }}
                        />
                        {opt.label}
                      </label>
                    )
                  })}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-3)' }}>
                  Sélectionnez tous les modes acceptés — ils seront proposés dans le contrat.
                </p>
              </div>
              {error && (
                <div style={errorBox}>
                  <Warning size={13} />
                  {error}
                </div>
              )}
            </div>

            <div style={modalFooter}>
              <button onClick={closeModal} style={ghostBtn}>Annuler</button>
              <button onClick={handleSave} disabled={isPending} style={saveBtn}>
                {isPending ? 'Enregistrement…' : modal === 'create' ? (
                  <><Plus size={14} /> Créer le logement</>
                ) : (
                  <><Check size={14} /> Enregistrer</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CopyChip ─────────────────────────────────────────────────────────────────

function CopyChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={handleCopy} style={copyChipStyle} title={`Copier : ${value}`}>
      {copied ? <Check size={11} color="#34D399" weight="bold" /> : icon}
      <span style={{ fontSize: '11px', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {copied ? 'Copié !' : label}
      </span>
      <Copy size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
    </button>
  )
}

// ─── DPE color helper ─────────────────────────────────────────────────────────

function dpeColor(letter: string): { bg: string; fg: string; border: string } {
  switch (letter) {
    case 'A': return { bg: 'rgba(34,197,94,0.12)',  fg: '#16a34a', border: 'rgba(34,197,94,0.30)' }
    case 'B': return { bg: 'rgba(132,204,22,0.12)', fg: '#65a30d', border: 'rgba(132,204,22,0.30)' }
    case 'C': return { bg: 'rgba(234,179,8,0.12)',  fg: '#ca8a04', border: 'rgba(234,179,8,0.30)' }
    case 'D': return { bg: 'rgba(245,158,11,0.12)', fg: '#d97706', border: 'rgba(245,158,11,0.30)' }
    case 'E': return { bg: 'rgba(249,115,22,0.12)', fg: '#ea580c', border: 'rgba(249,115,22,0.30)' }
    case 'F': return { bg: 'rgba(239,68,68,0.12)',  fg: '#dc2626', border: 'rgba(239,68,68,0.30)' }
    case 'G': return { bg: 'rgba(127,29,29,0.18)',  fg: '#991b1b', border: 'rgba(127,29,29,0.40)' }
    default:  return { bg: 'rgba(148,163,184,0.12)', fg: 'var(--text-muted)', border: 'rgba(148,163,184,0.25)' }
  }
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({ label: lbl, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={label}>{lbl}</label>
      <input style={input} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function Toggle({ label: lbl, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <input
        type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        style={{ width: '16px', height: '16px', accentColor: '#34D399' }}
      />
      <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>{lbl}</span>
    </label>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  padding: 'clamp(20px,3vw,44px)', width: '100%',
}

const container: React.CSSProperties = {}

const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  flexWrap: 'wrap' as const, gap: '16px', marginBottom: '28px',
}

const pageTitle: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), serif',
  fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 6px',
}

const pageSubtitle: React.CSSProperties = {
  fontSize: '14px', color: 'var(--text-2)', margin: 0, lineHeight: 1.6,
}

const addBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px',
  background: 'var(--accent-text)', color: 'var(--bg)',
  border: 'none', borderRadius: '12px',
  padding: '10px 18px', fontSize: '14px', fontWeight: 600,
  cursor: 'pointer', flexShrink: 0,
}

const addBtnAlt: React.CSSProperties = {
  ...addBtn,
  background: 'var(--accent-bg)',
  border: '1px solid var(--accent-border)',
  color: 'var(--accent-text)',
}

const successBanner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
  borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
  fontSize: '13px', color: '#34D399', fontWeight: 500,
}

const emptyState: React.CSSProperties = {
  textAlign: 'center' as const,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '20px', padding: '60px 40px',
}

const emptyIcon: React.CSSProperties = {
  width: '64px', height: '64px',
  background: 'rgba(52,211,153,0.08)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 20px',
}

const emptyTitle: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), Georgia, serif',
  fontSize: '20px', fontWeight: 400, color: 'var(--text)', margin: '0 0 8px',
}

const emptyText: React.CSSProperties = {
  fontSize: '14px', color: 'var(--text-2)', margin: '0 0 24px', lineHeight: 1.6,
  maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto',
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px',
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px', padding: '20px',
  display: 'flex', flexDirection: 'column', gap: '8px',
}

const cardTop: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: '4px',
}

const cardIcon: React.CSSProperties = {
  width: '36px', height: '36px',
  background: 'rgba(52,211,153,0.08)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const cardActions: React.CSSProperties = {
  display: 'flex', gap: '6px',
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '30px', height: '30px',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: '8px', cursor: 'pointer',
  color: 'var(--text-2)', transition: 'all 0.15s',
}

const cardName: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), Georgia, serif',
  fontSize: '17px', fontWeight: 400, color: 'var(--text)', margin: 0,
}

const cardAddress: React.CSSProperties = {
  fontSize: '13px', color: 'var(--text-2)', margin: 0, lineHeight: 1.5,
}

const cardMeta: React.CSSProperties = {
  display: 'flex', gap: '6px', flexWrap: 'wrap' as const,
}

const chip: React.CSSProperties = {
  display: 'inline-block',
  background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '6px', padding: '3px 8px',
  fontSize: '11px', color: '#34D399', fontWeight: 500,
}

const cardDesc: React.CSSProperties = {
  fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: 1.5,
}

const deleteBox: React.CSSProperties = {
  marginTop: '8px', padding: '14px',
  background: 'rgba(239,68,68,0.06)',
  border: '1px solid rgba(239,68,68,0.15)',
  borderRadius: '10px',
}

const deleteConfirmBtn: React.CSSProperties = {
  padding: '6px 14px', borderRadius: '8px',
  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
  color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
}

const cancelBtn: React.CSSProperties = {
  padding: '6px 14px', borderRadius: '8px',
  background: 'none', border: '1px solid var(--border)',
  color: 'var(--text-2)', fontSize: '13px', cursor: 'pointer',
}

// Modal
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 400,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
}

const modalBox: React.CSSProperties = {
  background: 'var(--bg-2, #0f2018)',
  border: '1px solid var(--border-2, #1e3d2f)',
  borderRadius: '22px',
  width: '100%', maxWidth: '560px',
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 32px 100px rgba(0,0,0,0.5)',
}

const modalHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  padding: '22px 24px 16px',
  borderBottom: '1px solid var(--border, #1e3d2f)',
}

const modalTag: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px',
  textTransform: 'uppercase', color: '#34D399', margin: '0 0 4px',
}

const modalTitle: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), Georgia, serif',
  fontSize: '20px', fontWeight: 400, color: 'var(--text)', margin: 0,
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-3)', padding: '4px',
}

const modalBody: React.CSSProperties = {
  padding: '20px 24px',
  display: 'flex', flexDirection: 'column', gap: '14px',
}

const modalFooter: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 24px 20px',
  borderTop: '1px solid var(--border, #1e3d2f)',
}

const fieldRow: React.CSSProperties = {
  display: 'flex', flexDirection: 'column',
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '12px', fontWeight: 500,
  color: 'var(--text-2)',
  marginBottom: '6px',
}

const input: React.CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box' as const,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px', padding: '10px 12px',
  fontSize: '14px', color: 'var(--text)',
  outline: 'none',
}

const errorBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  fontSize: '13px', color: '#ef4444',
  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
  borderRadius: '8px', padding: '10px 14px',
}

const ghostBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '14px', color: 'var(--text-2)', padding: '8px 0',
}

const saveBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: '#34D399', color: '#0a1a14',
  border: 'none', borderRadius: '12px',
  padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
}

// ─── Practical info styles ────────────────────────────────────────────────────

const practicalRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px',
}

const practicalItem: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  background: 'rgba(96,190,255,0.07)', border: '1px solid rgba(96,190,255,0.15)',
  borderRadius: '7px', padding: '4px 9px',
}

const practicalText: React.CSSProperties = {
  fontSize: '11px', color: '#60BEFF', fontWeight: 500,
}

const copyChipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
  borderRadius: '7px', padding: '4px 9px',
  cursor: 'pointer', color: 'var(--text-2)', transition: 'all 0.15s',
}

const sectionDivider: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
  borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '4px',
}

const sectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
}

// ─── Phase 3 — filtres, recherche, tableau ──────────────────────────────────

const filterBar: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  gap: '12px', flexWrap: 'wrap' as const,
  marginBottom: '16px',
}

const filterChips: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap' as const, gap: '6px',
}

const filterChip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px',
  fontSize: '12.5px', fontWeight: 500,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '100px',
  color: 'var(--text-2)',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const filterChipActive: React.CSSProperties = {
  background: 'var(--accent-bg)',
  borderColor: 'var(--accent-border)',
  color: 'var(--accent-text)',
}

const chipCount: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700,
  opacity: 0.7,
}

const filterRight: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
}

const searchWrap: React.CSSProperties = {
  position: 'relative' as const,
  width: '220px',
}

const searchIcon: React.CSSProperties = {
  position: 'absolute' as const,
  left: '12px', top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
  display: 'flex',
  pointerEvents: 'none' as const,
}

const searchInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 30px 8px 32px',
  fontSize: '12.5px',
  fontFamily: 'inherit',
  color: 'var(--text)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '9px',
  outline: 'none',
}

const searchClear: React.CSSProperties = {
  position: 'absolute' as const,
  right: '6px', top: '50%',
  transform: 'translateY(-50%)',
  width: '20px', height: '20px',
  borderRadius: '50%',
  border: 'none',
  background: 'var(--border)',
  color: 'var(--text-2)',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1,
  fontFamily: 'inherit',
}

const viewToggle: React.CSSProperties = {
  display: 'inline-flex', gap: '2px',
  padding: '3px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '9px',
}

const viewBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '28px', height: '28px',
  background: 'transparent',
  border: 'none',
  borderRadius: '6px',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const viewBtnActive: React.CSSProperties = {
  background: 'var(--accent-bg)',
  color: 'var(--accent-text)',
}

// Single-logement hint
const singleHint: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '14px',
  padding: '14px 18px',
  background: 'var(--accent-bg)',
  border: '1px dashed var(--accent-border-2)',
  borderRadius: '12px',
  cursor: 'pointer',
  marginBottom: '16px',
}

const singleHintTitle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600,
  color: 'var(--text)',
  marginBottom: '2px',
}

const singleHintDesc: React.CSSProperties = {
  fontSize: '12px', fontWeight: 300,
  color: 'var(--text-2)',
  lineHeight: 1.5,
}

// Table
const tableWrap: React.CSSProperties = {
  overflowX: 'auto' as const,
  background: 'var(--surface)',
  border: '1px solid var(--border-2)',
  borderRadius: '14px',
}

const tableEl: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: '13px',
}

const tableTh: React.CSSProperties = {
  padding: '12px 14px',
  textAlign: 'left' as const,
  fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px',
  textTransform: 'uppercase' as const,
  color: 'var(--text-muted)',
  background: 'var(--bg-2)',
  borderBottom: '1px solid var(--border-2)',
}

const tableThNum: React.CSSProperties = {
  ...tableTh,
  textAlign: 'right' as const,
}

const tableRow: React.CSSProperties = {
  cursor: 'pointer',
  borderBottom: '1px solid var(--border)',
  transition: 'background 0.12s',
}

const tableTd: React.CSSProperties = {
  padding: '12px 14px',
  color: 'var(--text-2)',
  fontWeight: 400,
}

const tableTdNum: React.CSSProperties = {
  ...tableTd,
  textAlign: 'right' as const,
  fontWeight: 500,
  color: 'var(--text)',
}

const tableThumb: React.CSSProperties = {
  width: '32px', height: '32px',
  borderRadius: '7px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
}

// ─── Phase 1 — nouveaux styles ─────────────────────────────────────────────────

const cardCover: React.CSSProperties = {
  position: 'relative' as const,
  margin: '-20px -20px 4px',
  height: '120px',
  overflow: 'hidden' as const,
  borderTopLeftRadius: '15px',
  borderTopRightRadius: '15px',
  background: 'var(--bg-2)',
}

const cardCoverImg: React.CSSProperties = {
  width: '100%', height: '100%',
  objectFit: 'cover' as const,
  display: 'block',
}

const cardCoverBadge: React.CSSProperties = {
  position: 'absolute' as const,
  top: '10px', right: '10px',
  background: 'rgba(0,0,0,0.65)', color: '#fff',
  fontSize: '10px', fontWeight: 600,
  padding: '3px 9px', borderRadius: '100px',
  letterSpacing: '0.4px',
}

const typeChip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  background: 'var(--accent-bg)', color: 'var(--accent-text)',
  border: '1px solid var(--accent-border)',
  borderRadius: '6px', padding: '3px 8px',
  fontSize: '10px', fontWeight: 600, letterSpacing: '0.3px',
  textTransform: 'uppercase' as const,
}

const starChip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '1px',
  background: 'rgba(245,158,11,0.10)', color: '#d97706',
  border: '1px solid rgba(245,158,11,0.25)',
  borderRadius: '6px', padding: '3px 6px',
}

const dpeChip: React.CSSProperties = {
  display: 'inline-block',
  border: '1px solid',
  borderRadius: '6px', padding: '3px 8px',
  fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
}

const tarifRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap' as const, gap: '4px', paddingTop: '4px',
}

const tarifChip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '3px',
  background: 'rgba(16,185,129,0.08)', color: '#10b981',
  border: '1px solid rgba(16,185,129,0.20)',
  borderRadius: '6px', padding: '3px 8px',
  fontSize: '11px', fontWeight: 500,
}

const linksRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap' as const, gap: '4px', paddingTop: '4px',
}

const linkBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  background: 'var(--surface)', color: 'var(--text-2)',
  border: '1px solid var(--border)',
  borderRadius: '6px', padding: '3px 8px',
  fontSize: '11px', fontWeight: 500,
  textDecoration: 'none' as const,
  transition: 'all 0.15s',
}

// Modal — sections du formulaire enrichi
const sectionTitle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, letterSpacing: '0.4px',
  textTransform: 'uppercase' as const,
  color: 'var(--accent-text)',
  margin: '14px 0 8px',
}

const equipementGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
  gap: '6px',
}

const equipementChip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 10px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  cursor: 'pointer',
  userSelect: 'none' as const,
  transition: 'all 0.15s',
}
