import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getDog, deleteDog, updateDog, getDogs } from '../lib/data.js'
import { useApp } from '../App.jsx'
import { timeAgo } from '../lib/utils.js'

const C = {
  primary: '#E8453C', primarySoft: '#FFF0EF', primaryDark: '#C93830',
  secondary: '#0B3558',
  accent: '#F5A623', accentSoft: '#FFF8EC',
  teal: '#22AA86', tealSoft: '#EEFAF6',
  success: '#22AA86', successSoft: '#EEFAF6',
  warning: '#F5A623', warningSoft: '#FFF8EC',
  danger: '#E8453C', dangerSoft: '#FFF0EF',
  info: '#3B82F6', infoSoft: '#EFF6FF',
  text: '#1A1A2E', textSecondary: '#6B7280', textMuted: '#9CA3AF',
  bg: '#F7F7F7', bgCard: '#FFFFFF', bgSection: '#FAFAFA',
  border: '#E5E7EB', borderLight: '#F3F4F6',
}

const STATUS_CONFIG = {
  sighted:       { color: C.warning,  bg: C.warningSoft, label: 'Sighted' },
  being_rescued: { color: C.danger,   bg: C.dangerSoft,  label: 'Being Rescued' },
  in_shelter:    { color: C.info,     bg: C.infoSoft,    label: 'In Shelter' },
  reunited:      { color: C.success,  bg: C.successSoft, label: 'Reunited' },
}

const STATUS_OPTIONS = ['sighted', 'being_rescued', 'in_shelter', 'reunited']

