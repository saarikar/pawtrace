import { useState, useEffect } from 'react'
import { getDog, deleteDog, updateDog, getDogs } from '../lib/data.js'
import { useApp } from '../App.jsx'

const ORANGE = '#E07B39'
const DARK_ORANGE = '#C0510B'
const NAVY = '#1F4E79'
const LIGHT_NAVY = '#2E74B5'
const BG = '#FDF8F4'
const GRAY = '#6B7280'
const LIGHT_GRAY = '#F3F4F6'
const GREEN = '#16A34A'
const RED = '#DC2626'
const AMBER = '#D97706'

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const STATUS_OPTIONS = [
  { value: 'sighted',       label: 'Sighted' },
  { value: 'being_rescued', label: '🚑 Being rescued' },
  { value: 'in_shelter',    label: '🏠 In shelter' },
  { value: 'reunited',      label: '✅ Reunited' },
]

const STATUS_COLORS = {
  sighted:       GRAY,
  being_rescued: AMBER,
  in_shelter:    LIGHT_NAVY,
  reunited:      GREEN,
}

export default function DogPage({ dogId }) {
  const { nav, user } = useApp()
  const [dog, setDog]                   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [deleting, setDeleting]         = useState(false)
  const [confirm, setConfirm]           = useState(false)
  const [mapLoaded, setMapLoaded]       = useState(false)
  const [status, setStatus]             = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusSaved, setStatusSaved]   = useState(false)
  const [matches, setMatches]           = useState([])
  const [heroImgFailed, setHeroImgFailed] = useState(false)
  const [photoOpen, setPhotoOpen]       = useState(false)

  useEffect(() => {
    if (!dogId) { nav('feed'); return }
    getDog(dogId).then(({ data }) => {
      setDog(data)
      setStatus(data?.status || 'sighted')
      setLoading(false)
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
      L.circleMarker([dog.lat, dog.lng], { radius: 10, color: ORANGE, fillColor: ORANGE, fillOpacity: 0.8 }).addTo(map)
      setMapLoaded(true)
    }, 100)
  }, [dog, mapLoaded])

  const handleDelete = async () => {
    setDeleting(true)
    await deleteDog(dogId)
    nav('feed')
  }

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus)
    setStatusSaving(true)
    await updateDog(dog.id, { status: newStatus })
    setStatusSaving(false)
    setStatusSaved(true)
    setTimeout(() => setStatusSaved(false), 2000)
  }

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: GRAY }}>Loading...</div>
  if (!dog) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 40 }}>🐕</div>
      <div style={{ fontSize: 15, color: GRAY }}>Dog not found</div>
      <button onClick={() => nav('feed')} style={{ padding: '8px 16px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>← Back</button>
    </div>
  )

  const isLostPet = dog.report_type === 'lost_pet'
  const statusBadgeColor = isLostPet ? RED : (status === 'reunited' ? GREEN : AMBER)
  const statusBadgeLabel = isLostPet ? '🚨 LOST' : (status === 'reunited' ? '✅ REUNITED' : '📍 SIGHTED')

  const attrs = [
    ['🐾 Breed',  dog.breed || '—'],
    ['⚧ Sex',    dog.sex || '—'],
    ['🎂 Age',   dog.age || '—'],
    ['📏 Size',  dog.size || '—'],
    ['🎨 Colour', dog.color || '—'],
    ['💉 Vaccinated', dog.vaccinated ? 'Yes' : 'No'],
    ...(dog.confidence ? [['🤖 AI Confidence', `${dog.confidence}%`]] : []),
    ...(isLostPet && dog.owner_phone ? [['📞 Phone', dog.owner_phone]] : []),
  ]

  return (
    <div style={{ background: BG, minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${DARK_ORANGE}, ${ORANGE})`, padding: '10px 14px 10px' }}>
        <div onClick={() => nav('feed')} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4, cursor: 'pointer' }}>← Lost & Found Feed</div>
        <div style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>Dog Profile</div>
      </div>

      {/* Hero */}
      <div style={{ height: 150, background: isLostPet ? 'linear-gradient(135deg, #fff3e0, #ffe0b2)' : 'linear-gradient(135deg, #f5e6d0, #edd5b3)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div
          onClick={() => { if (dog.photo_url && !heroImgFailed) setPhotoOpen(true) }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: dog.photo_url && !heroImgFailed ? 'pointer' : 'default' }}>
          <span style={{ fontSize: 90 }}>{isLostPet ? '🔍' : '🐕'}</span>
          {dog.photo_url && !heroImgFailed && (
            <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', fontWeight: 600 }}>tap to view photo</span>
          )}
        </div>
        {dog.photo_url && (
          <img src={dog.photo_url} alt="" style={{ display: 'none' }} onError={() => setHeroImgFailed(true)} />
        )}
        <div style={{ position: 'absolute', bottom: 10, left: 14 }}>
          <span style={{ background: statusBadgeColor, color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>{statusBadgeLabel}</span>
        </div>
        <div style={{ position: 'absolute', bottom: 10, right: 14 }}>
          <span style={{ background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 10, padding: '3px 8px', borderRadius: 8 }}>{timeAgo(dog.created_at)}</span>
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Name + AI badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#111' }}>{isLostPet ? (dog.pet_name || 'Unknown') : dog.dog_id}</div>
            <div style={{ color: GRAY, fontSize: 12, marginTop: 2 }}>ID: {dog.dog_id}</div>
          </div>
          {dog.confidence >= 70 && (
            <div style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}40`, borderRadius: 10, padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 16 }}>🤖</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: GREEN }}>AI Verified</div>
            </div>
          )}
        </div>

        {/* Attributes grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
          {attrs.map(([k, v]) => (
            <div key={k} style={{ background: LIGHT_GRAY, borderRadius: 8, padding: '7px 9px' }}>
              <div style={{ fontSize: 10, color: GRAY }}>{k}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#111', marginTop: 1 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Injured banner */}
        {dog.injured && (
          <div style={{ background: '#fff0f0', border: `1.5px solid ${RED}30`, borderRadius: 10, padding: '10px 12px', marginBottom: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: RED }}>Injuries observed</div>
              {dog.injury_notes && <div style={{ fontSize: 12, color: RED, marginTop: 2 }}>{dog.injury_notes}</div>}
            </div>
          </div>
        )}

        {/* Vaccination notes */}
        {dog.vaccinated && dog.vaccination_notes && (
          <div style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}30`, borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>💉 {dog.vaccination_notes}</div>
          </div>
        )}

        {/* Last seen */}
        <div style={{ background: `${ORANGE}10`, border: `1px solid ${ORANGE}30`, borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: ORANGE, marginBottom: 4 }}>📍 {isLostPet ? 'Last Known Location' : 'Last Seen'}</div>
          <div style={{ fontSize: 12, color: '#111' }}>{dog.area || 'Unknown'}, {dog.city || 'Unknown'}</div>
          {dog.lat && <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>{dog.lat.toFixed(4)}°N, {dog.lng.toFixed(4)}°E</div>}
          {isLostPet && dog.date_lost && <div style={{ fontSize: 11, color: GRAY, marginTop: 3 }}>Last seen: {dog.date_lost}</div>}
        </div>

        {/* Map */}
        {dog.lat && (
          <div id="dog-map" style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 12, background: LIGHT_GRAY, overflow: 'hidden' }} />
        )}

        {/* Notes */}
        {dog.notes && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', marginBottom: 10, border: `1px solid ${LIGHT_GRAY}` }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 4, fontWeight: 600 }}>NOTES</div>
            <div style={{ fontSize: 13, color: '#333', lineHeight: 1.4 }}>{dog.notes}</div>
          </div>
        )}

        {/* Reported by */}
        <div style={{ fontSize: 11, color: GRAY, marginBottom: 12, textAlign: 'center' }}>
          Reported by {dog.reporter_name || 'Anonymous'} · {timeAgo(dog.created_at)}
        </div>

        {/* Status update (logged-in, strays only) */}
        {!isLostPet && user && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px', marginBottom: 10, border: `1px solid ${LIGHT_GRAY}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Status</div>
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={statusSaving}
              style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${LIGHT_GRAY}`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: STATUS_COLORS[status] || '#1a1a18', fontWeight: 600, cursor: 'pointer', appearance: 'none' }}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {statusSaving && <div style={{ fontSize: 12, color: GRAY, marginTop: 6 }}>Saving...</div>}
            {statusSaved && <div style={{ fontSize: 12, color: GREEN, marginTop: 6, fontWeight: 600 }}>✓ Status updated</div>}
          </div>
        )}

        {/* Status read-only */}
        {!isLostPet && !user && status !== 'sighted' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px', marginBottom: 10, border: `1px solid ${LIGHT_GRAY}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: STATUS_COLORS[status] || GRAY }}>
              {STATUS_OPTIONS.find(o => o.value === status)?.label || status}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {isLostPet && dog.owner_phone ? (
            <a href={`tel:${dog.owner_phone}`} style={{ flex: 1, background: ORANGE, borderRadius: 12, padding: '10px', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 12, textDecoration: 'none', display: 'block' }}>📞 Contact Owner</a>
          ) : (
            <div style={{ flex: 1, background: ORANGE, borderRadius: 12, padding: '10px', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>📞 Contact Reporter</div>
          )}
        </div>
        <div style={{ background: LIGHT_GRAY, borderRadius: 12, padding: '10px', textAlign: 'center', color: GRAY, fontWeight: 600, fontSize: 12, cursor: 'pointer', marginBottom: 12 }}>🔗 Share to WhatsApp</div>

        {/* Possible matches */}
        {matches.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px', marginBottom: 12, border: `1px solid ${LIGHT_GRAY}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isLostPet ? '🐕 Possible Stray Matches' : '🔍 Owner Looking?'}
            </div>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 10 }}>
              {isLostPet ? 'Strays with similar breed/colour' : 'Lost pet reports with similar breed/colour'}
            </div>
            {matches.map(m => (
              <div key={m.id} onClick={() => nav('dog', { dogId: m.id })}
                style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${LIGHT_GRAY}`, cursor: 'pointer', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: LIGHT_GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {m.report_type === 'lost_pet' ? '🔍' : '🐕'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.report_type === 'lost_pet' ? (m.pet_name || 'Unknown') : m.dog_id}</div>
                  <div style={{ fontSize: 12, color: GRAY }}>{m.breed} · {m.color} · {m.area}</div>
                </div>
                <div style={{ fontSize: 11, color: GRAY }}>{timeAgo(m.created_at)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Delete */}
        {user && (
          <div style={{ marginBottom: 24 }}>
            {confirm ? (
              <div style={{ background: '#fff0f0', borderRadius: 12, padding: 16, border: `1px solid ${RED}30` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: RED, marginBottom: 12 }}>Delete this record?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: 11, background: '#fff', border: `1.5px solid ${LIGHT_GRAY}`, borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, background: RED, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{deleting ? 'Deleting...' : 'Yes, delete'}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} style={{ width: '100%', padding: 11, background: '#fff', color: RED, border: `1.5px solid ${RED}40`, borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Delete record</button>
            )}
          </div>
        )}
      </div>

      {photoOpen && dog.photo_url && !heroImgFailed && (
        <div
          onClick={() => setPhotoOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={dog.photo_url} alt="dog" style={{ maxWidth: '96vw', maxHeight: '88vh', borderRadius: 12, objectFit: 'contain' }} />
          <div style={{ position: 'absolute', top: 16, right: 16, color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1 }}>✕</div>
        </div>
      )}
    </div>
  )
}
