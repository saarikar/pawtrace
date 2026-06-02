// Vision — calls FastAPI backend for ML inference
// Supports two modes:
//   1. Vision LLM (Ollama) — rich breed/health/temperament analysis
//   2. YOLO+MobileNetV2 fallback — basic 12-class breed detection
// Backend URL configured via EXPO_PUBLIC_BACKEND_URL env var

import * as Location from 'expo-location'

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5001'

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

export const ANGLE_PROMPTS = [
  { label: 'Front view',       hint: 'Face the dog straight on' },
  { label: 'Left side',        hint: 'Dog facing left' },
  { label: 'Right side',       hint: 'Dog facing right' },
  { label: 'Back view',        hint: 'From behind the dog' },
  { label: 'Close-up of face', hint: 'Head and face clearly visible' },
]

// ── Backend health checks ─────────────────────────────────────────────

export async function checkBackend() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(BACKEND + '/status', { signal: controller.signal })
    clearTimeout(timeout)
    const data = await res.json()
    return { online: true, ...data }
  } catch {
    return { online: false }
  }
}

export async function checkVisionStatus() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(BACKEND + '/vision-status', { signal: controller.signal })
    clearTimeout(timeout)
    return await res.json()
  } catch {
    return { online: false }
  }
}

// ── Vision LLM analysis (primary — Ollama) ────────────────────────────

export async function analyzeVision(base64, mime = 'image/jpeg') {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000) // 2min for LLM
    const res = await fetch(BACKEND + '/analyse-vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mime }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const data = await res.json()
    if (data.error) return { error: data.error, _source: data._source || 'error' }
    if (!data.is_dog) return { is_dog: false, message: data.message || 'No dog detected', _source: data._source }
    return { ...data, is_dog: true }
  } catch (e) {
    if (e.name === 'AbortError') return { error: 'Analysis timed out (vision model may be loading)', _source: 'timeout' }
    return { error: 'Cannot reach backend.', _source: 'offline' }
  }
}

export async function analyzeVisionBatch(photos) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000) // 3min for batch
    const res = await fetch(BACKEND + '/analyse-vision-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: photos.map(p => p.b64), mime: 'image/jpeg' }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const data = await res.json()
    if (data.error) return { error: data.error, _source: data._source || 'error' }
    return data
  } catch (e) {
    if (e.name === 'AbortError') return { error: 'Analysis timed out. Vision model may still be loading.', _source: 'timeout' }
    return { error: 'Cannot reach backend.', _source: 'offline' }
  }
}

// ── Legacy YOLO+MobileNetV2 analysis (fallback) ──────────────────────

export async function analyzeImage(base64, mime = 'image/jpeg') {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    const res = await fetch(BACKEND + '/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mime }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const data = await res.json()
    if (data.error) return { error: data.error, _source: 'backend_error' }
    if (!data.is_dog) return { is_dog: false, message: data.message, _source: 'backend' }
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
      _source: 'backend',
    }
  } catch (e) {
    if (e.name === 'AbortError') return { error: 'Analysis timed out.', _source: 'timeout' }
    return { error: 'Cannot reach backend.', _source: 'offline' }
  }
}

export async function analyzeImageBatch(photos) {
  // Try vision LLM first, fall back to legacy
  const visionResult = await analyzeVisionBatch(photos)
  if (visionResult._source === 'vision_llm') return visionResult

  // If vision LLM failed, try legacy endpoint
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)
    const res = await fetch(BACKEND + '/analyse-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: photos.map(p => p.b64), mime: 'image/jpeg' }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const data = await res.json()
    if (data.error) return { error: data.error, _source: 'backend_error' }
    return { ...data, _source: 'yolo_fallback' }
  } catch (e) {
    // Return the vision result even if it was an error — it has more info
    if (visionResult.error) return visionResult
    if (e.name === 'AbortError') return { error: 'Analysis timed out.', _source: 'timeout' }
    return { error: 'Cannot reach backend.', _source: 'offline' }
  }
}

// ── Search ────────────────────────────────────────────────────────────

export async function searchDogs(photos, filters = {}, location = {}) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)
    const res = await fetch(BACKEND + '/search', {
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
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const data = await res.json()
    if (!res.ok) return { error: data.detail || data.error || `Server error (${res.status})` }
    if (data.error) return { error: data.error }
    return data
  } catch (e) {
    if (e.name === 'AbortError') return { error: 'Search timed out.' }
    return { error: 'Cannot reach backend.' }
  }
}

// ── Save feature vector ──────────────────────────────────────────────

export async function saveFeature(dogId, feature) {
  try {
    const res = await fetch(BACKEND + '/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dog_id: dogId, feature }),
    })
    return await res.json()
  } catch {
    return { saved: false, error: 'Could not save to backend' }
  }
}

// ── GPS ──────────────────────────────────────────────────────────────

export async function getLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      return { lat: null, lng: null, error: 'Location permission denied' }
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 8000,
    })
    return {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      error: null,
    }
  } catch (err) {
    return { lat: null, lng: null, error: err.message }
  }
}

// ── Reverse geocode ──────────────────────────────────────────────────

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
