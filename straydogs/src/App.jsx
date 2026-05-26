import { useState, useEffect, createContext, useContext } from 'react'
import { getSession, getProfile, signOut } from './lib/data.js'
import { isDemoMode } from './lib/supabase.js'
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

// ── Bottom nav ───────────────────────────────────────────────────────────
const NAV = [
  { id: 'home',    label: 'Home',   icon: '🏠' },
  { id: 'feed',    label: 'Search', icon: '🔍' },
  { id: 'report',  label: 'Report', icon: '📷' },
  { id: 'stats',   label: 'Stats',  icon: '📊' },
  { id: 'profile', label: 'Me',     icon: '👤' },
]

function BottomNav({ page, nav }) {
  return (
    <nav style={{ display: 'flex', borderTop: '2px solid #F3F4F6', background: '#fff', position: 'sticky', bottom: 0, zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV.map(t => (
        <button key={t.id} onClick={() => nav(t.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '10px 0 12px', gap: 3, fontSize: 10, fontWeight: 600,
          border: 'none', background: 'none', cursor: 'pointer',
          color: page === t.id ? '#E07B39' : '#999',
          transition: 'color 0.15s'
        }}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          {t.label}
          {page === t.id && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#E07B39' }} />}
        </button>
      ))}
    </nav>
  )
}

export default function App() {
  const [user, setUser]     = useState(null)
  const [profile, setProfile] = useState(null)
  const [page, setPage]     = useState('home')
  const [pageParams, setParams] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession().then(async u => {
      if (u) { setUser(u); setProfile(await getProfile(u.id)) }
      else if (isDemoMode) { setUser({ id: 'demo', email: 'demo@test.com' }); setProfile({ id: 'demo', name: 'Demo User', city: 'Chennai', email: 'demo@test.com' }) }
      setLoading(false)
    })
  }, [])

  const nav = (to, params = {}) => { setPage(to); setParams(params); window.scrollTo(0, 0) }

  const handleSignOut = async () => {
    await signOut()
    setUser(null); setProfile(null); setPage('home')
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

  // Auth wall — only profile page requires login
  if (!user && page === 'profile') return <Ctx.Provider value={ctx}><AuthPage onAuth={(u, p) => { setUser(u); setProfile(p) }} /></Ctx.Provider>

  const noNav = page === 'auth' || page === 'dog'

  const PageComponent = {
    home:    <HomePage />,
    feed:    <FeedPage />,
    report:  <ReportPage />,
    stats:   <StatsPage />,
    profile: user ? <ProfilePage onSignOut={handleSignOut} /> : <AuthPage onAuth={(u, p) => { setUser(u); setProfile(p) }} />,
    dog:     <DogPage dogId={pageParams.dogId} />,
    search:  <SearchPage />,
  }[page] || <HomePage />

  return (
    <Ctx.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <div style={{ flex: 1 }}>{PageComponent}</div>
        {!noNav && <BottomNav page={page} nav={nav} />}
      </div>
    </Ctx.Provider>
  )
}
