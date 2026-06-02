import { useState, useEffect } from 'react'
import { getDogs, getModelStats } from '../lib/data.js'

const C = {
  primary: '#E8453C', secondary: '#0B3558',
  accent: '#F5A623', teal: '#22AA86',
  success: '#22AA86', warning: '#F5A623', danger: '#E8453C',
  text: '#1A1A2E', textSecondary: '#6B7280', textMuted: '#9CA3AF',
  bg: '#F7F7F7', bgCard: '#FFFFFF', bgInput: '#F5F5F5',
  border: '#E5E7EB', borderLight: '#F3F4F6',
}

const BAR_COLORS = [C.primary, C.accent, C.secondary, C.teal]

export default function StatsPage() {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getDogs().then(({ data }) => {
      const d = data || []
      setDogs(d)
      setStats(getModelStats(d))
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: `4px solid ${C.borderLight}`, borderTop: `4px solid ${C.primary}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: C.textMuted, fontSize: 14 }}>Loading dashboard...</div>
    </div>
  )

  const vaccRate = stats.total > 0 ? Math.round((dogs.filter(d => d.vaccinated).length / stats.total) * 100) : 0
  const breedsSorted = Object.entries(stats.breedDist).sort((a, b) => b[1] - a[1])

  const kpis = [
    { label: 'Dogs', value: stats.total, icon: '🐕', color: C.primary },
    { label: 'Vacc. Rate', value: vaccRate + '%', icon: '💉', color: C.success },
    { label: 'AI Conf.', value: stats.avgConfidence + '%', icon: '🤖', color: C.secondary },
    { label: 'Reports', value: stats.total, icon: '📋', color: C.accent },
  ]

  return (
    <div style={{ background: C.bg, minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 20px 16px', borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ fontWeight: 800, fontSize: 24, color: C.text }}>Dashboard</div>
        <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>AI Model Performance</div>
      </div>

      <div style={{ padding: 20 }}>
        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: C.bgCard, borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: k.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>{k.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Confidence Distribution */}
        <div style={{ background: C.bgCard, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Confidence Distribution</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'High ≥80%', n: stats.confDist.high, color: C.success },
              { label: 'Mid 60–79%', n: stats.confDist.mid, color: C.warning },
              { label: 'Low <60%', n: stats.confDist.low, color: C.danger },
            ].map(b => (
              <div key={b.label} style={{ flex: 1, background: b.color + '15', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: b.color }}>{b.n}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: b.color, marginTop: 4 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Breed Distribution */}
        {breedsSorted.length > 0 && (
          <div style={{ background: C.bgCard, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 16 }}>🐾</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Breed Distribution</div>
            </div>
            {breedsSorted.map(([breed, count], i) => {
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0
              const color = BAR_COLORS[i % 4]
              return (
                <div key={breed} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: C.textSecondary, fontSize: 13 }}>{breed}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: C.bgInput, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Health Summary */}
        <div style={{ background: C.bgCard, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>🏥</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Health Summary</div>
          </div>
          {[
            { icon: '⚠️', label: 'Injured', n: stats.injuredCount, color: stats.injuredCount > 0 ? C.danger : C.success },
            { icon: '✅', label: 'Healthy', n: stats.total - stats.injuredCount, color: C.success },
            { icon: '💉', label: 'Vaccinated', n: dogs.filter(d => d.vaccinated).length, color: C.success },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ color: C.textSecondary, fontSize: 15 }}>{item.label}</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: item.color }}>{item.n} / {stats.total}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}
