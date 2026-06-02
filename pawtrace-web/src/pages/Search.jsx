import { useState, useRef, useEffect } from 'react'
import { searchDogs, getLocation, BREEDS, COLORS, SIZES } from '../lib/vision.js'
import { useApp } from '../App.jsx'
import { timeAgo } from '../lib/utils.js'

const C = {
  primary: '#E8453C', primarySoft: '#FFF0EF',
  secondary: '#0B3558', secondarySoft: '#EEF3FA',
  accent: '#F5A623', accentSoft: '#FFF8EC',
  teal: '#22AA86', tealSoft: '#EEFAF6',
  text: '#1A1A2E', textSecondary: '#6B7280', textMuted: '#9CA3AF',
  bg: '#F7F7F7', bgCard: '#FFFFFF', bgSection: '#FAFAFA',
  border: '#E5E7EB', borderLight: '#F3F4F6',
  danger: '#E8453C', success: '#22AA86',
}

const sel = {
  width: '100%', padding: '10px 12px',
  border: `1.5px solid ${C.border}`, borderRadius: 10,
  fontSize: 14, outline: 'none', background: '#fff',
  color: C.text, appearance: 'none', marginBottom: 12,
  boxSizing: 'border-box',
}

function simColor(pct) {
  if (pct >= 80) return C.success
  if (pct >= 60) return C.accent
  return C.danger
}

