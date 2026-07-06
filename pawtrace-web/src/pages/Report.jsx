import { useState, useRef, useEffect } from 'react'
import { analyzeVisionBatch, saveFeature, getLocation, reverseGeocode, COLORS, SIZES, SEXES, AGES, BREEDS, checkBackend } from '../lib/vision.js'
import { addDog, updateDog } from '../lib/data.js'
import { supabase, isDemoMode } from '../lib/supabase.js'
import { useApp } from '../App.jsx'
import { PRIMARY, PRIMARY_DARK, SECONDARY, BG_SCREEN, TEXT_SECONDARY, BORDER_LIGHT, SUCCESS, DANGER, FONT_WEIGHT, SHADOW, RADIUS } from '../lib/constants.js'

const inp = { width: '100%', padding: '10px 12px', border: `1.5px solid ${BORDER_LIGHT}`, borderRadius: RADIUS.md, fontSize: 14, outline: 'none', marginBottom: 14, background: '#fff', color: '#1a1a2E', appearance: 'none' }
const lbl = { fontSize: 12, fontWeight: FONT_WEIGHT.semibold, color: SECONDARY, marginBottom: 5, display: 'block' }

const ANGLE_PROMPTS = [
  { label: 'Front view',        hint: 'Face the dog straight on' },
  { label: 'Left side',         hint: 'Dog facing left' },
  { label: 'Right side',        hint: 'Dog facing right' },
  { label: 'Back view',         hint: 'From behind the dog' },
  { label: 'Close-up of face',  hint: 'Head and face clearly visible' },
]

