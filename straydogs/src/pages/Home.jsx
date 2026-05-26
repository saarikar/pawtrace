import { useState, useEffect } from 'react'
import { getDogs } from '../lib/data.js'
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

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function DogCard({ dog, onClick }) {
  const isLost = dog.report_type === 'lost_pet'
  const statusColor = isLost ? RED : GREEN
  const statusLabel = isLost ? 'LOST' : 'FOUND'
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: `1px solid ${LIGHT_GRAY}`, marginBottom: 10, cursor: 'pointer' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {dog.photo_url && !imgFailed
          ? <img src={dog.photo_url} alt="dog" style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} onError={() => setImgFailed(true)} />
          : <div style={{ width: 60, height: 60, borderRadius: 12, background: `linear-gradient(135deg, ${LIGHT_GRAY}, #E5E7EB)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🐕</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{dog.pet_name || dog.dog_id}</div>
            <div style={{ background: statusColor, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>{statusLabel}</div>
          </div>
          <div style={{ color: GRAY, fontSize: 11, marginTop: 2 }}>{dog.breed}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 10, color: GRAY }}>📍 {dog.area}</span>
            <span style={{ fontSize: 10, color: GRAY }}>🕐 {timeAgo(dog.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { nav } = useApp()
  const [recent, setRecent] = useState([])

  useEffect(() => {
    getDogs({}).then(({ data }) => setRecent((data || []).slice(0, 3)))
  }, [])

  return (
    <div style={{ background: BG, minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${DARK_ORANGE}, ${ORANGE})`, padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🐾</span>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>PawTrace India</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>AI-Powered Dog Finder</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Alert banner */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY}, ${LIGHT_NAVY})`, borderRadius: 14, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 24 }}>🚨</span>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>Dogs need your help</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>Check the feed for latest reports</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 8 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { icon: '📷', label: 'Report a Dog', sub: 'Lost, found, or stray', color: ORANGE, page: 'report' },
            { icon: '🤖', label: 'Search by Photo', sub: 'AI visual matching', color: NAVY, page: 'search' },
            { icon: '📊', label: 'Statistics', sub: 'City-wide data', color: GREEN, page: 'stats' },
            { icon: '👤', label: 'My Profile', sub: 'Passport & settings', color: '#9333EA', page: 'profile' },
          ].map(({ icon, label, sub, color, page }) => (
            <div key={label} onClick={() => nav(page)} style={{ background: '#fff', borderRadius: 14, padding: '12px 10px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: `2px solid ${color}20`, cursor: 'pointer' }}>
              <span style={{ fontSize: 26 }}>{icon}</span>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#111', marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 10, color: GRAY }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Recent Reports */}
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 8 }}>Recent Reports</div>
        {recent.length > 0
          ? recent.map(d => <DogCard key={d.id} dog={d} onClick={() => nav('dog', { dogId: d.id })} />)
          : <div style={{ textAlign: 'center', padding: '20px 0', color: GRAY, fontSize: 13 }}>No recent reports</div>
        }
      </div>
    </div>
  )
}
