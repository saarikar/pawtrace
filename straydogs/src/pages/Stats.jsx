import { useState, useEffect } from 'react'
import { getDogs, getModelStats } from '../lib/data.js'

const ORANGE = '#E07B39'
const NAVY = '#1F4E79'
const LIGHT_NAVY = '#2E74B5'
const GREEN = '#16A34A'
const RED = '#DC2626'
const AMBER = '#D97706'

export default function StatsPage() {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getDogs().then(({ data }) => {
      setDogs(data || [])
      setStats(getModelStats(data || []))
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14, background: '#0F172A', minHeight: '100dvh' }}>
      Loading stats...
    </div>
  )

  const confColor = v => v >= 80 ? GREEN : v >= 60 ? AMBER : RED
  const breedsSorted = stats ? Object.entries(stats.breedDist).sort((a, b) => b[1] - a[1]) : []
  const vaccRate = stats?.total > 0 ? Math.round(((dogs.filter(d => d.vaccinated).length) / stats.total) * 100) : 0

  const kpis = [
    { label: 'Total Dogs Tracked', value: stats.total.toLocaleString(), icon: '🐕', color: ORANGE },
    { label: 'Vaccination Rate',   value: vaccRate + '%',                icon: '💉', color: GREEN },
    { label: 'Avg Confidence',     value: stats.avgConfidence + '%',     icon: '🤖', color: LIGHT_NAVY },
    { label: 'Active Reports',     value: stats.total.toString(),        icon: '🚨', color: RED },
  ]

  return (
    <div style={{ background: '#0F172A', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0F172A)', padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🏛️</span>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>BBMP Dashboard</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>PawTrace — AI Model Performance</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {kpis.map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div style={{ color, fontWeight: 800, fontSize: 20, marginTop: 4 }}>{value}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Confidence distribution */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, marginBottom: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 12, marginBottom: 10 }}>📊 Confidence Distribution</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
            {[
              { label: 'High ≥80%', count: stats.confDist.high, color: GREEN },
              { label: 'Mid 60–79%', count: stats.confDist.mid, color: AMBER },
              { label: 'Low <60%', count: stats.confDist.low, color: RED },
            ].map(b => (
              <div key={b.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: b.color }}>{b.count}</div>
                <div style={{ fontSize: 9, color: b.color, fontWeight: 600, marginTop: 2 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Breed distribution chart */}
        {breedsSorted.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, marginBottom: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 12, marginBottom: 10 }}>🐾 Breed Distribution</div>
            {breedsSorted.map(([breed, count], i) => {
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0
              const barColors = [ORANGE, AMBER, LIGHT_NAVY, GREEN]
              return (
                <div key={breed} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{breed}</span>
                    <span style={{ color: ORANGE, fontSize: 10, fontWeight: 700 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: `linear-gradient(90deg, ${barColors[i % 4]}, ${barColors[(i + 1) % 4]})`, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sightings table */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden', marginBottom: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', display: 'flex', gap: 4 }}>
            {['ID', 'Breed', 'Conf.', 'Breed'].map(h => (
              <div key={h} style={{ flex: 1, color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {dogs.length === 0
            ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>No sightings yet</div>
            : dogs.map((d, i) => (
              <div key={d.id} style={{ padding: '7px 12px', display: 'flex', gap: 4, background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1, color: ORANGE, fontSize: 10, fontWeight: 700 }}>{d.dog_id}</div>
                <div style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.breed}</div>
                <div style={{ flex: 1, color: confColor(d.confidence), fontSize: 10, fontWeight: 700 }}>{d.confidence}%</div>
                <div style={{ flex: 1, color: confColor(d.breed_confidence), fontSize: 10, fontWeight: 700 }}>{d.breed_confidence}%</div>
              </div>
            ))
          }
        </div>

        {/* Health summary */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, marginBottom: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 12, marginBottom: 10 }}>🏥 Health Summary</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Injured dogs</span>
            <span style={{ fontWeight: 700, color: stats.injuredCount > 0 ? RED : GREEN }}>{stats.injuredCount} / {stats.total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Healthy</span>
            <span style={{ fontWeight: 700, color: GREEN }}>{stats.total - stats.injuredCount} / {stats.total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Vaccinated</span>
            <span style={{ fontWeight: 700, color: GREEN }}>{dogs.filter(d => d.vaccinated).length} / {stats.total}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <div style={{ flex: 1, background: ORANGE, borderRadius: 10, padding: '10px', textAlign: 'center', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>📤 Export Report</div>
          <div style={{ flex: 1, background: LIGHT_NAVY, borderRadius: 10, padding: '10px', textAlign: 'center', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🗺️ View Heatmap</div>
        </div>
      </div>
    </div>
  )
}
