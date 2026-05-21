import { supabase, isDemoMode } from './supabase.js'

// ── In-memory store for demo mode ──────────────────────────────────────
let DEMO_DOGS = [
  { id: 'd1', dog_id: 'SD-001', breed: 'Indian Pariah Dog', color: 'tan', size: 'medium', sex: 'male', age: 'adult (1.5–7 yr)', injured: false, injury_notes: null, confidence: 87, breed_confidence: 72, lat: 13.0415, lng: 80.2337, area: 'T. Nagar', city: 'Chennai', photo_url: null, reporter_name: 'Arun K.', notes: 'Friendly, often near the vegetable market', analysis_source: 'api', created_at: new Date(Date.now() - 2*3600000).toISOString() },
  { id: 'd2', dog_id: 'SD-002', breed: 'Labrador mix', color: 'black & white', size: 'large', sex: 'female', age: 'adult (1.5–7 yr)', injured: false, injury_notes: null, confidence: 91, breed_confidence: 68, lat: 13.0012, lng: 80.2565, area: 'Adyar', city: 'Chennai', photo_url: null, reporter_name: 'Meena S.', notes: null, analysis_source: 'api', created_at: new Date(Date.now() - 5*3600000).toISOString() },
  { id: 'd3', dog_id: 'SD-003', breed: 'Indian Spitz mix', color: 'white', size: 'small', sex: 'female', age: 'juvenile (6–18 mo)', injured: true, injury_notes: 'Limping on front left leg', confidence: 79, breed_confidence: 61, lat: 13.0569, lng: 80.2425, area: 'T. Nagar', city: 'Chennai', photo_url: null, reporter_name: 'Priya N.', notes: 'Needs attention', analysis_source: 'mock', created_at: new Date(Date.now() - 20*3600000).toISOString() },
  { id: 'd4', dog_id: 'SD-004', breed: 'Indian Pariah Dog', color: 'brown', size: 'medium', sex: 'male', age: 'senior (7+ yr)', injured: false, injury_notes: null, confidence: 83, breed_confidence: 80, lat: 12.9823, lng: 80.2209, area: 'Velachery', city: 'Chennai', photo_url: null, reporter_name: 'Ravi M.', notes: 'Grey muzzle, calm temperament', analysis_source: 'api', created_at: new Date(Date.now() - 30*3600000).toISOString() },
]
let DEMO_USER = { id: 'u1', name: 'Demo User', email: 'demo@test.com', city: 'Chennai' }
let nextId = 5

// ── Auth ────────────────────────────────────────────────────────────────
export async function signUp(email, password, name, city) {
  if (isDemoMode) {
    DEMO_USER = { id: 'u1', name, email, city }
    return { user: DEMO_USER, error: null }
  }
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, city } } })
  if (!error && data.user) {
    await supabase.from('profiles').upsert({ id: data.user.id, name, city, email })
  }
  return { user: data?.user, error }
}

export async function signIn(email, password) {
  if (isDemoMode) {
    return { user: DEMO_USER, error: null }
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data?.user, error }
}

export async function signOut() {
  if (!isDemoMode) await supabase.auth.signOut()
}

export async function getSession() {
  if (isDemoMode) return null
  const { data } = await supabase.auth.getSession()
  return data?.session?.user || null
}

export async function getProfile(userId) {
  if (isDemoMode) return DEMO_USER
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

export async function updateProfile(userId, updates) {
  if (isDemoMode) {
    DEMO_USER = { ...DEMO_USER, ...updates }
    return { error: null }
  }
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  return { error }
}

// ── Dogs ────────────────────────────────────────────────────────────────
export async function getDogs(filters = {}) {
  if (isDemoMode) {
    let dogs = [...DEMO_DOGS].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (filters.color)   dogs = dogs.filter(d => d.color === filters.color)
    if (filters.size)    dogs = dogs.filter(d => d.size === filters.size)
    if (filters.injured) dogs = dogs.filter(d => d.injured)
    if (filters.breed)   dogs = dogs.filter(d => d.breed === filters.breed)
    return { data: dogs, error: null }
  }
  let q = supabase.from('dogs').select('*').order('created_at', { ascending: false })
  if (filters.color)   q = q.eq('color', filters.color)
  if (filters.size)    q = q.eq('size', filters.size)
  if (filters.injured) q = q.eq('injured', true)
  if (filters.breed)   q = q.eq('breed', filters.breed)
  const { data, error } = await q
  return { data: data || [], error }
}

export async function getDog(id) {
  if (isDemoMode) return { data: DEMO_DOGS.find(d => d.id === id) || null, error: null }
  const { data, error } = await supabase.from('dogs').select('*').eq('id', id).single()
  return { data, error }
}

export async function addDog(dogData) {
  if (isDemoMode) {
    const dog = {
      ...dogData,
      id: 'd' + nextId++,
      dog_id: 'SD-' + String(DEMO_DOGS.length + 1).padStart(3, '0'),
      created_at: new Date().toISOString()
    }
    DEMO_DOGS.unshift(dog)
    return { data: dog, error: null }
  }
  const { data, error } = await supabase.from('dogs').insert(dogData).select().single()
  return { data, error }
}

export async function deleteDog(id) {
  if (isDemoMode) {
    DEMO_DOGS = DEMO_DOGS.filter(d => d.id !== id)
    return { error: null }
  }
  const { error } = await supabase.from('dogs').delete().eq('id', id)
  return { error }
}

// stats for model testing dashboard
export function getModelStats(dogs) {
  if (!dogs.length) return { total: 0, apiCount: 0, mockCount: 0, avgConfidence: 0, avgBreedConf: 0, injuredCount: 0, breedDist: {}, confDist: { high: 0, mid: 0, low: 0 } }
  const apiDogs  = dogs.filter(d => d.analysis_source === 'api')
  const mockDogs = dogs.filter(d => d.analysis_source === 'mock' || d.analysis_source === 'api_error')
  const avgConf  = Math.round(dogs.reduce((s, d) => s + (d.confidence || 0), 0) / dogs.length)
  const avgBreed = Math.round(dogs.reduce((s, d) => s + (d.breed_confidence || 0), 0) / dogs.length)
  const breedDist = {}
  dogs.forEach(d => { breedDist[d.breed] = (breedDist[d.breed] || 0) + 1 })
  const confDist = {
    high: dogs.filter(d => d.confidence >= 80).length,
    mid:  dogs.filter(d => d.confidence >= 60 && d.confidence < 80).length,
    low:  dogs.filter(d => d.confidence < 60).length,
  }
  return { total: dogs.length, apiCount: apiDogs.length, mockCount: mockDogs.length, avgConfidence: avgConf, avgBreedConf: avgBreed, injuredCount: dogs.filter(d => d.injured).length, breedDist, confDist }
}
