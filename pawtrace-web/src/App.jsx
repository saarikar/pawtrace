import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { getSession, getProfile, signOut } from './lib/data.js'
import { isDemoMode } from './lib/supabase.js'
import { PRIMARY, SECONDARY, TEXT, BORDER_LIGHT, FONT_WEIGHT } from './lib/constants.js'
import AuthPage from './pages/Auth.jsx'
import HomePage from './pages/Home.jsx'
import FeedPage from './pages/Feed.jsx'
import ReportPage from './pages/Report.jsx'
import DogPage from './pages/Dog.jsx'
import ProfilePage from './pages/Profile.jsx'
import StatsPage from './pages/Stats.jsx'
import SearchPage from './pages/Search.jsx'

// ── Global auth context ──────────────────────────────────────────────────
const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

// ── SVG tab icons (Ionicons-style, stroke-based) ─────────────────────────
function NavIcon({ type, active, color = '#9CA3AF', size = 22 }) {
  const s = { fill: 'none', stroke: color, strokeWidth: active ? 2.5 : 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'home') return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10.5z"/>
      <path d="M9 21V13.5h6V21"/>
    </svg>
  )
  if (type === 'search') return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
      <circle cx="10.5" cy="10.5" r="7"/>
      <path d="M16.5 16.5L21 21"/>
    </svg>
  )
  if (type === 'camera') return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
  if (type === 'chart') return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
      <rect x="3" y="12" width="4" height="9" rx="1"/>
      <rect x="10" y="7" width="4" height="14" rx="1"/>
      <rect x="17" y="3" width="4" height="18" rx="1"/>
    </svg>
  )
  if (type === 'person') return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="7" r="4"/>
      <path d="M3 21v-1a9 9 0 0 1 18 0v1"/>
    </svg>
  )
  return null
}

// ── Bottom nav ───────────────────────────────────────────────────────────
const NAV = [
  { path: '/',        label: 'Home',   icon: 'home'   },
  { path: '/feed',    label: 'Feed',   icon: 'search' },
  { path: '/report',  label: 'Report', icon: 'camera' },
  { path: '/stats',   label: 'Stats',  icon: 'chart'  },
  { path: '/profile', label: 'Me',     icon: 'person' },
]

function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      display: 'flex',
      background: '#fff',
      position: 'sticky',
      bottom: 0,
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -1px 0 #F3F4F6, 0 -4px 16px rgba(11,53,88,0.08)',
    }}>
      {NAV.map(t => {
        const active = t.path === '/' ? pathname === '/' : pathname.startsWith(t.path)
        const color = active ? PRIMARY : '#9CA3AF'
        return (
          <button key={t.path} onClick={() => navigate(t.path)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 0 10px', gap: 3, border: 'none', background: 'none',
            cursor: 'pointer', position: 'relative',
          }}>
            {active && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 28, height: 3, borderRadius: '0 0 4px 4px', background: PRIMARY,
              }} />
            )}
            <div style={{
              width: 44, height: 30, borderRadius: 15,
              background: active ? `${PRIMARY}15` : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <NavIcon type={t.icon} active={active} color={color} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: active ? 700 : 500,
              color, letterSpacing: 0.2,
            }}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Layout with bottom nav ──────────────────────────────────────────────
function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ flex: 1 }}>{children}</div>
      <BottomNav />
    </div>
  )
}

// ── Layout without bottom nav (dog detail, auth) ────────────────────────
function BarelessLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

export default function App() {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getSession().then(async u => {
      if (u) { setUser(u); setProfile(await getProfile(u.id)) }
      else if (isDemoMode) { setUser({ id: 'demo', email: 'demo@test.com' }); setProfile({ id: 'demo', name: 'Demo User', city: 'Chennai', email: 'demo@test.com' }) }
      setLoading(false)
    })
  }, [])

  const nav = (to, params = {}) => {
    if (to === 'dog' && params.dogId) navigate('/dog/' + params.dogId)
    else if (to === 'home') navigate('/')
    else navigate('/' + to)
    window.scrollTo(0, 0)
  }

  const handleSignOut = async () => {
    await signOut()
    setUser(null); setProfile(null); navigate('/')
  }

  const refreshProfile = async () => {
    if (user) setProfile(await getProfile(user.id))
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🐕</div>
      <div style={{ fontSize: 14, color: '#888' }}>Loading...</div>
    </div>
  )

  const ctx = { user, profile, setUser, setProfile, refreshProfile, nav }

  return (
    <Ctx.Provider value={ctx}>
      <Routes>
        <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
        <Route path="/feed" element={<AppLayout><FeedPage /></AppLayout>} />
        <Route path="/report" element={<AppLayout><ReportPage /></AppLayout>} />
        <Route path="/stats" element={<AppLayout><StatsPage /></AppLayout>} />
        <Route path="/search" element={<AppLayout><SearchPage /></AppLayout>} />
        <Route path="/profile" element={
          user
            ? <AppLayout><ProfilePage onSignOut={handleSignOut} /></AppLayout>
            : <BarelessLayout><AuthPage onAuth={(u, p) => { setUser(u); setProfile(p); navigate('/profile') }} /></BarelessLayout>
        } />
        <Route path="/dog/:dogId" element={<BarelessLayout><DogPage /></BarelessLayout>} />
        <Route path="/auth" element={
          <BarelessLayout><AuthPage onAuth={(u, p) => { setUser(u); setProfile(p); navigate('/') }} /></BarelessLayout>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Ctx.Provider>
  )
}
