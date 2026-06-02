import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { compressAndEncode } from '../lib/imageUtils'
import { analyzeImageBatch, checkBackend, ANGLE_PROMPTS } from '../lib/vision'
import { colors, fonts, spacing, radius, shadows, layout } from '../lib/theme'
import Header from '../components/Header'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Icon from '../components/Icon'

export default function ScanScreen() {
  const navigation = useNavigation()
  const [backend, setBackend] = useState(null)
  const [photos, setPhotos] = useState([])
  const [step, setStep] = useState('idle')
  const [cameraStep, setCameraStep] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { checkBackend().then(setBackend) }, [])

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') { setError('Camera permission required'); return }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    if (!result.canceled && result.assets?.[0]) {
      const compressed = await compressAndEncode(result.assets[0].uri)
      setPhotos(prev => [...prev, compressed])
      setCameraStep(prev => prev + 1)
    }
  }

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8, selectionLimit: 5,
    })
    if (!result.canceled && result.assets) {
      const compressed = await Promise.all(result.assets.slice(0, 5).map(a => compressAndEncode(a.uri)))
      setPhotos(prev => [...prev, ...compressed].slice(0, 5))
    }
  }

  const removePhoto = (idx) => setPhotos(p => p.filter((_, i) => i !== idx))

  const runAnalysis = async () => {
    if (photos.length === 0) return
    setStep('analyzing'); setError('')
    const result = await analyzeImageBatch(photos)
    setAnalysis(result)
    if (result.error) { setError(result.error); setStep('idle'); return }
    if (result.is_dog) { setStep('result') }
    else { setError(result.message || 'No dog detected'); setStep('idle') }
  }

  const reset = () => { setPhotos([]); setStep('idle'); setCameraStep(0); setAnalysis(null); setError('') }

  // ── Analyzing ──
  if (step === 'analyzing') return (
    <View style={styles.centerWrap}>
      <View style={styles.analyzePhotoRow}>
        {photos.slice(0, 5).map((p, i) => (
          <Image key={i} source={{ uri: p.preview }} style={styles.analyzeThumb} />
        ))}
      </View>
      <View style={styles.pulseRing}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      <Text style={styles.analyzeTitle}>Analysing {photos.length} photo{photos.length !== 1 ? 's' : ''}</Text>
      <View style={styles.pipelineSteps}>
        {[
          { icon: 'target', label: 'Detecting dog' },
          { icon: 'breed', label: 'Classifying breed' },
          { icon: 'search', label: 'Matching features' },
        ].map((s, i) => (
          <View key={i} style={styles.pipelineStep}>
            <Icon name={s.icon} size={14} color={colors.textSecondary} />
            <Text style={styles.pipelineText}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )

  // ── Result → navigate ──
  if (step === 'result' && analysis) {
    if (analysis.match_found && analysis.match_id) {
      navigation.navigate('Dog', { dogId: analysis.match_id }); reset(); return null
    }
    navigation.navigate('Report', {
      analysis, photos: photos.map(p => ({ b64: p.b64, mime: p.mime, preview: p.preview })),
    })
    reset(); return null
  }

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Header title="Scan a Dog" subtitle="Camera → AI → Dog Passport" />

      <View style={styles.content}>
        {/* Backend status */}
        <Card variant={backend?.online ? 'accent' : backend === null ? 'glass' : 'danger'}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: backend?.online ? colors.success : backend === null ? colors.textMuted : colors.danger }]} />
            <Text style={[styles.statusText, {
              color: backend?.online ? colors.success : backend === null ? colors.textMuted : colors.danger,
            }]}>
              {backend === null ? 'Connecting to AI...' : backend?.online ? `AI online · ${backend.dogs_in_db} dogs in DB` : 'AI offline'}
            </Text>
          </View>
        </Card>

        {/* Photo thumbnails */}
        {photos.length > 0 && (
          <View style={styles.photosGrid}>
            {photos.map((p, i) => (
              <View key={i} style={styles.photoWrap}>
                <Image source={{ uri: p.preview }} style={styles.photoThumb} />
                <Pressable onPress={() => removePhoto(i)} style={styles.removeBtn}>
                  <Icon name="close" size={11} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Camera angle prompt */}
        {step === 'capturing' && cameraStep < ANGLE_PROMPTS.length && (
          <Card variant="elevated" style={styles.promptCard}>
            <View style={styles.progressDots}>
              {ANGLE_PROMPTS.map((_, i) => (
                <View key={i} style={[styles.dot, {
                  backgroundColor: i < photos.length ? colors.primary : i === cameraStep ? colors.primaryLight : colors.bgInput,
                  width: i === cameraStep ? 24 : 8,
                }]} />
              ))}
            </View>
            <Text style={styles.promptStep}>PHOTO {cameraStep + 1} OF {ANGLE_PROMPTS.length}</Text>
            <Text style={styles.promptLabel}>{ANGLE_PROMPTS[cameraStep].label}</Text>
            <Text style={styles.promptHint}>{ANGLE_PROMPTS[cameraStep].hint}</Text>
          </Card>
        )}

        {/* Idle — no photos */}
        {step === 'idle' && photos.length === 0 && (
          <>
            <View style={styles.heroSection}>
              <View style={styles.heroCircle}>
                <Icon name="camera" size={48} color={colors.primary} />
              </View>
              <Text style={styles.heroTitle}>Point your camera at a dog</Text>
              <Text style={styles.heroSub}>AI identifies breed & generates{'\n'}a unique Dog Passport</Text>
            </View>

            <View style={styles.buttonRow}>
              <Pressable onPress={() => { setStep('capturing'); takePhoto() }}
                style={({ pressed }) => [styles.cameraBtn, pressed && styles.pressed]}>
                <Icon name="camera" size={28} color={colors.white} />
                <Text style={styles.cameraBtnLabel}>Camera</Text>
              </Pressable>
              <Pressable onPress={pickFromGallery}
                style={({ pressed }) => [styles.galleryBtn, pressed && styles.pressed]}>
                <Icon name="gallery" size={28} color={colors.primary} />
                <Text style={styles.galleryBtnLabel}>Gallery</Text>
              </Pressable>
            </View>

            {/* How it works */}
            <Card variant="glass" style={{ marginTop: spacing.xl }}>
              <Text style={styles.howTitle}>HOW IT WORKS</Text>
              {[
                { icon: 'camera', title: 'Take 1-5 photos', sub: 'Multiple angles = better accuracy' },
                { icon: 'ai', title: 'AI analyses', sub: 'YOLO + MobileNetV2 classification' },
                { icon: 'passport', title: 'Get passport', sub: 'Unique ID with QR code' },
              ].map((item, i) => (
                <View key={i} style={styles.howStep}>
                  <View style={styles.howIcon}><Icon name={item.icon} size={18} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.howStepTitle}>{item.title}</Text>
                    <Text style={styles.howStepSub}>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Capturing */}
        {step === 'capturing' && (
          <View style={{ gap: spacing.sm }}>
            <Button title="Take Photo" onPress={takePhoto} size="lg" />
            {cameraStep < ANGLE_PROMPTS.length && (
              <Button title="Skip this angle" onPress={() => setCameraStep(s => s + 1)} variant="glass" />
            )}
            {photos.length > 0 && (
              <Button title={backend?.online ? `Analyse ${photos.length} photo${photos.length !== 1 ? 's' : ''}` : 'Offline'}
                onPress={runAnalysis} disabled={!backend?.online} variant="secondary" size="lg" />
            )}
            <Button title="Start over" onPress={reset} variant="soft" />
          </View>
        )}

        {/* Has photos, idle */}
        {step === 'idle' && photos.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <Text style={styles.photoCount}>{photos.length} photo{photos.length !== 1 ? 's' : ''} ready</Text>
            <View style={styles.buttonRow}>
              <Pressable onPress={takePhoto} style={[styles.galleryBtn, { flex: 1 }]}>
                <Text style={styles.galleryBtnLabel}>+ Add</Text>
              </Pressable>
              <Pressable onPress={runAnalysis} disabled={!backend?.online}
                style={[styles.cameraBtn, { flex: 2 }, !backend?.online && { opacity: 0.5 }]}>
                <Text style={styles.cameraBtnLabel}>Analyse</Text>
              </Pressable>
            </View>
            <Button title="Clear all" onPress={reset} variant="soft" />
          </View>
        )}

        {error ? <Card variant="danger" style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.danger, fontSize: fonts.sm }}>{error}</Text>
        </Card> : null}

        <View style={{ height: spacing.huge }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  content: { padding: layout.screenPadding },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: fonts.sm, fontWeight: fonts.semibold },

  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  photoWrap: { position: 'relative' },
  photoThumb: { width: 72, height: 72, borderRadius: radius.sm },
  removeBtn: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold },

  promptCard: { alignItems: 'center', paddingVertical: spacing.xxl },
  progressDots: { flexDirection: 'row', gap: 6, marginBottom: spacing.lg },
  dot: { height: 4, borderRadius: 2 },
  promptStep: { fontSize: fonts.xs, color: colors.textMuted, fontWeight: fonts.bold, letterSpacing: 1, marginBottom: spacing.sm },
  promptLabel: { fontSize: fonts.xl, fontWeight: fonts.black, color: colors.text },
  promptHint: { fontSize: fonts.base, color: colors.textSecondary, marginTop: 4 },

  heroSection: { alignItems: 'center', paddingVertical: spacing.xxxl },
  heroCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl, borderWidth: 2, borderColor: colors.primary + '40',
  },
  heroTitle: { fontSize: fonts.lg, fontWeight: fonts.black, color: colors.text, textAlign: 'center' },
  heroSub: { fontSize: fonts.base, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },

  buttonRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  cameraBtn: {
    flex: 1, padding: spacing.xl, backgroundColor: colors.primary,
    borderRadius: radius.lg, alignItems: 'center', ...shadows.glow,
  },
  cameraBtnLabel: { color: colors.white, fontSize: fonts.base, fontWeight: fonts.bold, marginTop: 4 },
  galleryBtn: {
    flex: 1, padding: spacing.xl, backgroundColor: colors.bgCard,
    borderRadius: radius.lg, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
  },
  galleryBtnLabel: { color: colors.primary, fontSize: fonts.base, fontWeight: fonts.bold, marginTop: 4 },

  photoCount: { textAlign: 'center', fontSize: fonts.base, color: colors.success, fontWeight: fonts.semibold, marginBottom: spacing.md },

  howTitle: { fontSize: fonts.xs, fontWeight: fonts.bold, color: colors.textMuted, letterSpacing: 1, marginBottom: spacing.lg },
  howStep: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  howIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  howStepTitle: { fontSize: fonts.base, fontWeight: fonts.semibold, color: colors.text },
  howStepSub: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 1 },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, backgroundColor: colors.bgScreen },
  analyzePhotoRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: spacing.xl },
  analyzeThumb: { width: 64, height: 64, borderRadius: radius.sm },
  pulseRing: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
  },
  analyzeTitle: { fontSize: fonts.lg, fontWeight: fonts.bold, color: colors.text },
  pipelineSteps: { marginTop: spacing.xl, gap: spacing.md },
  pipelineStep: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
  },
  pipelineText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: fonts.medium },
})
