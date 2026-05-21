import { useState, useEffect } from 'react'
import { getDogs } from '../lib/data.js'
import { useApp } from '../App.jsx'
import { COLORS, SIZES } from '../lib/vision.js'

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function DogCard({ dog, onClick }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', border: dog.injured ? '1.5px solid #ffb0b0' : '1px solid #eee', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {dog.photo_url
          ? <img src={dog.photo_url} alt="dog" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 64, height: 64, borderRadius: 10, background: '#f0f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🐕</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a18' }}>{dog.dog_id}</span>
            <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{timeAgo(dog.created_at)}</span>
          </div>
          <div style={{ fontSize: 13, color: '#444', marginTop: 2 }}>{dog.breed}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{dog.color} · {dog.size} · {dog.sex} · {dog.age}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, background: '#eef6f1', color: '#2d7a4f', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{dog.area}</span>
            {dog.injured && <span style={{ fontSize: 11, background: '#fff0f0', color: '#c00', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>⚠ Injured</span>}
            <span style={{ fontSize: 11, background: '#f5f5f0', color: '#888', padding: '2px 8px', borderRadius: 20 }}>
              {dog.analysis_source === 'api' ? `AI ${dog.confidence}%` : '🎲 Mock'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const { nav } = useApp()
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ color: '', size: '', injured: false })
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const f = {}
    if (filters.color) f.color = filters.color
    if (filters.size)  f.size  = filters.size
    if (filters.injured) f.injured = true
    const { data } = await getDogs(f)
    setDogs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filters])

  const displayed = dogs.filter(d =>
    !search || d.breed.toLowerCase().includes(search.toLowerCase()) ||
    d.area.toLowerCase().includes(search.toLowerCase()) || d.dog_id.includes(search)
  )

  const clearFilters = () => setFilters({ color: '', size: '', injured: false })
  const hasFilters = filters.color || filters.size || filters.injured

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '16px 16px 12px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a18', margin: 0 }}>🐕 Stray Dogs</h1>
          <span style={{ fontSize: 13, color: '#2d7a4f', fontWeight: 600 }}>{displayed.length} dogs</span>
        </div>
        <input
          placeholder="Search breed, area, ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0d8', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 10, background: '#fafaf8' }}
        />
        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          <select value={filters.color} onChange={e => setFilters(f => ({ ...f, color: e.target.value }))}
            style={{ padding: '6px 10px', borderRadius: 20, border: '1px solid #ddd', fontSize: 12, background: filters.color ? '#eef6f1' : '#fff', color: filters.color ? '#2d7a4f' : '#666', cursor: 'pointer', flexShrink: 0 }}>
            <option value="">All colours</option>
            {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.size} onChange={e => setFilters(f => ({ ...f, size: e.target.value }))}
            style={{ padding: '6px 10px', borderRadius: 20, border: '1px solid #ddd', fontSize: 12, background: filters.size ? '#eef6f1' : '#fff', color: filters.size ? '#2d7a4f' : '#666', cursor: 'pointer', flexShrink: 0 }}>
            <option value="">All sizes</option>
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setFilters(f => ({ ...f, injured: !f.injured }))}
            style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid #ddd', fontSize: 12, background: filters.injured ? '#fff0f0' : '#fff', color: filters.injured ? '#c00' : '#666', cursor: 'pointer', fontWeight: filters.injured ? 700 : 400, flexShrink: 0 }}>
            ⚠ Injured only
          </button>
          {hasFilters && <button onClick={clearFilters} style={{ padding: '6px 10px', borderRadius: 20, border: '1px solid #ddd', fontSize: 12, background: '#f5f5f0', color: '#888', cursor: 'pointer', flexShrink: 0 }}>✕ Clear</button>}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '12px 14px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>Loading...</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15 }}>No dogs found</div>
            {hasFilters && <button onClick={clearFilters} style={{ marginTop: 12, padding: '8px 16px', background: '#2d7a4f', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Clear filters</button>}
          </div>
        ) : (
          displayed.map(dog => <DogCard key={dog.id} dog={dog} onClick={() => nav('dog', { dogId: dog.id })} />)
        )}
      </div>
    </div>
  )
}