function MatchCard({ match, onView, onClaim }) {
  const [imgFailed, setImgFailed] = useState(false)
  const isLost = match.report_type === 'lost_pet'
  const sim = match.similarity
  const simC = simColor(sim)

  return (
    <div style={{ background: C.bgCard, borderRadius: 20, marginBottom: 14, border: `1px solid ${C.borderLight}`, boxShadow: '0 2px 12px rgba(11,53,88,0.08)', overflow: 'hidden' }}>
      {/* Row */}
      <div style={{ display: 'flex', gap: 14, padding: '16px 16px 12px' }}>
        <div style={{ width: 72, height: 72, borderRadius: 14, background: C.bgSection, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, overflow: 'hidden', border: `1px solid ${C.border}` }}>
          {match.photo_url && !imgFailed
            ? <img src={match.photo_url} alt="dog" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFailed(true)} />
            : (isLost ? '🔍' : '🐕')}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
              {isLost ? (match.pet_name || 'Unknown') : match.dog_id}
            </span>
            <span style={{ background: simC, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>{sim}%</span>
            {isLost && <span style={{ background: C.danger, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>LOST</span>}
          </div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>{match.breed} · {match.color}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.textMuted }}>📍 {match.area || 'Unknown'}</span>
            {match.distance_km != null && (
              <span style={{ background: C.secondarySoft, color: C.secondary, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8 }}>{match.distance_km} km</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px', borderTop: `1px solid ${C.borderLight}`, paddingTop: 10, marginTop: 0 }}>
        <button onClick={onClaim} style={{ flex: 1, padding: '10px 0', background: C.primarySoft, color: C.primary, border: `1.5px solid ${C.primary}30`, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          🐾 This is my dog!
        </button>
        <button onClick={onView} style={{ flex: 1, padding: '10px 0', background: C.secondary, color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(11,53,88,0.18)' }}>
          View Profile
        </button>
      </div>
    </div>
  )
}

export default function SearchPage() {
  const { nav } = useApp()
  const galleryRef = useRef(null)

  const [step, setStep]             = useState('upload')
  const [photos, setPhotos]         = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters]       = useState({ breed: '', color: '', size: '', report_type: '' })
  const [location, setLocation]     = useState({ lat: null, lng: null })
  const [locLoading, setLocLoading] = useState(true)
  const [results, setResults]       = useState(null)
  const [error, setError]           = useState('')

  useEffect(() => { fetchLocation() }, [])

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
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
          {photos.map((p, i) => (
            <img key={i} src={p.preview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
          ))}
        </div>
      )}
      <div style={{ width: 64, height: 64, borderRadius: 32, background: C.secondarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        <div style={{ width: 36, height: 36, border: `4px solid ${C.borderLight}`, borderTop: `4px solid ${C.secondary}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 20 }}>Searching database...</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: '🔬', label: 'Extracting features' },
          { icon: '📊', label: 'Computing similarity' },
          { icon: '📍', label: 'Ranking by distance' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bgCard, padding: '10px 18px', borderRadius: 999, boxShadow: '0 2px 8px rgba(11,53,88,0.07)' }}>
            <span style={{ fontSize: 14 }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: C.textSecondary, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Results ────────────────────────────────────────────────────────────────
  if (step === 'results' && results) return (
    <div style={{ background: C.bg, minHeight: '100dvh' }}>
      {/* Teal header */}
      <div style={{ background: C.teal, padding: '20px 20px 24px' }}>
        <div onClick={reset} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 8, cursor: 'pointer', fontWeight: 600 }}>← Search again</div>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>Search Results</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
          {results.matches.length} match{results.matches.length !== 1 ? 'es' : ''} · {results.candidates_checked} dogs checked
          {results.detected_breed ? ` · ${results.detected_breed}` : ''}
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {results.matches.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
            <div style={{ width: 100, height: 100, borderRadius: 50, background: C.accentSoft, border: `3px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, marginBottom: 20 }}>🐾</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, textAlign: 'center', marginBottom: 8 }}>
              {results.photos_processed === 0 ? 'No dog detected' : 'No matches found'}
            </div>
            <div style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 1.5, maxWidth: 280, marginBottom: 28 }}>
              {results.photos_processed === 0
                ? 'Make sure there is a dog clearly visible in the photo.'
                : 'Try different photos or adjust your filters for better results.'}
            </div>
            <button onClick={reset} style={{ padding: '14px 40px', background: C.secondary, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Search again</button>
          </div>
        ) : (
          <>
            {/* Summary card */}
            <div style={{ background: C.tealSoft, borderRadius: 20, padding: 16, marginBottom: 16, border: `1px solid ${C.teal}25`, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: `${C.secondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⭐</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.secondary }}>
                  {results.matches.length} potential match{results.matches.length !== 1 ? 'es' : ''}
                </div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>Sorted by visual similarity</div>
              </div>
            </div>

            {(results.matches || []).map((match) => (
              <MatchCard
                key={match.id || match.dog_id}
                match={match}
                onView={() => nav('dog', { dogId: match.id })}
                onClaim={() => nav('dog', { dogId: match.id })}
              />
            ))}

            <button onClick={reset} style={{ width: '100%', marginTop: 8, padding: 14, background: C.bgCard, color: C.textSecondary, border: `1.5px solid ${C.border}`, borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Search again</button>
          </>
        )}
        <div style={{ height: 24 }} />
      </div>
    </div>
  )

  // ── Upload ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100dvh' }}>
      {/* Teal header */}
      <div style={{ background: C.teal, padding: '20px 20px 24px' }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>Search by Photo</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>AI visual similarity · up to 3 photos</div>
      </div>

      <input ref={galleryRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFiles} />

      <div style={{ padding: 20 }}>
        {/* Photo upload card */}
        <div style={{ background: C.bgCard, borderRadius: 20, padding: 20, marginBottom: 14, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Photos of the dog</div>
          <div style={{ fontSize: 13, color: C.secondary, fontWeight: 600, marginBottom: 16 }}>Upload 1–3 clear photos for best results</div>

          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p.preview} alt="" style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 12 }} />
                  <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: 11, background: C.danger, color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>✕</button>
                  <span style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>#{i + 1}</span>
                </div>
              ))}
            </div>
          )}

          {photos.length < 3 && (
            <button onClick={() => galleryRef.current?.click()} style={{ width: '100%', padding: '22px 0', background: C.secondarySoft, border: `2px dashed ${C.secondary}50`, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <span style={{ fontSize: 28 }}>📷</span>
              <span style={{ fontSize: 14, color: C.secondary, fontWeight: 700 }}>{photos.length === 0 ? 'Tap to upload photos' : 'Add more photos'}</span>
              <span style={{ fontSize: 11, color: C.textMuted }}>{photos.length === 0 ? 'Pick from gallery' : `${3 - photos.length} more allowed`}</span>
            </button>
          )}
        </div>

        {/* Location card */}
        <div style={{ background: C.bgCard, borderRadius: 20, padding: 16, marginBottom: 14, border: `1.5px solid ${location.lat ? C.teal + '40' : C.border}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: location.lat ? C.tealSoft : C.bgSection, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📍</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 0.3, marginBottom: 2 }}>LOCATION</div>
              {locLoading ? (
                <div style={{ fontSize: 13, color: C.textSecondary, fontWeight: 600 }}>Getting your location...</div>
              ) : location.lat ? (
                <div style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>Searching within 10 km radius</div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: C.textSecondary, fontWeight: 500, marginBottom: 6 }}>Location unavailable</div>
                  <button onClick={fetchLocation} style={{ background: `${C.secondary}10`, padding: '5px 12px', borderRadius: 999, border: `1.5px solid ${C.secondary}25`, fontSize: 11, fontWeight: 700, color: C.secondary, cursor: 'pointer' }}>Try again</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters card */}
        <div style={{ background: C.bgCard, borderRadius: 20, padding: 16, marginBottom: 14, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
          <div onClick={() => setFiltersOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>🔧</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.3 }}>Filters</span>
              <span style={{ background: `${C.textMuted}15`, color: C.textMuted, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8 }}>optional</span>
            </div>
            <span style={{ fontSize: 13, color: C.textMuted }}>{filtersOpen ? '▲' : '▼'}</span>
          </div>

          {filtersOpen && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.secondary, marginBottom: 8, letterSpacing: 0.3 }}>Report type</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {[['', 'All'], ['stray', 'Stray'], ['lost_pet', 'Lost']].map(([val, label]) => (
                  <button key={val} onClick={() => setFilters(f => ({ ...f, report_type: val }))}
                    style={{ padding: '6px 16px', borderRadius: 999, border: `1.5px solid ${filters.report_type === val ? C.primary : C.border}`, background: filters.report_type === val ? C.primarySoft : '#fff', color: filters.report_type === val ? C.primary : C.textSecondary, fontSize: 13, fontWeight: filters.report_type === val ? 700 : 500, cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: C.secondary, marginBottom: 6, letterSpacing: 0.3 }}>Breed</div>
              <select style={sel} value={filters.breed} onChange={e => setFilters(f => ({ ...f, breed: e.target.value }))}>
                <option value="">Any breed</option>
                {BREEDS.filter(b => b !== 'Cannot determine').map(b => <option key={b}>{b}</option>)}
              </select>

              <div style={{ fontSize: 11, fontWeight: 700, color: C.secondary, marginBottom: 6, letterSpacing: 0.3 }}>Colour</div>
              <select style={sel} value={filters.color} onChange={e => setFilters(f => ({ ...f, color: e.target.value }))}>
                <option value="">Any colour</option>
                {COLORS.map(c => <option key={c}>{c}</option>)}
              </select>

              <div style={{ fontSize: 11, fontWeight: 700, color: C.secondary, marginBottom: 6, letterSpacing: 0.3 }}>Size</div>
              <select style={{ ...sel, marginBottom: 0 }} value={filters.size} onChange={e => setFilters(f => ({ ...f, size: e.target.value }))}>
                <option value="">Any size</option>
                {SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FFF0EF', border: `1px solid ${C.danger}40`, borderRadius: 14, padding: '12px 14px', marginBottom: 14, fontSize: 13, color: C.danger, fontWeight: 500 }}>{error}</div>
        )}

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={photos.length === 0}
          style={{ width: '100%', padding: 15, background: photos.length > 0 ? C.secondary : C.border, color: photos.length > 0 ? '#fff' : C.textMuted, border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: photos.length > 0 ? 'pointer' : 'not-allowed', marginBottom: 20, boxShadow: photos.length > 0 ? '0 4px 12px rgba(11,53,88,0.25)' : 'none' }}>
          {photos.length === 0 ? 'Upload a photo to search' : `Search with ${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
        </button>

        {/* How it works */}
        {photos.length === 0 && (
          <div style={{ background: C.bgCard, borderRadius: 20, padding: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(11,53,88,0.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.5, marginBottom: 16 }}>HOW SEARCH WORKS</div>
            {[
              { icon: '📷', title: 'Upload photos', sub: 'Clear, well-lit photos of the dog' },
              { icon: '🔬', title: 'Feature extraction', sub: 'AI extracts visual features for matching' },
              { icon: '📊', title: 'Find matches', sub: 'Similar dogs ranked by visual similarity' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: i < 2 ? 0 : 0, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: C.secondarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                  {i < 2 && <div style={{ width: 2, height: 16, background: C.border, margin: '2px 0' }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: i < 2 ? 4 : 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
