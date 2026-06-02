import React, { useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { compressAndEncode } from '../lib/imageUtils'
import { analyzeImageBatch, saveFeature, getLocation, reverseGeocode, checkBackend } from '../lib/vision'
import { addDog, updateDog } from '../lib/data'
import { supabase, isDemoMode } from '../lib/supabase'
import { useApp } from '../context/AppContext'

import CaptureStep from './report/CaptureStep'
import AnalyzingStep from './report/AnalyzingStep'
import ReviewStep from './report/ReviewStep'
import LostPetForm from './report/LostPetForm'
import SuccessStep from './report/SuccessStep'

export default function ReportScreen({ route }) {
  const { user, profile } = useApp()
  const navigation = useNavigation()

  // Pre-filled from ScanScreen
  const prefilled = route?.params?.analysis || null
  const prefilledPhotos = route?.params?.photos || []

  const [backend, setBackend] = useState(null)
  const [step, setStep] = useState(prefilled ? 'review' : 'capture')
  const [reportType, setReportType] = useState('stray')
  const [photos, setPhotos] = useState(prefilledPhotos)
  const [analysis, setAnalysis] = useState(prefilled)
  const [loc, setLoc] = useState({ lat: null, lng: null, area: '', city: '', accuracy: null, error: null })
  const [locLoading, setLocLoading] = useState(false)
  const [form, setForm] = useState({
    reporter_name: profile?.name || '', notes: '', sex: 'unknown',
    age: 'adult (1.5-7 yr)', injured: false, injury_notes: '',
    vaccinated: false, vaccination_notes: '',
    color: prefilled?.color || '', size: prefilled?.size || 'medium',
  })
  const [lostForm, setLostForm] = useState({
    pet_name: '', reporter_name: profile?.name || '', owner_phone: '',
    breed: '', color: '', size: 'medium', sex: 'unknown',
    age: 'adult (1.5-7 yr)', date_lost: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => { checkBackend().then(setBackend) }, [])
  useEffect(() => { if (prefilled) fetchLocation() }, [])

  // ── Photo actions ──

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true, quality: 0.8, selectionLimit: 5,
    })
    if (!result.canceled && result.assets) {
      const compressed = await Promise.all(result.assets.slice(0, 5).map(a => compressAndEncode(a.uri)))
      setPhotos(prev => [...prev, ...compressed])
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') return
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    if (!result.canceled && result.assets?.[0]) {
      const compressed = await compressAndEncode(result.assets[0].uri)
      setPhotos(prev => [...prev, compressed])
    }
  }

  const removePhoto = (idx) => setPhotos(p => p.filter((_, i) => i !== idx))

  // ── Location ──

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

  // ── Analysis ──

  const runAnalysis = async () => {
    setStep('analyzing')
    const [result] = await Promise.all([
      analyzeImageBatch(photos),
      loc.lat ? Promise.resolve() : fetchLocation(),
    ])
    setAnalysis(result)
    if (result.is_dog) {
      setForm(f => ({ ...f, color: result.color ?? f.color, size: result.size ?? f.size }))
    }
    setStep('review')
  }

  // ── Photo upload ──

  const uploadPhoto = async (photo, newDog) => {
    if (isDemoMode || !supabase) return
    try {
      const binaryString = atob(photo.b64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'image/jpeg' })
      const path = (newDog.dog_id || newDog.id) + '.jpg'
      await supabase.storage.from('dog-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(path)
      await updateDog(newDog.id, { photo_url: urlData.publicUrl })
    } catch (e) {
      console.error('Photo upload failed:', e)
    }
  }

  // ── Submit handlers ──

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
    if (photos.length > 0 && newDog) await uploadPhoto(photos[0], newDog)
    setSaving(false)
    setStep('success')
  }

  const handleLostPetSubmit = async () => {
    if (!lostForm.pet_name && !lostForm.breed) { setSaveError('Please provide at least a pet name or breed.'); return }
    setSaving(true); setSaveError('')
    if (!loc.lat) await fetchLocation()
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
    setStep('capture'); setPhotos([]); setAnalysis(null); setReportType('stray'); setSaveError('')
    setLoc({ lat: null, lng: null, area: '', city: '', accuracy: null, error: null })
  }

  // ── Render ──

  if (step === 'success')
    return <SuccessStep reportType={reportType} onReset={resetCapture} onGoBack={() => navigation.goBack()} />

  if (step === 'analyzing')
    return <AnalyzingStep photos={photos} />

  if (step === 'review' && analysis)
    return <ReviewStep
      analysis={analysis} photos={photos} form={form} setForm={setForm}
      loc={loc} locLoading={locLoading} fetchLocation={fetchLocation}
      saving={saving} saveError={saveError}
      onSubmit={handleSubmit} onBack={() => setStep('capture')}
    />

  if (reportType === 'lost_pet')
    return <LostPetForm
      photos={photos} lostForm={lostForm} setLostForm={setLostForm}
      saving={saving} saveError={saveError}
      onSubmit={handleLostPetSubmit} onBack={() => setReportType('stray')}
      takePhoto={takePhoto} pickPhotos={pickPhotos} removePhoto={removePhoto}
    />

  return <CaptureStep
    reportType={reportType} setReportType={setReportType}
    backend={backend} photos={photos}
    takePhoto={takePhoto} pickPhotos={pickPhotos} removePhoto={removePhoto}
    onAnalyse={runAnalysis}
  />
}
