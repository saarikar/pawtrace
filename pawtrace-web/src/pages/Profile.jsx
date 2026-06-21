import { useState } from 'react'
import { updateProfile } from '../lib/data.js'
import { isDemoMode } from '../lib/supabase.js'
import { useApp } from '../App.jsx'

const C = {
  primary: '#E8453C', primarySoft: '#FFF0EF',
  secondary: '#0B3558',
  teal: '#22AA86',
  text: '#1A1A2E', textSecondary: '#6B7280', textMuted: '#9CA3AF',
  bg: '#F7F7F7', bgCard: '#FFFFFF', bgSection: '#FAFAFA', bgInput: '#F5F5F5',
  border: '#E5E7EB', borderLight: '#F3F4F6',
  danger: '#E8453C', success: '#22AA86',
}

const CITIES = ['Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad']

const inp = { width: '100%', padding: '11px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', color: C.text, boxSizing: 'border-box', marginBottom: 14 }

export default function ProfilePage({ onSignOut }) {
  const { user, profile, setProfile, nav } = useApp()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: profile?.name || '', city: profile?.city || 'Chennai' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  if (!user) return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <div style={{ width: 80, height: 80, borderRadius: 40, background: C.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👤</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Sign in to continue</div>
      <div style={{ fontSize: 14, color: C.textMuted, textAlign: 'center' }}>Track reports & manage your profile</div>
      <button onClick={() => nav('auth')} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 40px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>Sign In</button>
    </div>
  )

  const handleSave = async () => {
    setSaving(true); setError('')
    const { error: err } = await updateProfile(user.id, { name: form.name, city: form.city })
    setSaving(false)
    if (err) { setError(err.message); return }
    setProfile(p => ({ ...p, ...form }))
    setEditing(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const displayName = profile?.name || user?.email || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ background: C.bg, minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 20px 24px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>PROFILE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 20, background: C.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.primary}40`, flexShrink: 0 }}>
            <span style={{ color: C.primary, fontSize: 24, fontWeight: 800 }}>{initials}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.text, fontWeight: 800, fontSize: 20 }}>{displayName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <span style={{ fontSize: 12 }}>📍</span>
              <span style={{ color: C.textSecondary, fontSize: 13 }}>{profile?.city || 'India'}</span>
            </div>
            <span style={{ background: C.primarySoft, color: C.primary, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginTop: 4 }}>PawTrace Member</span>
          </div>
        </div>
        <div style={{ background: C.bgSection, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${C.border}` }}>
          <span style={{ color: C.textMuted, fontSize: 11, letterSpacing: 0.5 }}>MEMBER ID</span>
          <span style={{ color: C.primary, fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>PT-USER-{user?.id?.slice(0, 6)?.toUpperCase() || 'DEMO'}</span>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Profile Details */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Profile Details</div>
            <div onClick={() => { setEditing(e => !e); setForm({ name: profile?.name || '', city: profile?.city || 'Chennai' }) }}
              style={{ fontSize: 13, color: C.primary, fontWeight: 700, cursor: 'pointer' }}>{editing ? 'Cancel' : 'Edit'}</div>
          </div>

          {editing ? (
            <>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.secondary, marginBottom: 5, display: 'block', letterSpacing: 0.3 }}>Name</label>
              <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
              <label style={{ fontSize: 11, fontWeight: 700, color: C.secondary, marginBottom: 8, display: 'block', letterSpacing: 0.3 }}>City</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {CITIES.map(city => (
                  <button key={city} onClick={() => setForm(f => ({ ...f, city }))}
                    style={{ padding: '6px 14px', borderRadius: 999, border: `1.5px solid ${form.city === city ? C.primary : C.border}`, background: form.city === city ? C.primarySoft : '#fff', color: form.city === city ? C.primary : C.textSecondary, fontSize: 13, fontWeight: form.city === city ? 700 : 400, cursor: 'pointer' }}>
                    {city}
                  </button>
                ))}
              </div>
              {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 12 }}>{error}</div>}
              <button onClick={handleSave} disabled={saving}
                style={{ width: '100%', padding: 13, background: saving ? '#aaa' : C.primary, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            [['Name', profile?.name || '—'], ['City', profile?.city || '—'], ['Email', user?.email || '—']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.textMuted, fontSize: 15 }}>{k}</span>
                <span style={{ fontWeight: 600, color: C.text, fontSize: 15 }}>{v}</span>
              </div>
            ))
          )}

          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'center' }}>
              <span style={{ fontSize: 14 }}>✅</span>
              <span style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>Updated</span>
            </div>
          )}
        </div>

        {/* About */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 16 }}>ABOUT PAWTRACE</div>
          {[
            { k: 'Project', v: 'PawTrace India' },
            { k: 'Database', v: isDemoMode ? 'Demo mode' : 'Supabase' },
            { k: 'Breeds', v: '13 Indian types' },
            { k: 'AI Model', v: 'YOLOv8 + Gemini AI + MobileNetV2' },
          ].map(item => (
            <div key={item.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.textMuted, fontSize: 13 }}>{item.k}</span>
              <span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{item.v}</span>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <button onClick={onSignOut}
          style={{ width: '100%', padding: 14, background: '#fff', color: C.danger, border: `1.5px solid ${C.danger}40`, borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Sign Out
        </button>

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
