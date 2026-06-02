import { useState, useEffect, useCallback } from 'react'
import { getDogs } from '../lib/data.js'
import { useApp } from '../App.jsx'
import { timeAgo } from '../lib/utils.js'

const C = {
  primary: '#E8453C', primarySoft: '#FFF0EF',
  secondary: '#0B3558',
  teal: '#22AA86', tealSoft: '#EEFAF6',
  text: '#1A1A2E', textSecondary: '#6B7280', textMuted: '#9CA3AF',
  bg: '#F7F7F7', bgCard: '#FFFFFF', bgInput: '#F5F5F5',
  border: '#E5E7EB', borderLight: '#F3F4F6',
  danger: '#E8453C',
}

const TABS = [
  { key: 'all',        label: 'All',   icon: '🐾' },
  { key: 'lost',       label: 'Lost',  icon: '🔍' },
  { key: 'stray',      label: 'Stray', icon: '🐕' },
  { key: 'vaccinated', label: 'Vacc.', icon: '💉' },
]

function DogCard({ dog, onClick }) {
  const isLost = dog.report_type === 'lost_pet'
  const name = isLost ? (dog.pet_name || 'Unknown Pet') : (dog.breed || 'Stray Dog')
  const [imgFailed, setImgFailed] = useState(false)
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: C.bgCard, borderRadius: 20, marginBottom: 16, overflow: 'hidden', border: `1px solid ${C.borderLight}`, boxShadow: hov ? '0 4px 16px rgba(11,53,88,0.10)' : '0 2px 12px rgba(11,53,88,0.07)', cursor: 'pointer', transform: hov ? 'translateY(-2px)' : 'none', transition: 'all 0.15s' }}>
      <div style={{ height: 170, position: 'relative', background: '#F0EBE6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {dog.photo_url && !imgFailed
          ? <img src={dog.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFailed(true)} />
          : <span style={{ fontSize: 44 }}>{isLost ? '🔍' : '🐕'}</span>}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ background: isLost ? C.danger : C.teal, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8 }}>{isLost ? 'LOST' : 'FOUND'}</span>
          {dog.area && <span style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 8 }}>{dog.area.split(' ')[0]}</span>}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text }}>{name}</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>{timeAgo(dog.created_at)}</div>
        </div>
        <div style={{ fontSize: 13, color: C.textSecondary }}>{dog.breed} · {dog.color} · {dog.size}</div>
        {dog.notes && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6, lineHeight: 1.4 }}>{dog.notes.slice(0, 80)}{dog.notes.length > 80 ? '…' : ''}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <div style={{ fontSize: 11, color: C.textMuted }}>By {dog.reporter_name || 'Anonymous'}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {dog.injured && <span style={{ fontSize: 10, color: C.danger, fontWeight: 600, background: C.primarySoft, padding: '2px 6px', borderRadius: 6 }}>Injured</span>}
            {dog.vaccinated && <span style={{ fontSize: 10, color: C.teal, fontWeight: 600, background: C.tealSoft, padding: '2px 6px', borderRadius: 6 }}>Vacc.</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const { nav } = useApp()
  const [filter, setFilter] = useState('all')
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const f = {}
    if (filter === 'lost') f.report_type = 'lost_pet'
    else if (filter === 'stray') f.report_type = 'stray'
    else if (filter === 'vaccinated') { f.report_type = 'stray'; f.vaccinated = true }
    const { data } = await getDogs(f)
    setDogs(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const displayed = dogs.filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (d.breed || '').toLowerCase().includes(q) ||
      (d.area || '').toLowerCase().includes(q) ||
      (d.dog_id || '').includes(q) ||
      (d.pet_name || '').toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ background: C.bg, minHeight: '100dvh' }}>
      <div style={{ background: '#fff', padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: C.text, fontWeight: 800, fontSize: 24 }}>Lost & Found</div>
            <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{displayed.length} reports</div>
          </div>
          <div onClick={() => nav('search')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.primarySoft, padding: '7px 12px', borderRadius: 999, cursor: 'pointer' }}>
            <span style={{ fontSize: 13 }}>🤖</span>
            <span style={{ color: C.primary, fontSize: 13, fontWeight: 700 }}>AI Search</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bgInput, borderRadius: 10, paddingLeft: 12, border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 14, color: C.textMuted }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search breed, area, name..."
            style={{ flex: 1, padding: '11px 8px 11px 0', fontSize: 15, border: 'none', background: 'transparent', outline: 'none', color: C.text }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto' }}>
        {TABS.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 999, border: `1px solid ${filter === key ? C.primary : C.border}`, background: filter === key ? C.primary : '#fff', cursor: 'pointer', fontSize: 12, color: filter === key ? '#fff' : C.textMuted, fontWeight: filter === key ? 700 : 500, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      <div style={{ padding: '4px 20px 20px' }}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 20, marginBottom: 16, height: 240, border: `1px solid ${C.borderLight}`, opacity: 0.4 + i * 0.2 }} />
          ))
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>No reports found</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 24 }}>{search ? 'Try a different search' : 'Be the first to report!'}</div>
            <button onClick={() => nav('report')} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Report a Dog</button>
          </div>
        ) : (
          displayed.map(d => <DogCard key={d.id} dog={d} onClick={() => nav('dog', { dogId: d.id })} />)
        )}
      </div>
    </div>
  )
}
