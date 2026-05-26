import { useState, useRef, useEffect } from 'react'
import { searchDogs, getLocation, BREEDS, COLORS, SIZES, checkBackend } from '../lib/vision.js'
import { useApp } from '../App.jsx'

const ORANGE      = '#E07B39'
const DARK_ORANGE = '#C0510B'
const NAVY        = '#1F4E79'
const BG          = '#FDF8F4'
const GRAY        = '#6B7280'
const LIGHT_GRAY  = '#F3F4F6'
const GREEN       = '#16A34A'
const RED         = '#DC2626'
const AMBER       = '#D97706'

const inp = { width: '100%', padding: '10px 12px', border: `1.5px solid ${LIGHT_GRAY}`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a18', appearance: 'none', marginBottom: 12, boxSizing: 'border-box' }
const lbl = { fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 5, display: 'block' }

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function simColor(pct) {
  if (pct >= 80) return GREEN
  if (pct >= 60) return AMBER
  return RED
}

function MatchCard({ match, onView, onClaim }) {
  const [imgFailed, setImgFailed] = useState(false)
  const isLost = match.report_type === 'lost_pet'
  return (
    <div style={{ background: '#fff', borderRadius: 14, marginBottom: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `1px solid ${LIGHT_GRAY}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 10, padding: '12px 12px 10px' }}>
        {/* Thumbnail */}
        <div style={{ width: 64, height: 64, borderRadius: 10, background: LIGHT_GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, flexShrink: 0, overflow: 'hidden' }}>
          {match.photo_url && !imgFailed
            ? <img src={match.photo_url} alt="dog" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFailed(true)} />
            : (isLost ? '🔍' : '🐕')
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>
              {isLost ? (match.pet_name || 'Unknown') : match.dog_id}
            </span>
            <span style={{ background: simColor(match.similarity), color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8 }}>
              {match.similarity}% {match.match_type === 'attribute' ? 'attr' : 'visual'}
            </span>
            {isLost && <span style={{ background: RED, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>LOST</span>}
          </div>
          <div style={{ fontSize: 11, color: GRAY }}>{match.breed} · {match.color}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: GRAY }}>📍 {match.area || 'Unknown'}</span>
            {match.created_at && <span style={{ fontSize: 10, color: GRAY }}>🕐 {timeAgo(match.created_at)}</span>}
            {match.distance_km != null && (
              <span style={{ fontSize: 10, color: NAVY, fontWeight: 600 }}>📡 {match.distance_km} km away</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 12px 12px' }}>
        <button onClick={onClaim} style={{ flex: 1, padding: '8px 0', background: '#fff', color: ORANGE, border: `1.5px solid ${ORANGE}50`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          🐾 This is my dog!
        </button>
        <button onClick={onView} style={{ flex: 1, padding: '8px 0', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          View Profile →
        </button>
      </div>
    </div>
  )
}

export default function SearchPage() {
  const { nav } = useApp()
  const galleryRef = useRef()

  const [step, setStep]           = useState('upload')  // upload | searching | results
  const [photos, setPhotos]       = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters]     = useState({ breed: '', color: '', size: '', report_type: '' })
  const [location, setLocation]   = useState({ lat: null, lng: null })
  const [locLoading, setLocLoading] = useState(true)
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState('')

  useEffect(() => { fetchLocation() }, [])

  const setF = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))

  const compressFile = (file) => new Promise((resolve) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = e => { img.src = e.target.result }
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxSize = 640
      let w = img.width, h = img.height
      if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize } }
      else       { if (h > maxSize) { w = w * maxSize / h; h = maxSize } }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      resolve({ b64: dataUrl.split(',')[1], mime: 'image/jpeg', preview: dataUrl })
    }
    reader.readAsDataURL(file)
  })

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - photos.length)
    if (!files.length) return
    const compressed = await Promise.all(files.map(compressFile))
    setPhotos(prev => [...prev, ...compressed].slice(0, 3))
    e.target.value = ''
  }

  const removePhoto = (idx) => setPhotos(p => p.filter((_, i) => i !== idx))

  const fetchLocation = async () => {
    setLocLoading(true)
    const pos = await getLocation()
    if (pos.lat) setLocation({ lat: pos.lat, lng: pos.lng })
    setLocLoading(false)
  }

  const handleSearch = async () => {
    setError('')
    setStep('searching')
    const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    const data = await searchDogs(photos, { ...activeFilters, radius_km: 10 }, location)
    if (data.error) { setError(data.error); setStep('upload'); return }
    setResults(data)
    setStep('results')
  }

  const reset = () => {
    setStep('upload'); setPhotos([]); setResults(null); setError('')
    setFilters({ breed: '', color: '', size: '', report_type: '' })
  }

  // ── Searching ──────────────────────────────────────────────────────────────
  if (step === 'searching') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, background: BG }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 260 }}>
        {photos.map((p, i) => <img key={i} src={p.preview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />)}
      </div>
      <div style={{ width: 40, height: 40, border: `4px solid ${LIGHT_GRAY}`, borderTop: `4px solid ${ORANGE}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Searching database...</div>
      <div style={{ fontSize: 13, color: GRAY, textAlign: 'center', maxWidth: 260, lineHeight: 1.6 }}>
        Extracting visual features · computing similarity across all records
      </div>
    </div>
  )

  // ── Results ────────────────────────────────────────────────────────────────
  if (step === 'results' && results) return (
    <div style={{ background: BG, minHeight: '100dvh' }}>
      <div style={{ background: `linear-gradient(135deg, ${DARK_ORANGE}, ${ORANGE})`, padding: '14px 16px 12px' }}>
        <div onClick={reset} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4, cursor: 'pointer' }}>← Search again</div>
        <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>Search Results</div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>
          {results.matches.length} match{results.matches.length !== 1 ? 'es' : ''} · {results.candidates_checked} dogs checked
          {results.detected_breed ? ` · detected: ${results.detected_breed}` : ''}
          {results.detected_color ? `, ${results.detected_color}` : ''}
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {results.matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              {results.photos_processed === 0 ? 'No dog detected in your photo' : 'No matches found'}
            </div>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              {results.photos_processed === 0
                ? 'YOLO could not detect a dog — try a clearer photo with the dog fully visible'
                : results.candidates_checked === 0
                  ? 'No dogs with AI features in the database yet — report a dog first so the system can learn from it'
                  : `Checked ${results.candidates_checked} dog${results.candidates_checked !== 1 ? 's' : ''} · try different photos or remove filters`}
            </div>
            {results.message && <div style={{ fontSize: 11, color: GRAY, background: LIGHT_GRAY, borderRadius: 8, padding: '6px 12px', display: 'inline-block', marginBottom: 12 }}>{results.message}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              <div style={{ background: LIGHT_GRAY, borderRadius: 8, padding: '6px 12px', fontSize: 11 }}>📷 {results.photos_processed} photo{results.photos_processed !== 1 ? 's' : ''} processed</div>
              <div style={{ background: LIGHT_GRAY, borderRadius: 8, padding: '6px 12px', fontSize: 11 }}>🗄 {results.candidates_checked} candidates</div>
            </div>
            <button onClick={reset} style={{ marginTop: 20, padding: '10px 24px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Search again</button>
          </div>
        ) : (
          <>
            {(results.matches || []).map((match) => (
              <MatchCard
                key={match.id || match.dog_id}
                match={match}
                onView={() => nav('dog', { dogId: match.id })}
                onClaim={() => nav('dog', { dogId: match.id })}
              />
            ))}
            <button onClick={reset} style={{ width: '100%', marginTop: 4, marginBottom: 24, padding: 12, background: '#fff', color: GRAY, border: `1.5px solid ${LIGHT_GRAY}`, borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>← Search again</button>
          </>
        )}
      </div>
    </div>
  )

  // ── Upload ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: BG, minHeight: '100dvh' }}>
      <div style={{ background: `linear-gradient(135deg, ${DARK_ORANGE}, ${ORANGE})`, padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🔍</span>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>Search by Photo</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>AI visual similarity · up to 3 photos</div>
          </div>
        </div>
      </div>

      <input ref={galleryRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFiles} />

      <div style={{ padding: '14px 14px' }}>
        {/* Photo upload */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${LIGHT_GRAY}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Photos of the dog</div>
          <div style={{ fontSize: 12, color: ORANGE, marginBottom: 12 }}>Upload 1–3 clear photos for best results</div>

          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p.preview} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                  <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 3 && (
            <button onClick={() => galleryRef.current?.click()} style={{ width: '100%', padding: 11, background: BG, border: `2px dashed ${ORANGE}60`, borderRadius: 8, fontSize: 14, color: ORANGE, fontWeight: 600, cursor: 'pointer' }}>
              {photos.length === 0 ? '📷 Upload photos' : '+ Add more photos'}
            </button>
          )}
        </div>

        {/* Location */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${LIGHT_GRAY}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</div>
          {locLoading ? (
            <div style={{ fontSize: 13, color: GRAY }}>📍 Getting your location...</div>
          ) : location.lat ? (
            <div style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>📍 Searching within 10 km of your location</div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: GRAY, marginBottom: 8 }}>Location unavailable — results will not be filtered by distance</div>
              <button onClick={fetchLocation} style={{ width: '100%', padding: 9, background: `${NAVY}10`, border: `1.5px solid ${NAVY}30`, borderRadius: 8, fontSize: 13, color: NAVY, fontWeight: 600, cursor: 'pointer' }}>
                📍 Try again
              </button>
            </>
          )}
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${LIGHT_GRAY}` }}>
          <div onClick={() => setFiltersOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters <span style={{ fontWeight: 400, textTransform: 'none', color: GRAY }}>— optional</span></div>
            <span style={{ fontSize: 16, color: GRAY }}>{filtersOpen ? '▲' : '▼'}</span>
          </div>

          {filtersOpen && (
            <div style={{ marginTop: 14 }}>
              <label style={lbl}>Report type</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[['', 'All'], ['stray', 'Stray'], ['lost_pet', 'Lost pet']].map(([val, label]) => (
                  <div key={val} onClick={() => setFilters(f => ({ ...f, report_type: val }))}
                    style={{ flex: 1, padding: '7px 0', textAlign: 'center', borderRadius: 8, border: `1.5px solid ${filters.report_type === val ? ORANGE : LIGHT_GRAY}`, background: filters.report_type === val ? `${ORANGE}15` : '#fff', fontSize: 12, fontWeight: 600, color: filters.report_type === val ? ORANGE : GRAY, cursor: 'pointer' }}>
                    {label}
                  </div>
                ))}
              </div>

              <label style={lbl}>Breed</label>
              <select style={inp} value={filters.breed} onChange={setF('breed')}>
                <option value="">Any breed</option>
                {BREEDS.filter(b => b !== 'Cannot determine').map(b => <option key={b}>{b}</option>)}
              </select>

              <label style={lbl}>Colour</label>
              <select style={inp} value={filters.color} onChange={setF('color')}>
                <option value="">Any colour</option>
                {COLORS.map(c => <option key={c}>{c}</option>)}
              </select>

              <label style={lbl}>Size</label>
              <select style={inp} value={filters.size} onChange={setF('size')}>
                <option value="">Any size</option>
                {SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: `1px solid ${RED}40`, borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 13, color: RED }}>{error}</div>
        )}

        <button
          onClick={handleSearch}
          disabled={photos.length === 0}
          style={{ width: '100%', padding: 14, background: photos.length > 0 ? ORANGE : '#aaa', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: photos.length > 0 ? 'pointer' : 'not-allowed', marginBottom: 24 }}>
          {photos.length === 0 ? 'Upload a photo to search' : `Search with ${photos.length} photo${photos.length !== 1 ? 's' : ''} →`}
        </button>
      </div>
    </div>
  )
}
