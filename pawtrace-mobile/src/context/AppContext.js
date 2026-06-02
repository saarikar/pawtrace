import React, { createContext, useContext, useState, useEffect } from 'react'
import { getProfile, signOut as doSignOut } from '../lib/data'
import { supabase, isDemoMode } from '../lib/supabase'

const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      setUser({ id: 'demo', email: 'demo@test.com' })
      setProfile({ id: 'demo', name: 'Demo User', city: 'Chennai', email: 'demo@test.com' })
      setLoading(false)
      return
    }

    // Restore persisted session on launch
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setProfile(await getProfile(session.user.id))
      }
      setLoading(false)
    })

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          setProfile(await getProfile(session.user.id))
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await doSignOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) setProfile(await getProfile(user.id))
  }

  const ctx = { user, profile, setUser, setProfile, refreshProfile, signOut: handleSignOut, loading }

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>
}
