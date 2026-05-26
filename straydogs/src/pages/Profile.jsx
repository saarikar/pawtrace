import { useState } from 'react'
import { updateProfile } from '../lib/data.js'
import { isDemoMode } from '../lib/supabase.js'
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

const inp = { width: '100%', padding: '10px 12px', border: `1.5px solid ${LIGHT_GRAY}`, borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 14, background: '#fff', color: '#1a1a18' }
const lbl = { fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 5, display: 'block' }

export default function ProfilePage({ onSignOut }) {
  const { user, profile, setProfile } = useApp()

  const [editing, setEditing] = useState(false)
  const [form, setForm]   = useState({ name: profile?.name || '', city: profile?.city || 'Chennai' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]  = useState(false)
  const [error, setError]  = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true); setError('')
    const { error } = await updateProfile(user.id, { name: form.name, city: form.city })
    setSaving(false)
    if (error) { setError(error.message); return }
    setProfile(p => ({ ...p, ...form }))
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const displayName = profile?.name || user?.email || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ background: BG, minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${DARK_ORANGE}, ${ORANGE})`, padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🐾</span>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>Dog Passport</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>Digital ID · Scan or Share</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Passport card */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY}, #0d2b4a)`, borderRadius: 20, padding: 16, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 22 }}>🐾</div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 17 }}>{displayName}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{profile?.city || 'India'} · PawTrace Member</div>
              <div style={{ color: ORANGE, fontSize: 10, marginTop: 2 }}>PT-USER-{user?.id?.slice(0, 6)?.toUpperCase() || 'DEMO'}</div>
            </div>
          </div>

          {/* QR placeholder + details */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ background: 'white', borderRadius: 10, padding: 6, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
                {Array.from({ length: 25 }, (_, i) => (
                  <div key={i} style={{ width: 8, height: 8, background: [0, 1, 2, 5, 6, 7, 10, 14, 15, 16, 17, 18, 19, 20, 21, 24].includes(i) ? '#111' : 'white', borderRadius: 1 }} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, marginBottom: 3 }}>EMAIL</div>
              <div style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{user?.email || 'demo@test.com'}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, marginTop: 8, marginBottom: 3 }}>CITY</div>
              <div style={{ color: ORANGE, fontSize: 11, fontWeight: 600 }}>{profile?.city || '—'}</div>
              {isDemoMode && (
                <div style={{ marginTop: 6, fontSize: 10, background: `${AMBER}30`, color: AMBER, padding: '2px 8px', borderRadius: 10, fontWeight: 600, display: 'inline-block' }}>Demo mode</div>
              )}
            </div>
          </div>
        </div>

        {/* Profile edit */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px', marginBottom: 12, border: `1px solid ${LIGHT_GRAY}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing ? 14 : 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile Details</div>
            <button onClick={() => { setEditing(e => !e); setForm({ name: profile?.name || '', city: profile?.city || 'Chennai' }) }}
              style={{ background: 'none', border: 'none', fontSize: 13, color: ORANGE, fontWeight: 700, cursor: 'pointer' }}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <div style={{ marginTop: 14 }}>
              <label style={lbl}>Name</label>
              <input style={inp} value={form.name} onChange={set('name')} placeholder="Your name" />
              <label style={lbl}>City</label>
              <select style={{ ...inp, appearance: 'none' }} value={form.city} onChange={set('city')}>
                {['Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad'].map(c => <option key={c}>{c}</option>)}
              </select>
              {error && <div style={{ fontSize: 13, color: RED, marginBottom: 12 }}>{error}</div>}
              <button onClick={handleSave} disabled={saving}
                style={{ width: '100%', padding: 12, background: saving ? '#aaa' : ORANGE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              {[['Name', profile?.name || '—'], ['City', profile?.city || '—'], ['Email', user?.email || '—']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${LIGHT_GRAY}`, fontSize: 13 }}>
                  <span style={{ color: GRAY }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#1a1a18' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {saved && <div style={{ marginTop: 10, fontSize: 13, color: GREEN, fontWeight: 600, textAlign: 'center' }}>✓ Profile updated</div>}
        </div>

        {/* About */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px', marginBottom: 12, border: `1px solid ${LIGHT_GRAY}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>About PawTrace</div>
          {[
            ['Project', 'PawTrace India'],
            ['Database', isDemoMode ? 'In-memory (demo)' : 'Supabase PostgreSQL'],
            ['Breeds supported', '13 Indian dog types'],
            ['Maps', 'OpenStreetMap / Leaflet'],
            ['GPS', 'Browser Geolocation API'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${LIGHT_GRAY}`, fontSize: 13 }}>
              <span style={{ color: GRAY }}>{k}</span>
              <span style={{ fontWeight: 600, color: '#1a1a18', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: ORANGE, borderRadius: 12, padding: '10px', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>📤 Share Passport</div>
          <div style={{ flex: 1, background: NAVY, borderRadius: 12, padding: '10px', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>🏥 Add Vet Visit</div>
        </div>

        <button onClick={onSignOut}
          style={{ width: '100%', padding: 13, background: '#fff', color: RED, border: `1.5px solid ${RED}40`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
