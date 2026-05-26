import { useState, useEffect } from 'react'
import { getDogs } from '../lib/data.js'
import { useApp } from '../App.jsx'

const ORANGE = '#E07B39'
const DARK_ORANGE = '#C0510B'
const BG = '#FDF8F4'
const GRAY = '#6B7280'
const LIGHT_GRAY = '#F3F4F6'
const GREEN = '#16A34A'
const RED = '#DC2626'

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function PostCard({ dog, onClick }) {
  const isLost = dog.report_type === 'lost_pet'
  const statusColor = isLost ? RED : GREEN
  const statusLabel = isLost ? 'LOST' : 'FOUND'
  const name = isLost
    ? (dog.pet_name ? `LOST: ${dog.pet_name}` : 'LOST: Unknown')
    : `FOUND: ${dog.breed || 'Stray Dog'}`
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 14, marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `1px solid ${LIGHT_GRAY}`, overflow: 'hidden', cursor: 'pointer' }}>
      {/* Photo area */}
      <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: isLost ? 'linear-gradient(135deg, #fff3e0, #ffe0b2)' : 'linear-gradient(135deg, #f0e8df, #e8d5c0)' }}>
        {dog.photo_url && !imgFailed
          ? <img src={dog.photo_url} alt="dog" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFailed(true)} />
          : <span style={{ fontSize: 56 }}>{isLost ? '🔍' : '🐕'}</span>
        }
        <div style={{ position: 'absolute', top: 8, left: 8, background: statusColor, color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>{statusLabel}</div>
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 8 }}>📍 {(dog.area || 'Unknown').split(' ')[0]}</div>
      </div>

      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{name}</div>
        <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{dog.breed} · {dog.color} · {timeAgo(dog.created_at)}</div>
        {dog.notes && (
          <div style={{ fontSize: 11, color: '#333', margin: '6px 0', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {dog.notes}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <div style={{ fontSize: 10, color: GRAY }}>By {dog.reporter_name || 'Anonymous'}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {dog.injured && <span style={{ fontSize: 10, color: RED, fontWeight: 600 }}>⚠ Injured</span>}
            {dog.vaccinated && <span style={{ fontSize: 10, color: GREEN, fontWeight: 600 }}>💉 Vaccinated</span>}
            <div style={{ background: ORANGE, color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 8 }}>
              {isLost && dog.owner_phone ? '📞 Call' : '👁 View'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'all',        label: 'All' },
  { key: 'lost',       label: 'Lost' },
  { key: 'stray',      label: 'Stray' },
  { key: 'vaccinated', label: 'Vaccinated' },
]

export default function FeedPage() {
  const { nav } = useApp()
  const [filter, setFilter] = useState('all')
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const f = {}
    if (filter === 'lost') f.report_type = 'lost_pet'
    else if (filter === 'stray') f.report_type = 'stray'
    else if (filter === 'vaccinated') { f.report_type = 'stray'; f.vaccinated = true }
    const { data } = await getDogs(f)
    setDogs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const displayed = dogs.filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (d.breed || '').toLowerCase().includes(q) ||
      (d.area  || '').toLowerCase().includes(q) ||
      (d.dog_id || '').includes(q) ||
      (d.pet_name || '').toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${DARK_ORANGE}, ${ORANGE})`, padding: '14px 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🐾</span>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>Lost & Found Feed</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>All reports · PawTrace India</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div onClick={() => nav('search')} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>🤖 Search by Photo</div>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700 }}>{displayed.length}</span>
          </div>
        </div>
      </div>

      {/* Search + filter bar */}
      <div style={{ background: '#fff', padding: '10px 14px', borderBottom: `1px solid ${LIGHT_GRAY}`, flexShrink: 0 }}>
        <input
          placeholder="Search breed, area, name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', border: `1.5px solid ${LIGHT_GRAY}`, borderRadius: 10, fontSize: 13, outline: 'none', background: BG, marginBottom: 10, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {TABS.map(({ key, label }) => (
            <div key={key} onClick={() => setFilter(key)} style={{ padding: '5px 12px', borderRadius: 20, background: filter === key ? ORANGE : LIGHT_GRAY, color: filter === key ? 'white' : GRAY, fontSize: 11, fontWeight: filter === key ? 700 : 400, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer' }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '12px 14px', overflowY: 'auto', background: BG }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY }}>Loading...</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🐾</div>
            <div style={{ fontSize: 15 }}>No reports found</div>
          </div>
        ) : (
          displayed.map(dog => <PostCard key={dog.id} dog={dog} onClick={() => nav('dog', { dogId: dog.id })} />)
        )}
      </div>
    </div>
  )
}
