import { useState, useEffect } from 'react'
import { getDog, deleteDog } from '../lib/data.js'
import { useApp } from '../App.jsx'

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f5f5f0', fontSize: 14 }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ fontWeight: 600, color: highlight || '#1a1a18' }}>{value}</span>
    </div>
  )
}

export default function DogPage({ dogId }) {
  const { nav, user } = useApp()
  const [dog, setDog]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!dogId) { nav('feed'); return }
    getDog(dogId).then(({ data }) => { setDog(data); setLoading(false) })
  }, [dogId])

  // Load Leaflet map once dog data is available
  useEffect(() => {
    if (!dog?.lat || !dog?.lng || mapLoaded) return
    const L = window.L
    if (!L) return
    setTimeout(() => {
      const el = document.getElementById('dog-map')
      if (!el || el._leaflet_id) return
      const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([dog.lat, dog.lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      L.circleMarker([dog.lat, dog.lng], { radius: 10, color: '#2d7a4f', fillColor: '#2d7a4f', fillOpacity: 0.8 }).addTo(map)
      setMapLoaded(true)
    }, 100)
  }, [dog, mapLoaded])

  const handleDelete = async () => {
    setDeleting(true)
    await deleteDog(dogId)
    nav('feed')
  }

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#aaa' }}>Loading...</div>
  if (!dog) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 40 }}>🐕</div>
      <div style={{ fontSize: 15, color: '#888' }}>Dog not found</div>
      <button onClick={() => nav('feed')} style={{ padding: '8px 16px', background: '#2d7a4f', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>← Back</button>
    </div>
  )

  return (
    <div style={{ background: '#f4f4f0', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => nav('feed')} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{dog.dog_id}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#aaa' }}>{timeAgo(dog.created_at)}</span>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Photo / placeholder */}
        {dog.photo_url
          ? <img src={dog.photo_url} alt="dog" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12, marginBottom: 14 }} />
          : <div style={{ width: '100%', height: 160, background: '#e8f0e8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, marginBottom: 14 }}>🐕</div>
        }

        {/* Injured banner */}
        {dog.injured && (
          <div style={{ background: '#fff0f0', border: '1.5px solid #ffb0b0', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#c00' }}>Injuries observed</div>
              <div style={{ fontSize: 13, color: '#c00', marginTop: 3 }}>{dog.injury_notes || 'No details provided'}</div>
            </div>
          </div>
        )}

        {/* Main info */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identification</div>
          <Row label="Breed" value={dog.breed} />
          <Row label="Colour" value={dog.color} />
          <Row label="Size" value={dog.size} />
          <Row label="Sex" value={dog.sex} />
          <Row label="Age" value={dog.age} />
          {dog.notes && <Row label="Notes" value={dog.notes} />}
        </div>

        {/* AI confidence */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model confidence</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1, background: '#f5f5f0', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: dog.confidence >= 80 ? '#2d7a4f' : dog.confidence >= 60 ? '#e08000' : '#c00' }}>{dog.confidence}%</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Overall</div>
            </div>
            <div style={{ flex: 1, background: '#f5f5f0', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: dog.breed_confidence >= 80 ? '#2d7a4f' : dog.breed_confidence >= 60 ? '#e08000' : '#c00' }}>{dog.breed_confidence}%</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Breed</div>
            </div>
          </div>
          <div style={{ fontSize: 12, padding: '8px 10px', borderRadius: 6, background: dog.analysis_source === 'api' ? '#eef6f1' : '#fffbe6', color: dog.analysis_source === 'api' ? '#2d7a4f' : '#7a6000', fontWeight: 600 }}>
            {dog.analysis_source === 'api' ? '🤖 Analysed by Anthropic Vision API' : '🎲 Mock data — not a real analysis'}
          </div>
        </div>

        {/* Location */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</div>
          <Row label="Area" value={dog.area || 'Unknown'} />
          <Row label="City" value={dog.city || 'Unknown'} />
          {dog.lat && <Row label="Coordinates" value={`${dog.lat.toFixed(4)}°N, ${dog.lng.toFixed(4)}°E`} />}
          <Row label="Reported by" value={dog.reporter_name || 'Anonymous'} />
          {dog.lat && (
            <div id="dog-map" style={{ width: '100%', height: 180, borderRadius: 8, marginTop: 12, background: '#e8f0e8', overflow: 'hidden' }} />
          )}
        </div>

        {/* Delete */}
        {user && (
          <div style={{ marginBottom: 24 }}>
            {confirm ? (
              <div style={{ background: '#fff0f0', borderRadius: 12, padding: 16, border: '1px solid #ffb0b0' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#c00', marginBottom: 12 }}>Delete this record?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: 11, background: '#fff', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, background: '#c00', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{deleting ? 'Deleting...' : 'Yes, delete'}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} style={{ width: '100%', padding: 11, background: '#fff', color: '#c00', border: '1.5px solid #ffb0b0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Delete record</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
