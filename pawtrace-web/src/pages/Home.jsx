import { useState, useEffect } from 'react'
import { getDogs } from '../lib/data.js'
import { useApp } from '../App.jsx'
import { timeAgo } from '../lib/utils.js'

const C = {
  primary: '#E8453C', primaryDark: '#C93830', primarySoft: '#FFF0EF',
  secondary: '#0B3558', secondaryLight: '#1A4F7A',
  accent: '#F5A623', accentSoft: '#FFF8EC',
  teal: '#22AA86', tealSoft: '#EEFAF6',
  text: '#1A1A2E', textSecondary: '#6B7280', textMuted: '#9CA3AF',
  bg: '#F7F7F7', bgCard: '#FFFFFF', border: '#E5E7EB', borderLight: '#F3F4F6',
  success: '#22AA86', danger: '#E8453C',
}

function StatCard({ icon, value, label, color }) {
  return (
    <div style={{ flex: 1, background: C.bgCard, borderRadius: 20, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: `1px solid ${C.borderLight}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  )
}

function ActionCard({ icon, label, sub, color, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 'calc(50% - 6px)', background: C.bgCard, borderRadius: 24, padding: 16, border: `1px solid ${C.borderLight}`, boxShadow: hov ? '0 4px 16px rgba(11,53,88,0.10)' : '0 2px 8px rgba(11,53,88,0.06)', cursor: 'pointer', transform: hov ? 'translateY(-2px)' : 'none', transition: 'all 0.15s' }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{label}</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function DogCard({ dog, onClick }) {
  const isLost = dog.report_type === 'lost_pet'
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <div onClick={onClick} style={{ background: C.bgCard, borderRadius: 16, padding: 12, marginBottom: 10, border: `1px solid ${C.borderLight}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)', cursor: 'pointer', display: 'flex', gap: 10 }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: C.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, overflow: 'hidden' }}>
        {dog.photo_url && !imgFailed
          ? <img src={dog.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFailed(true)} />
          : (isLost ? '🔍' : '🐕')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{isLost ? (dog.pet_name || 'Unknown') : dog.breed}</div>
          <span style={{ background: isLost ? C.danger : C.teal, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8 }}>{isLost ? 'LOST' : 'FOUND'}</span>
        </div>
        <div style={{ fontSize: 11, color: C.textSecondary }}>{dog.breed}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
          <span style={{ fontSize: 10, color: C.textMuted }}>📍 {dog.area}</span>
          <span style={{ fontSize: 10, color: C.textMuted }}>🕐 {timeAgo(dog.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { nav, profile } = useApp()
  const [recent, setRecent] = useState([])
  const [stats, setStats] = useState({ total: 0, lost: 0, rescued: 0 })

  useEffect(() => {
    getDogs({}).then(({ data }) => {
      const dogs = data || []
      setRecent(dogs.slice(0, 4))
      setStats({
        total: dogs.length,
        lost: dogs.filter(d => d.report_type === 'lost_pet').length,
        rescued: dogs.filter(d => d.status === 'in_shelter' || d.status === 'reunited').length,
      })
    })
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  return (
    <div style={{ background: C.bg, minHeight: '100dvh' }}>
      {/* Navy hero header */}
      <div style={{ background: C.secondary, padding: '20px 20px 28px', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{greeting()}</div>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginTop: 2 }}>{profile?.name || 'Dog Lover'}</div>
          </div>
          <div onClick={() => nav('profile')} style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)', fontSize: 20 }}>👤</div>
        </div>

        {/* Scan CTA */}
        <div onClick={() => nav('search')} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🐾</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Every paw has a story</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 }}>Search a dog to find its record</div>
          </div>
          <div style={{ background: C.primary, padding: '8px 14px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Search</span>
            <span style={{ color: '#fff', fontSize: 12 }}>→</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', marginTop: -10 }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <StatCard icon="🐕" value={stats.total} label="Tracked" color={C.primary} />
          <StatCard icon="🔍" value={stats.lost} label="Lost" color={C.accent} />
          <StatCard icon="🏠" value={stats.rescued} label="Rescued" color={C.teal} />
        </div>

        {/* Quick Actions */}
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <ActionCard icon="🔍" label="Search" sub="Find by photo" color={C.secondary} onClick={() => nav('search')} />
          <ActionCard icon="📷" label="Report" sub="Lost or stray" color={C.accent} onClick={() => nav('report')} />
          <ActionCard icon="📋" label="Feed" sub="All reports" color={C.primary} onClick={() => nav('feed')} />
          <ActionCard icon="📊" label="Stats" sub="Dashboard" color={C.teal} onClick={() => nav('stats')} />
        </div>

        {/* Alert card */}
        <div onClick={() => nav('feed')} style={{ background: C.primarySoft, borderRadius: 24, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${C.primary}20`, cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: `${C.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔔</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>
              {stats.lost > 0 ? `${stats.lost} lost pet${stats.lost > 1 ? 's' : ''} reported` : 'Dogs need your help'}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Tap to view latest reports</div>
          </div>
          <span style={{ color: C.primary, fontSize: 18 }}>›</span>
        </div>

        {/* Recent Reports */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Recent Reports</div>
          <div onClick={() => nav('feed')} style={{ fontSize: 13, color: C.primary, fontWeight: 600, cursor: 'pointer' }}>See all</div>
        </div>

        {recent.length > 0
          ? recent.map(d => <DogCard key={d.id} dog={d} onClick={() => nav('dog', { dogId: d.id })} />)
          : (
            <div style={{ background: C.bgCard, borderRadius: 20, padding: '32px 20px', textAlign: 'center', border: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🐾</div>
              <div style={{ color: C.textMuted, fontSize: 14 }}>No reports yet</div>
            </div>
          )
        }

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
