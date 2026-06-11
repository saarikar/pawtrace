// Vision — calls FastAPI backend for ML inference
// Backend URL configured via VITE_BACKEND_URL env var (defaults to localhost for dev)

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5001'
const API_KEY = import.meta.env.VITE_BACKEND_API_KEY || ''

export const BREEDS = [
  'Indian Pariah Dog', 'Indian Spitz mix', 'Labrador mix',
  'German Shepherd mix', 'Doberman mix', 'Rajapalayam mix',
  'Kombai mix', 'Mudhol Hound mix', 'Chippiparai mix',
  'Kanni mix', 'Cocker Spaniel mix', 'Dalmatian mix',
  'Cannot determine',
]

export const COLORS = ['black', 'white', 'brown', 'tan', 'grey', 'black & white', 'brown & white', 'tri-color']
export const SIZES  = ['small', 'medium', 'large']
export const SEXES  = ['male', 'female', 'unknown']
export const AGES   = ['puppy (< 6 mo)', 'juvenile (6-18 mo)', 'adult (1.5-7 yr)', 'senior (7+ yr)']

// Check if backend is running
export async function checkBackend() {
  try {
    const res = await fetch(BACKEND_URL + '/status', { signal: AbortSignal.timeout(3000) })
    const data = await res.json()
    return { online: true, ...data }
  } catch {
    return { online: false }
  }
}

// Main analysis — sends base64 image to backend
export async function analyzeImage(base64, mime = 'image/jpeg') {
  try {
    const res = await fetch(BACKEND_URL + '/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mime }),
      signal: AbortSignal.timeout(60000)
    })

    const data = await res.json()

    if (data.error) {
      return { error: data.error, _source: 'backend_error' }
    }

    if (!data.is_dog) {
      return { is_dog: false, message: data.message, _source: 'backend' }
    }

    return {
      is_dog: true,
      breed: data.breed,
      breed_confidence: data.breed_confidence,
      yolo_confidence: data.yolo_confidence,
      match_found: data.match_found,
      match_id: data.match_id,
      similarity: data.similarity,
      bbox: data.bbox,
      feature: data.feature,
      feature_dim: data.feature_dim,
      dogs_checked: data.dogs_checked,
      _source: 'backend'
    }

  } catch (e) {
    if (e.name === 'TimeoutError') {
      return { error: 'Analysis timed out. Is the backend running?', _source: 'timeout' }
    }

    return { error: 'Cannot reach backend. Run: python app.py', _source: 'offline' }
  }
}

// Multi-photo analysis — sends up to 6 base64 images, returns aggregated prediction
export async function analyzeImageBatch(photos) {
  try {
    const res = await fetch(BACKEND_URL + '/analyse-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: photos.map(p => p.b64), mime: 'image/jpeg' }),
      signal: AbortSignal.timeout(120000),
    })
    const data = await res.json()
    if (data.error) return { error: data.error, _source: 'backend_error' }
    return { ...data, _source: 'backend' }
  } catch (e) {
    if (e.name === 'TimeoutError') return { error: 'Analysis timed out. Is the backend running?', _source: 'timeout' }
    return { error: 'Cannot reach backend. Run: python app.py', _source: 'offline' }
  }
}

// Search database by photo(s) — returns ranked matches
export async function searchDogs(photos, filters = {}, location = {}) {
  try {
    const res = await fetch(BACKEND_URL + '/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: photos.map(p => p.b64),
        mime: 'image/jpeg',
        top_n: 10,
        ...filters,
        lat: location.lat || null,
        lng: location.lng || null,
      }),
      signal: AbortSignal.timeout(120000),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.detail || data.error || `Server error (${res.status})` }
    if (data.error) return { error: data.error }
    return data
  } catch (e) {
    if (e.name === 'TimeoutError') return { error: 'Search timed out. Is the backend running?' }
    return { error: 'Cannot reach backend. Run: python app.py' }
  }
}

// Save feature vector for a confirmed new dog
export async function saveFeature(dogId, feature) {
  try {
    const res = await fetch(BACKEND_URL + '/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dog_id: dogId, feature }),
    })
    return await res.json()
  } catch {
    return { saved: false, error: 'Could not save to backend' }
  }
}

// GPS
export function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: null, lng: null, error: 'Geolocation not supported' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        error: null,
      }),
      err => resolve({ lat: null, lng: null, error: err.message }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  })
}

// ── Ollama Vision LLM (primary — richer analysis) ─────────────────────

// Check whether Ollama is reachable and the vision model is loaded
export async function checkVisionStatus() {
  try {
    const res = await fetch(BACKEND_URL + '/vision-status', { signal: AbortSignal.timeout(3000) })
    return await res.json()
  } catch {
    return { online: false }
  }
}

// Single-image Ollama analysis — returns breed, health, marks, temperament, etc.
export async function analyzeVision(base64, mime = 'image/jpeg') {
  try {
    const res = await fetch(BACKEND_URL + '/analyse-vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify({ image: base64, mime }),
      signal: AbortSignal.timeout(240000),
    })
    const data = await res.json()
    if (data.error) return { error: data.error, _source: data._source || 'error' }
    if (!data.is_dog) return { is_dog: false, message: data.message || 'No dog detected', _source: data._source }
    return { ...data, is_dog: true }
  } catch (e) {
    if (e.name === 'TimeoutError') return { error: 'Analysis timed out (vision model may be loading)', _source: 'timeout' }
    return { error: 'Cannot reach backend. Run: python app.py', _source: 'offline' }
  }
}

// Multi-photo Ollama analysis — Ollama runs on first image, features averaged across all
export async function analyzeVisionBatch(photos) {
  try {
    const res = await fetch(BACKEND_URL + '/analyse-vision-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify({ images: photos.map(p => p.b64), mime: 'image/jpeg' }),
      signal: AbortSignal.timeout(300000),
    })
    const data = await res.json()
    if (data.error) return { error: data.error, _source: data._source || 'error' }
    return data
  } catch (e) {
    if (e.name === 'TimeoutError') return { error: 'Analysis timed out. Vision model may still be loading.', _source: 'timeout' }
    return { error: 'Cannot reach backend. Run: python app.py', _source: 'offline' }
  }
}

// Reverse geocode — free, no key needed
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json',
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const a = data.address || {}
    const area = a.suburb || a.neighbourhood || a.town || a.village || ''
    const city = a.city || a.state_district || a.state || ''
    return { area, city }
  } catch {
    return { area: 'Unknown area', city: 'Unknown city' }
  }
}
