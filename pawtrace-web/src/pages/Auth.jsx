import { useState } from 'react'
import { signIn, signUp, getProfile } from '../lib/data.js'
import { isDemoMode } from '../lib/supabase.js'

const s = {
  wrap: { flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 24px 32px', background: '#FDF8F4', minHeight: '100dvh' },
  logo: { textAlign: 'center', marginBottom: 40 },
  card: { background: '#fff', borderRadius: 14, padding: '24px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  label: { fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, display: 'block' },
  input: { width: '100%', padding: '11px 12px', border: '1.5px solid #F3F4F6', borderRadius: 8, fontSize: 15, outline: 'none', marginBottom: 14, background: '#fff', color: '#1a1a18' },
  btn: { width: '100%', padding: 13, background: '#E07B39', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  toggle: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6B7280' },
  link: { color: '#E07B39', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontSize: 14 },
  err: { background: '#fff0f0', border: '1px solid #ffc0c0', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#DC2626' },
  demo: { background: '#fffbe6', border: '1px solid #f0d060', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#7a6000' },
}

export default function AuthPage({ onAuth }) {
  const [mode, setMode]   = useState('signin')
  const [form, setForm]   = useState({ name: '', email: '', password: '', city: 'Chennai' })
  const [loading, setLoading] = useState(false)
  const [error, setError]  = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    let user, err
    if (mode === 'signup') {
      if (!form.name || !form.email || !form.password) { setError('Please fill all fields'); setLoading(false); return }
      ;({ user, error: err } = await signUp(form.email, form.password, form.name, form.city))
    } else {
      ;({ user, error: err } = await signIn(form.email, form.password))
    }
    setLoading(false)
    if (err) { setError(err.message || 'Something went wrong'); return }
    const profile = user ? await getProfile(user.id) : { name: form.name, email: form.email, city: form.city }
    onAuth(user, profile)
  }

  return (
    <div style={s.wrap}>
      <div style={s.logo}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🐾</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E07B39', margin: 0 }}>PawTrace India</h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>AI-Powered Dog Finder</p>
      </div>

      <div style={s.card}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: '#1a1a18' }}>
          {mode === 'signup' ? 'Create account' : 'Sign in'}
        </h2>

        {isDemoMode && (
          <div style={s.demo}>
            <b>Demo mode</b> — no Supabase configured. Add your keys in <code>.env.local</code> to persist data.
          </div>
        )}

        {error && <div style={s.err}>{error}</div>}

        {mode === 'signup' && (
          <>
            <label style={s.label}>Your name</label>
            <input style={s.input} placeholder="Arun Kumar" value={form.name} onChange={set('name')} />
            <label style={s.label}>City</label>
            <select style={{ ...s.input, appearance: 'none' }} value={form.city} onChange={set('city')}>
              {['Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad'].map(c => <option key={c}>{c}</option>)}
            </select>
          </>
        )}

        <label style={s.label}>Email</label>
        <input style={s.input} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />

        <label style={s.label}>Password</label>
        <input style={s.input} type="password" placeholder="••••••••" value={form.password} onChange={set('password')} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>

        {mode === 'signin' && (
          <button style={{ ...s.btn, background: '#F3F4F6', color: '#444', marginTop: 10 }} onClick={() => onAuth({ id: 'demo', email: 'demo@test.com' }, { id: 'demo', name: 'Demo User', city: 'Chennai', email: 'demo@test.com' })}>
            Continue as demo
          </button>
        )}
      </div>

      <div style={s.toggle}>
        {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
        <button style={s.link} onClick={() => { setMode(m => m === 'signup' ? 'signin' : 'signup'); setError('') }}>
          {mode === 'signup' ? 'Sign in' : 'Sign up'}
        </button>
      </div>
    </div>
  )
}