export default function DogPage() {
  const { dogId } = useParams()
  const { nav, user } = useApp()
  const [dog, setDog]                   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [deleting, setDeleting]         = useState(false)
  const [confirm, setConfirm]           = useState(false)
  const [status, setStatus]             = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusSaved, setStatusSaved]   = useState(false)
  const [matches, setMatches]           = useState([])
  const [heroImgFailed, setHeroImgFailed] = useState(false)
  const [photoOpen, setPhotoOpen]       = useState(false)
  const [mapLoaded, setMapLoaded]       = useState(false)

  useEffect(() => {
    if (!dogId) { nav('feed'); return }
    getDog(dogId).then(({ data }) => {
      setDog(data); setStatus(data?.status || 'sighted'); setLoading(false)
    })
  }, [dogId])

  useEffect(() => {
    if (!dog) return
    const otherType = dog.report_type === 'lost_pet' ? 'stray' : 'lost_pet'
    getDogs({ report_type: otherType, city: dog.city }).then(({ data }) => {
      if (!data) return
      const filtered = data.filter(d => {
        const colorMatch = d.color && dog.color && d.color.toLowerCase().includes(dog.color.toLowerCase().split(' ')[0])
        const breedMatch = d.breed && dog.breed && d.breed.toLowerCase().includes(dog.breed.toLowerCase().split(' ')[0])
        return colorMatch || breedMatch
      })
      setMatches(filtered.slice(0, 5))
    })
  }, [dog])

  useEffect(() => {
    if (!dog?.lat || !dog?.lng || mapLoaded) return
    const L = window.L
    if (!L) return
    setTimeout(() => {
      const el = document.getElementById('dog-map')
      if (!el || el._leaflet_id) return
      const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([dog.lat, dog.lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      L.circleMarker([dog.lat, dog.lng], { radius: 10, color: C.primary, fillColor: C.primary, fillOpacity: 0.8 }).addTo(map)
      setMapLoaded(true)
    }, 100)
  }, [dog, mapLoaded])

  const handleDelete = async () => { setDeleting(true); await deleteDog(dogId); nav('feed') }

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus); setStatusSaving(true)
    await updateDog(dog.id, { status: newStatus })
    setStatusSaving(false); setStatusSaved(true)
    setTimeout(() => setStatusSaved(false), 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 36 }}>🐾</div>
      <div style={{ fontSize: 14, color: C.textMuted }}>Loading...</div>
    </div>
  )

  if (!dog) return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🐕</div>
      <div style={{ fontSize: 15, color: C.textMuted }}>Dog not found</div>
      <button onClick={() => nav('feed')} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
    </div>
  )

  const isLostPet = dog.report_type === 'lost_pet'
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.sighted

  const attrs = [
    { label: 'Breed',      value: dog.breed || '—' },
    { label: 'Colour',     value: dog.color || '—' },
    { label: 'Size',       value: dog.size || '—' },
    { label: 'Sex',        value: dog.sex || '—' },
    { label: 'Age',        value: dog.age || '—' },
    { label: 'Vaccinated', value: dog.vaccinated ? 'Yes' : 'No' },
    ...(dog.confidence ? [{ label: 'AI Conf.', value: `${dog.confidence}%` }] : []),
    ...(isLostPet && dog.owner_phone ? [{ label: 'Phone', value: dog.owner_phone }] : []),
  ]

  return (
    <div style={{ background: C.bg, minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`, padding: '14px 20px 12px' }}>
        <div onClick={() => nav('feed')} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4, cursor: 'pointer' }}>← Back</div>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>Dog Profile</div>
      </div>

      {/* Hero */}
      <div style={{ height: 200, background: isLostPet ? '#FFF0E8' : '#F0EBE6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', cursor: dog.photo_url && !heroImgFailed ? 'pointer' : 'default' }}
        onClick={() => { if (dog.photo_url && !heroImgFailed) setPhotoOpen(true) }}>
        {dog.photo_url && !heroImgFailed
          ? <img src={dog.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setHeroImgFailed(true)} />
          : <span style={{ fontSize: 90 }}>{isLostPet ? '🔍' : '🐕'}</span>}
        <div style={{ position: 'absolute', bottom: 12, left: 16 }}>
          <span style={{ background: sc.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 10 }}>{sc.label}</span>
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 16 }}>
          <span style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 8 }}>{timeAgo(dog.created_at)}</span>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Name + AI badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 28, color: C.text }}>{isLostPet ? (dog.pet_name || 'Unknown') : dog.dog_id}</div>
            <div style={{ color: C.textSecondary, fontSize: 13, marginTop: 2 }}>ID: {dog.dog_id} · {dog.breed}</div>
          </div>
          {dog.confidence >= 70 && (
            <div style={{ background: C.successSoft, border: `1px solid ${C.success}30`, borderRadius: 14, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 18 }}>🤖</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.success }}>AI Verified</div>
            </div>
          )}
        </div>

        {/* Passport-style CTA */}
        <div style={{ background: C.secondary, borderRadius: 24, padding: 16, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, boxShadow: '0 4px 16px rgba(11,53,88,0.15)' }}>
          <span style={{ fontSize: 20 }}>🪪</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>View Dog Passport</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 }}>Digital ID with all attributes</div>
          </div>
          <span style={{ color: C.accent, fontSize: 20 }}>›</span>
        </div>

        {/* Attributes grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {attrs.map(attr => (
            <div key={attr.label} style={{ background: C.bgSection, borderRadius: 14, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', border: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{attr.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 1 }}>{attr.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Injured banner */}
        {dog.injured && (
          <div style={{ background: C.dangerSoft, border: `1.5px solid ${C.danger}30`, borderRadius: 16, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.danger }}>Injuries observed</div>
              {dog.injury_notes && <div style={{ fontSize: 12, color: C.danger, marginTop: 2 }}>{dog.injury_notes}</div>}
            </div>
          </div>
        )}

        {/* Vaccination notes */}
        {dog.vaccinated && dog.vaccination_notes && (
          <div style={{ background: C.successSoft, border: `1px solid ${C.success}30`, borderRadius: 16, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.success }}>💉 {dog.vaccination_notes}</div>
          </div>
        )}

        {/* Location */}
        <div style={{ background: C.accentSoft, border: `1px solid ${C.accent}30`, borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.primary }}>{isLostPet ? 'Last Known Location' : 'Last Seen'}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{dog.area || 'Unknown'}, {dog.city || 'Unknown'}</div>
          {dog.lat && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{dog.lat.toFixed(4)}°N, {dog.lng.toFixed(4)}°E</div>}
          {isLostPet && dog.date_lost && <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>Last seen: {dog.date_lost}</div>}
        </div>

        {/* Map */}
        {dog.lat && <div id="dog-map" style={{ width: '100%', height: 180, borderRadius: 20, marginBottom: 14, background: C.borderLight, overflow: 'hidden', boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }} />}

        {/* Notes */}
        {dog.notes && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '12px 14px', marginBottom: 12, border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>NOTES</div>
            <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.5 }}>{dog.notes}</div>
          </div>
        )}

        {/* Reporter */}
        <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', marginBottom: 16 }}>
          Reported by {dog.reporter_name || 'Anonymous'} · {timeAgo(dog.created_at)}
        </div>

        {/* Status update */}
        {!isLostPet && user && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' }}>Update Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {STATUS_OPTIONS.map(s => {
                const cfg = STATUS_CONFIG[s]
                return (
                  <button key={s} onClick={() => handleStatusChange(s)} disabled={statusSaving}
                    style={{ padding: '10px 8px', borderRadius: 12, border: `2px solid ${status === s ? cfg.color : C.border}`, background: status === s ? cfg.bg : '#fff', color: status === s ? cfg.color : C.textSecondary, fontSize: 12, fontWeight: status === s ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {cfg.label}
                  </button>
                )
              })}
            </div>
            {statusSaving && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8, textAlign: 'center' }}>Saving...</div>}
            {statusSaved && <div style={{ fontSize: 12, color: C.success, marginTop: 8, textAlign: 'center', fontWeight: 600 }}>✓ Status updated</div>}
          </div>
        )}

        {/* Contact */}
        <div style={{ marginBottom: 10 }}>
          {isLostPet && dog.owner_phone
            ? <a href={`tel:${dog.owner_phone}`} style={{ display: 'block', width: '100%', background: C.primary, color: '#fff', border: 'none', borderRadius: 14, padding: 14, textAlign: 'center', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxSizing: 'border-box' }}>📞 Contact Owner</a>
            : <button style={{ width: '100%', background: C.primary, color: '#fff', border: 'none', borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>📞 Contact Reporter</button>
          }
        </div>

        {/* Matches */}
        {matches.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, border: `1px solid ${C.borderLight}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {isLostPet ? '🐕 Possible Stray Matches' : '🔍 Owner Looking?'}
            </div>
            {matches.map(m => (
              <div key={m.id} onClick={() => nav('dog', { dogId: m.id })}
                style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: C.bgSection, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {m.report_type === 'lost_pet' ? '🔍' : '🐕'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.report_type === 'lost_pet' ? (m.pet_name || 'Unknown') : m.dog_id}</div>
                  <div style={{ fontSize: 12, color: C.textSecondary }}>{m.breed} · {m.color} · {m.area}</div>
                </div>
                <span style={{ color: C.textMuted, fontSize: 12 }}>{timeAgo(m.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Delete */}
        {user && (
          <div style={{ marginBottom: 24 }}>
            {confirm ? (
              <div style={{ background: C.dangerSoft, borderRadius: 16, padding: 16, border: `1px solid ${C.danger}30` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.danger, marginBottom: 12 }}>Delete this record?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: 12, background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 12, background: C.danger, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{deleting ? 'Deleting...' : 'Yes, delete'}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} style={{ width: '100%', padding: 12, background: '#fff', color: C.danger, border: `1.5px solid ${C.danger}40`, borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>Delete record</button>
            )}
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      {photoOpen && dog.photo_url && !heroImgFailed && (
        <div onClick={() => setPhotoOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={dog.photo_url} alt="" style={{ maxWidth: '96vw', maxHeight: '88vh', borderRadius: 12, objectFit: 'contain' }} />
          <div style={{ position: 'absolute', top: 16, right: 16, color: '#fff', fontSize: 28, cursor: 'pointer' }}>✕</div>
        </div>
      )}
    </div>
  )
}