function Bar({ label, value, color }) {
  const c = color || (value >= 80 ? SUCCESS : value >= 60 ? '#D97706' : DANGER)
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: TEXT_SECONDARY }}>{label}</span>
        <span style={{ fontWeight: 700, color: c }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: BORDER_LIGHT, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: value + '%', background: c, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function AppHeader({ title, subtitle, back, onBack }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${PRIMARY_DARK}, ${PRIMARY})`, padding: '14px 16px 12px', flexShrink: 0 }}>
      {back && (
        <div onClick={onBack} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4, cursor: 'pointer' }}>← {back}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>🐾</span>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>{title}</div>
          {subtitle && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>{subtitle}</div>}
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const { user, profile, nav } = useApp()
  const galleryRef = useRef(null)
  const cameraRef  = useRef(null)

  const [backend, setBackend]         = useState(null)
  const [step, setStep]               = useState('capture')
  const [reportType, setReportType]   = useState('stray')
  const [photos, setPhotos]           = useState([])
  const [captureMode, setCaptureMode] = useState(null)
  const [cameraStep, setCameraStep]   = useState(0)
  const [analysis, setAnalysis]       = useState(null)
  const [loc, setLoc]                 = useState({ lat: null, lng: null, area: '', city: '', accuracy: null, error: null })
  const [locLoading, setLocLoading]   = useState(false)
  const [form, setForm]               = useState({ reporter_name: profile?.name || '', notes: '', sex: 'unknown', age: 'adult (1.5-7 yr)', injured: false, injury_notes: '', vaccinated: false, vaccination_notes: '' })
  const [lostForm, setLostForm]       = useState({ pet_name: '', reporter_name: profile?.name || '', owner_phone: '', breed: '', color: '', size: 'medium', sex: 'unknown', age: 'adult (1.5-7 yr)', date_lost: '', notes: '' })
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState('')

  const set     = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setLost = k => e => setLostForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => { checkBackend().then(setBackend) }, [])

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

  const handleGalleryFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const compressed = await Promise.all(files.map(compressFile))
    setPhotos(prev => [...prev, ...compressed])
    e.target.value = ''
  }

  const handleCameraFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressFile(file)
    setPhotos(prev => [...prev, compressed])
    setCameraStep(prev => prev + 1)
    e.target.value = ''
  }

  const removePhoto = (idx) => setPhotos(p => p.filter((_, i) => i !== idx))

  const fetchLocation = async () => {
    setLocLoading(true)
    const pos = await getLocation()
    if (pos.lat) {
      const geo = await reverseGeocode(pos.lat, pos.lng)
      setLoc({ ...pos, area: geo.area, city: geo.city })
    } else {
      setLoc(pos)
    }
    setLocLoading(false)
  }

  const runAnalysis = async () => {
    setStep('analyzing')
    const [result] = await Promise.all([
      analyzeVisionBatch(photos),
      loc.lat ? Promise.resolve() : fetchLocation(),
    ])
    setAnalysis(result)
    if (result.is_dog) {
      setForm(f => ({
        ...f,
        color:   result.color_category ?? result.color ?? f.color,
        size:    result.size            ?? f.size,
        sex:     result.sex             ?? f.sex,
        age:     result.age_estimate    ?? f.age,
        injured: result.injured         ?? f.injured,
      }))
    }
    setStep('review')
  }

  const uploadPhoto = async (photo, newDog) => {
    if (isDemoMode || !supabase) return
    try {
      const binaryString = atob(photo.b64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'image/jpeg' })
      const path = (newDog.dog_id || newDog.id) + '_' + Date.now() + '.jpg'
      const { error: uploadError } = await supabase.storage
        .from('dog-photos').upload(path, blob, { contentType: 'image/jpeg' })
      if (uploadError) {
        console.error('Storage upload error:', uploadError.message, uploadError)
        return
      }
      const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(path)
      const { error: updateError } = await updateDog(newDog.id, { photo_url: urlData.publicUrl })
      if (updateError) console.error('photo_url update error:', updateError.message)
    } catch (e) {
      console.error('Photo upload failed:', e)
    }
  }

  const handleSubmit = async () => {
    setSaving(true); setSaveError('')
    const dogData = {
      report_type: 'stray', breed: analysis.breed,
      color: form.color || 'unknown', size: form.size || 'medium',
      sex: form.sex, age: form.age,
      injured: form.injured, injury_notes: form.injury_notes || null,
      vaccinated: form.vaccinated, vaccination_notes: form.vaccination_notes || null,
      status: 'sighted', confidence: analysis.breed_confidence,
      breed_confidence: analysis.breed_confidence,
      notes: form.notes || null, reporter_name: form.reporter_name || 'Anonymous',
      reporter_id: user?.id || null,
      lat: loc.lat, lng: loc.lng,
      area: loc.area || 'Unknown', city: loc.city || profile?.city || 'Unknown',
      photo_url: null,
    }
    const { data: newDog, error } = await addDog(dogData)
    if (error) { setSaveError(error.message); setSaving(false); return }
    if (analysis.feature && newDog?.dog_id) await saveFeature(newDog.dog_id, analysis.feature)
    if (photos.length > 0 && newDog) {
      let bestIdx = 0
      if (analysis.per_photo) {
        let bestConf = -1
        analysis.per_photo.forEach((p, i) => {
          if (p.is_dog && (p.yolo_confidence || 0) > bestConf) { bestConf = p.yolo_confidence || 0; bestIdx = i }
        })
      }
      await uploadPhoto(photos[bestIdx] ?? photos[0], newDog)
    }
    setSaving(false)
    setStep('success')
  }

  const handleLostPetSubmit = async () => {
    if (!lostForm.pet_name && !lostForm.breed) { setSaveError('Please provide at least a pet name or breed.'); return }
    setSaving(true); setSaveError('')
    const dogData = {
      report_type: 'lost_pet', pet_name: lostForm.pet_name || null,
      breed: lostForm.breed || 'Unknown', color: lostForm.color || 'unknown',
      size: lostForm.size, sex: lostForm.sex, age: lostForm.age,
      owner_phone: lostForm.owner_phone || null, date_lost: lostForm.date_lost || null,
      notes: lostForm.notes || null, reporter_name: lostForm.reporter_name || 'Anonymous',
      reporter_id: user?.id || null,
      lat: loc.lat, lng: loc.lng,
      area: loc.area || 'Unknown', city: loc.city || profile?.city || 'Unknown',
      photo_url: null, injured: false, vaccinated: false,
      status: 'sighted', confidence: null, breed_confidence: null,
    }
    const { data: newDog, error } = await addDog(dogData)
    if (error) { setSaveError(error.message); setSaving(false); return }
    if (photos.length > 0 && newDog) await uploadPhoto(photos[0], newDog)
    setSaving(false)
    setStep('success')
  }

  const resetCapture = () => {
    setStep('capture'); setPhotos([]); setCaptureMode(null); setCameraStep(0)
    setAnalysis(null); setLoc({ lat: null, lng: null, area: '', city: '', accuracy: null, error: null })
    setReportType('stray'); setSaveError('')
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: BG_SCREEN}}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>{reportType === 'lost_pet' ? '🔍' : '✅'}</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
        {reportType === 'lost_pet' ? 'Lost pet report filed!' : 'Dog added!'}
      </h2>
      <p style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6, maxWidth: 260, marginBottom: 28 }}>
        {reportType === 'lost_pet'
          ? 'Your report is now visible to rescuers. They can contact you if they find a match.'
          : 'Saved to directory and feature database. Future uploads will be checked against this dog.'}
      </p>
      <button onClick={resetCapture} style={{ width: '100%', maxWidth: 280, padding: 13, background: PRIMARY, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
        Report another
      </button>
      <button onClick={() => nav('feed')} style={{ width: '100%', maxWidth: 280, padding: 13, background: '#fff', color: '#444', border: `1.5px solid ${BORDER_LIGHT}`, borderRadius: 10, fontSize: 15, cursor: 'pointer' }}>
        View feed
      </button>
    </div>
  )

  // ── Analyzing ────────────────────────────────────────────────────────────
  if (step === 'analyzing') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, background: BG_SCREEN}}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
        {photos.slice(0, 6).map((p, i) => (
          <img key={i} src={p.preview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
        ))}
      </div>
      <div style={{ width: 40, height: 40, border: `4px solid ${BORDER_LIGHT}`, borderTop: `4px solid ${PRIMARY}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Analysing {photos.length} photo{photos.length !== 1 ? 's' : ''}...</div>
      <div style={{ fontSize: 13, color: TEXT_SECONDARY, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
        YOLO detecting dog → Gemini AI analysing breed, colour & size → MobileNetV2 extracting features → checking database
      </div>
    </div>
  )

  // ── Review (stray) ───────────────────────────────────────────────────────
  if (step === 'review' && analysis) {
    if (analysis.error) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 16, background: BG_SCREEN}}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: DANGER }}>Analysis failed</div>
        <div style={{ fontSize: 14, color: TEXT_SECONDARY, maxWidth: 280, lineHeight: 1.6, background: '#fff0f0', padding: 16, borderRadius: 10 }}>{analysis.error}</div>
        <button onClick={() => setStep('capture')} style={{ padding: '11px 24px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Try again</button>
      </div>
    )

    if (!analysis.is_dog) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 16, background: BG_SCREEN}}>
        <div style={{ fontSize: 48 }}>🐕</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>No dog detected</div>
        <div style={{ fontSize: 14, color: TEXT_SECONDARY, maxWidth: 280, lineHeight: 1.6 }}>{analysis.message}</div>
        <button onClick={() => setStep('capture')} style={{ padding: '11px 24px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Try different photos</button>
      </div>
    )

    return (
      <div style={{ background: BG_SCREEN, minHeight: '100dvh' }}>
        <AppHeader title="Dog Details" subtitle="Step 2 of 3 · Confirm AI info" back="Camera" onBack={() => setStep('capture')} />

        <div style={{ padding: '16px 14px' }}>
          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
              {photos.map((p, i) => (
                <img key={i} src={p.preview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              ))}
            </div>
          )}

          {analysis.match_found ? (
            <div style={{ background: '#fff3e0', border: `1.5px solid ${PRIMARY}60`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>⚠️ Possible duplicate detected</div>
              <div style={{ fontSize: 13, color: PRIMARY_DARK, marginTop: 4 }}>
                Matches <b>{analysis.match_id}</b> with {analysis.similarity}% similarity
                — checked against {analysis.dogs_checked} dogs in database
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => nav('dog', { dogId: analysis.match_id })}
                  style={{ flex: 1, padding: 9, background: '#fff', border: `1.5px solid ${PRIMARY}60`, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  View {analysis.match_id}
                </button>
                <button onClick={() => {}}
                  style={{ flex: 1, padding: 9, background: PRIMARY, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  Still a new dog
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: `${SUCCESS}15`, border: `1px solid ${SUCCESS}40`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: SUCCESS, fontWeight: 600 }}>
              ✓ No match found — checked {analysis.dogs_checked} dogs in database. This is a new dog.
            </div>
          )}

          {/* AI auto-detected */}
          <div style={{ background: `${SUCCESS}10`, border: `1px solid ${SUCCESS}30`, borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: SUCCESS, marginBottom: 8 }}>🤖 AI Auto-Detected</div>
            {analysis.photos_analyzed != null && (
              <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginBottom: 8 }}>{analysis.photos_analyzed} of {analysis.photos_submitted} photos had a dog detected</div>
            )}
            <Bar label={analysis._source === 'vision_llm' ? 'Breed confidence (Gemini AI)' : 'Breed confidence (MobileNetV2)'} value={analysis._source === 'vision_llm' ? analysis.breed_confidence : analysis.per_photo?.[0]?.breed_confidence} />
            <Bar label="Dog detection (YOLOv8)" value={analysis.yolo_confidence ?? analysis.per_photo?.[0]?.yolo_confidence} color="#5b8dee" />
            <Bar label="Feature similarity checked" value={analysis.similarity} />
            <div style={{ marginTop: 10, padding: '8px 10px', background: '#fff', borderRadius: 8, border: `1px solid ${BORDER_LIGHT}` }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{analysis.breed}</div>
              {analysis.body_structure && <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>{analysis.body_structure}</div>}
              <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 2 }}>{analysis.feature_dim}-dim feature vector · {analysis.dogs_checked} dogs in DB</div>
            </div>
          </div>

          {/* Form fields */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: `1px solid ${BORDER_LIGHT}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fill in details</div>
            <div style={{ fontSize: 12, color: PRIMARY, marginBottom: 12 }}>AI has pre-filled colour and size — verify or change if needed</div>
            <label style={lbl}>Colour</label>
            <select style={inp} value={form.color || ''} onChange={set('color')}>
              <option value="">Select colour</option>
              {COLORS.map(c => <option key={c}>{c}</option>)}
            </select>
            <label style={lbl}>Size</label>
            <select style={inp} value={form.size || ''} onChange={set('size')}>
              <option value="">Select size</option>
              {SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
            <label style={lbl}>Sex</label>
            <select style={inp} value={form.sex} onChange={set('sex')}>
              {SEXES.map(s => <option key={s}>{s}</option>)}
            </select>
            <label style={lbl}>Age</label>
            <select style={inp} value={form.age} onChange={set('age')}>
              {AGES.map(a => <option key={a}>{a}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <input type="checkbox" id="inj" checked={form.injured} onChange={e => setForm(f => ({ ...f, injured: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <label htmlFor="inj" style={{ fontSize: 14, cursor: 'pointer', color: form.injured ? DANGER : '#444', fontWeight: form.injured ? 700 : 400 }}>Mark as injured</label>
            </div>
            {form.injured && (
              <>
                <label style={lbl}>Injury details</label>
                <input style={inp} placeholder="e.g. limping on right leg" value={form.injury_notes} onChange={set('injury_notes')} />
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <input type="checkbox" id="vacc" checked={form.vaccinated} onChange={e => setForm(f => ({ ...f, vaccinated: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <label htmlFor="vacc" style={{ fontSize: 14, cursor: 'pointer', color: form.vaccinated ? SUCCESS : '#444', fontWeight: form.vaccinated ? 700 : 400 }}>Mark as vaccinated</label>
            </div>
            {form.vaccinated && (
              <>
                <label style={lbl}>Vaccination details <span style={{ fontWeight: 400, color: TEXT_SECONDARY }}>— optional</span></label>
                <input style={inp} placeholder="e.g. Rabies – Jan 2024" value={form.vaccination_notes} onChange={set('vaccination_notes')} />
              </>
            )}
          </div>

          {/* Location */}
          <div style={{ background: `${PRIMARY}10`, border: `1px solid ${PRIMARY}30`, borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: PRIMARY, marginBottom: 6 }}>📍 Location</div>
            {loc.lat ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{loc.area}, {loc.city}</div>
                <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 3 }}>{loc.lat.toFixed(5)}°N, {loc.lng.toFixed(5)}°E · ±{Math.round(loc.accuracy || 0)}m</div>
              </div>
            ) : (
              <button onClick={fetchLocation} disabled={locLoading}
                style={{ width: '100%', padding: 10, background: locLoading ? BORDER_LIGHT : '#fff', border: `1.5px solid ${PRIMARY}50`, borderRadius: 8, fontSize: 14, color: PRIMARY, fontWeight: 600, cursor: locLoading ? 'default' : 'pointer' }}>
                {locLoading ? 'Getting location...' : '📍 Get my GPS location'}
              </button>
            )}
            {loc.error && <div style={{ fontSize: 12, color: DANGER, marginTop: 6 }}>{loc.error}</div>}
          </div>

          {/* Reporter */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 16, border: `1px solid ${BORDER_LIGHT}` }}>
            <label style={lbl}>Your name (optional)</label>
            <input style={inp} placeholder="Arun Kumar" value={form.reporter_name} onChange={set('reporter_name')} />
            <label style={lbl}>Notes</label>
            <textarea style={{ ...inp, height: 72, resize: 'none' }} placeholder="Any other observations..." value={form.notes} onChange={set('notes')} />
          </div>

          {saveError && <div style={{ background: '#fff0f0', border: `1px solid ${DANGER}40`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: DANGER }}>{saveError}</div>}

          <button onClick={handleSubmit} disabled={saving}
            style={{ width: '100%', padding: 14, background: saving ? '#aaa' : PRIMARY, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer', marginBottom: 24 }}>
            {saving ? 'Saving...' : 'Submit Report →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Lost Pet Form ────────────────────────────────────────────────────────
  if (reportType === 'lost_pet') return (
    <div style={{ background: BG_SCREEN, minHeight: '100dvh' }}>
      <AppHeader title="Report a Lost Pet" subtitle="Step 1 · Pet & owner details" back="Back" onBack={() => setReportType('stray')} />

      <div style={{ padding: '16px 14px' }}>
        <div style={{ background: `${PRIMARY}12`, border: `1px solid ${PRIMARY}40`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: PRIMARY_DARK }}>
          Fill in your pet's details. Rescuers nearby will be able to see this and contact you.
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: `1px solid ${BORDER_LIGHT}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pet Details</div>
          <label style={lbl}>Pet name</label>
          <input style={inp} placeholder="e.g. Bruno" value={lostForm.pet_name} onChange={setLost('pet_name')} />
          <label style={lbl}>Breed</label>
          <input style={inp} placeholder="e.g. Labrador, Indian Pariah..." value={lostForm.breed} onChange={setLost('breed')} />
          <label style={lbl}>Colour</label>
          <select style={inp} value={lostForm.color} onChange={setLost('color')}>
            <option value="">Select colour</option>
            {COLORS.map(c => <option key={c}>{c}</option>)}
          </select>
          <label style={lbl}>Size</label>
          <select style={inp} value={lostForm.size} onChange={setLost('size')}>
            {SIZES.map(s => <option key={s}>{s}</option>)}
          </select>
          <label style={lbl}>Sex</label>
          <select style={inp} value={lostForm.sex} onChange={setLost('sex')}>
            {SEXES.map(s => <option key={s}>{s}</option>)}
          </select>
          <label style={lbl}>Age</label>
          <select style={inp} value={lostForm.age} onChange={setLost('age')}>
            {AGES.map(a => <option key={a}>{a}</option>)}
          </select>
          <label style={lbl}>Date last seen</label>
          <input type="date" style={inp} value={lostForm.date_lost} onChange={setLost('date_lost')} />
          <label style={lbl}>Notes <span style={{ fontWeight: 400, color: TEXT_SECONDARY }}>— collar colour, markings, etc.</span></label>
          <textarea style={{ ...inp, height: 72, resize: 'none' }} placeholder="e.g. blue collar with name tag, scar on left ear..." value={lostForm.notes} onChange={setLost('notes')} />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: `1px solid ${BORDER_LIGHT}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Contact</div>
          <label style={lbl}>Your name</label>
          <input style={inp} placeholder="Riya Sharma" value={lostForm.reporter_name} onChange={setLost('reporter_name')} />
          <label style={lbl}>Phone number <span style={{ fontWeight: 400, color: TEXT_SECONDARY }}>— so rescuers can reach you</span></label>
          <input type="tel" style={inp} placeholder="98765 43210" value={lostForm.owner_phone} onChange={setLost('owner_phone')} />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: `1px solid ${BORDER_LIGHT}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Photo <span style={{ fontWeight: 400, color: TEXT_SECONDARY, textTransform: 'none' }}>— optional</span></div>
          <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleGalleryFiles} />
          {photos.length === 0 ? (
            <button onClick={() => galleryRef.current?.click()}
              style={{ width: '100%', padding: 10, background: BG_SCREEN, border: `1.5px dashed ${BORDER_LIGHT}`, borderRadius: 8, fontSize: 14, color: TEXT_SECONDARY, cursor: 'pointer' }}>
              + Add a photo of your pet
            </button>
          ) : (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={photos[0].preview} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              <button onClick={() => setPhotos([])}
                style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: `1px solid ${BORDER_LIGHT}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Known Location</div>
          {loc.lat ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{loc.area}, {loc.city}</div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 3 }}>{loc.lat.toFixed(5)}°N, {loc.lng.toFixed(5)}°E</div>
            </div>
          ) : (
            <button onClick={fetchLocation} disabled={locLoading}
              style={{ width: '100%', padding: 10, background: `${PRIMARY}10`, border: `1.5px solid ${PRIMARY}40`, borderRadius: 8, fontSize: 14, color: PRIMARY, fontWeight: 600, cursor: locLoading ? 'default' : 'pointer' }}>
              {locLoading ? 'Getting location...' : '📍 Set last known location'}
            </button>
          )}
          {loc.error && <div style={{ fontSize: 12, color: DANGER, marginTop: 6 }}>{loc.error}</div>}
        </div>

        {saveError && <div style={{ background: '#fff0f0', border: `1px solid ${DANGER}40`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: DANGER }}>{saveError}</div>}

        <button onClick={handleLostPetSubmit} disabled={saving}
          style={{ width: '100%', padding: 14, background: saving ? '#aaa' : PRIMARY, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer', marginBottom: 24 }}>
          {saving ? 'Filing report...' : 'File Lost Pet Report →'}
        </button>
      </div>
    </div>
  )

  // ── Capture (stray) ──────────────────────────────────────────────────────
  return (
    <div style={{ background: BG_SCREEN, minHeight: '100dvh' }}>
      <div style={{ background: `linear-gradient(135deg, ${PRIMARY_DARK}, ${PRIMARY})`, padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>📷</span>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>Report a Dog</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>5 photos from different angles · AI analysis</div>
          </div>
        </div>
      </div>

      <input ref={galleryRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleGalleryFiles} />
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleCameraFile} />

      <div style={{ padding: '16px 14px' }}>
        {/* Report type toggle */}
        <div style={{ display: 'flex', background: BORDER_LIGHT, borderRadius: 10, padding: 3, marginBottom: 16 }}>
          {[['stray', '🐕 Report a Stray'], ['lost_pet', '🔍 Report a Lost Pet']].map(([key, label]) => (
            <button key={key} onClick={() => setReportType(key)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: reportType === key ? '#fff' : 'transparent', color: reportType === key ? '#1a1a18' : TEXT_SECONDARY, boxShadow: reportType === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Backend status */}
        <div style={{ background: backend === null ? BORDER_LIGHT : backend?.online ? `${SUCCESS}15` : '#fff0f0', border: `1px solid ${backend === null ? '#ddd' : backend?.online ? `${SUCCESS}40` : `${DANGER}40`}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {backend === null && <span style={{ color: TEXT_SECONDARY }}>⏳ Checking backend...</span>}
          {backend?.online && (
            <span style={{ color: SUCCESS, fontWeight: 600 }}>
              ✓ Model online — {backend.dogs_in_db} dogs in feature DB · {backend.feature_dim}-dim vectors
            </span>
          )}
          {backend && !backend.online && (
            <span style={{ color: DANGER, fontWeight: 600 }}>
              ✗ Backend offline — run <code style={{ background: '#ffe0e0', padding: '1px 5px', borderRadius: 4 }}>python app.py</code> in your terminal
            </span>
          )}
        </div>

        {captureMode === null && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>Take 5 photos from different angles</div>
              <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 6 }}>5 recommended · 1 minimum · AI predicts breed, colour & size</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <button onClick={() => { setCaptureMode('gallery'); setTimeout(() => galleryRef.current?.click(), 50) }}
                style={{ padding: '18px 12px', background: '#fff', border: `2px solid ${PRIMARY}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: PRIMARY, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                Upload from Gallery
              </button>
              <button onClick={() => setCaptureMode('camera')}
                style={{ padding: '18px 12px', background: PRIMARY, border: `2px solid ${PRIMARY}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#fff', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                Use Camera
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${BORDER_LIGHT}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Pipeline</div>
              {[
                ['1. YOLO v8',          'Detects and crops the dog from each photo'],
                ['2. Gemini AI',        'Analyses breed, colour, size, health & temperament'],
                ['3. MobileNetV2',      'Extracts 128-dim feature vector for matching'],
                ['4. Feature matching', 'Averaged vector checked against database'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 130, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: TEXT_SECONDARY }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {captureMode === 'gallery' && (
          <>
            {photos.length === 0 ? (
              <div onClick={() => galleryRef.current?.click()}
                style={{ border: `2px dashed ${PRIMARY}60`, borderRadius: 14, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: '#fff', marginBottom: 14 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🖼️</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>Select photos from gallery</div>
                <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 6 }}>Select up to 5 photos at once</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={p.preview} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                      <button onClick={() => removePhoto(i)}
                        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: photos.length >= 5 ? SUCCESS : TEXT_SECONDARY, marginBottom: 12, textAlign: 'center', fontWeight: 600 }}>
                  {photos.length} photo{photos.length !== 1 ? 's' : ''} added {photos.length < 5 ? '· 5 recommended' : '· Ready!'}
                </div>
                <button onClick={() => galleryRef.current?.click()}
                  style={{ width: '100%', padding: 11, background: '#fff', color: PRIMARY, border: `1.5px solid ${PRIMARY}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
                  + Add more photos
                </button>
                <button onClick={runAnalysis} disabled={!backend?.online}
                  style={{ width: '100%', padding: 14, background: backend?.online ? PRIMARY : '#aaa', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: backend?.online ? 'pointer' : 'not-allowed', marginBottom: 10 }}>
                  {backend?.online ? `Analyse ${photos.length} photo${photos.length !== 1 ? 's' : ''} →` : 'Backend offline'}
                </button>
              </>
            )}
            <button onClick={() => { setCaptureMode(null); setPhotos([]) }}
              style={{ width: '100%', padding: 11, background: '#fff', color: TEXT_SECONDARY, border: `1.5px solid ${BORDER_LIGHT}`, borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
          </>
        )}

        {captureMode === 'camera' && (
          <>
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={p.preview} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                    <button onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cameraStep < ANGLE_PROMPTS.length ? (
              <>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, justifyContent: 'center' }}>
                  {ANGLE_PROMPTS.map((_, i) => (
                    <div key={i} style={{ width: 28, height: 4, borderRadius: 2, background: i < photos.length ? PRIMARY : i === cameraStep ? `${PRIMARY}50` : BORDER_LIGHT, transition: 'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '20px 16px', marginBottom: 14, textAlign: 'center', border: `1px solid ${BORDER_LIGHT}` }}>
                  <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>
                    PHOTO {cameraStep + 1} OF {ANGLE_PROMPTS.length}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a18', marginBottom: 6 }}>{ANGLE_PROMPTS[cameraStep].label}</div>
                  <div style={{ fontSize: 14, color: TEXT_SECONDARY }}>{ANGLE_PROMPTS[cameraStep].hint}</div>
                </div>
                <button onClick={() => cameraRef.current?.click()}
                  style={{ width: '100%', padding: 14, background: PRIMARY, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
                  📷 Take Photo
                </button>
                <button onClick={() => setCameraStep(s => s + 1)}
                  style={{ width: '100%', padding: 11, background: '#fff', color: TEXT_SECONDARY, border: `1.5px solid ${BORDER_LIGHT}`, borderRadius: 10, fontSize: 14, cursor: 'pointer', marginBottom: 10 }}>
                  Skip this angle
                </button>
                {photos.length > 0 && (
                  <button onClick={runAnalysis} disabled={!backend?.online}
                    style={{ width: '100%', padding: 11, background: '#fff', color: backend?.online ? PRIMARY : '#aaa', border: `1.5px solid ${backend?.online ? PRIMARY : BORDER_LIGHT}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: backend?.online ? 'pointer' : 'not-allowed', marginBottom: 10 }}>
                    Done — Analyse {photos.length} photo{photos.length !== 1 ? 's' : ''}
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{ background: `${SUCCESS}12`, border: `1px solid ${SUCCESS}40`, borderRadius: 12, padding: '12px 14px', marginBottom: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: SUCCESS }}>All angles captured!</div>
                  <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 }}>{photos.length} photo{photos.length !== 1 ? 's' : ''} ready for analysis</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={p.preview} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                      <button onClick={() => removePhoto(i)}
                        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={runAnalysis} disabled={!backend?.online || photos.length === 0}
                  style={{ width: '100%', padding: 14, background: backend?.online && photos.length > 0 ? PRIMARY : '#aaa', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: backend?.online && photos.length > 0 ? 'pointer' : 'not-allowed', marginBottom: 10 }}>
                  {backend?.online ? `Analyse ${photos.length} photo${photos.length !== 1 ? 's' : ''} →` : 'Backend offline'}
                </button>
              </>
            )}

            <button onClick={() => { setCaptureMode(null); setPhotos([]); setCameraStep(0) }}
              style={{ width: '100%', padding: 11, background: '#fff', color: TEXT_SECONDARY, border: `1.5px solid ${BORDER_LIGHT}`, borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
