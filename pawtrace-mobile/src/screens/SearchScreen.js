import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { compressAndEncode } from '../lib/imageUtils'
import { searchDogs, getLocation, BREEDS, COLORS, SIZES } from '../lib/vision'
import { colors, fonts, spacing, radius, shadows, layout } from '../lib/theme'
import { timeAgo } from '../lib/helpers'
import Header from '../components/Header'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import ChipSelect from '../components/ChipSelect'
import Icon from '../components/Icon'

function simColor(pct) {
  if (pct >= 80) return colors.success
  if (pct >= 60) return colors.accent
  return colors.danger
}

function MatchCard({ match, onView, onClaim }) {
  const isLost = match.report_type === 'lost_pet'
  return (
    <Card variant="elevated" style={styles.matchCard}>
      <View style={styles.matchRow}>
        <View style={styles.matchThumb}>
          {match.photo_url ? (
            <Image source={{ uri: match.photo_url }} style={styles.matchImage} />
          ) : (
            <View style={styles.matchPlaceholder}>
              <Icon name={isLost ? 'search' : 'dog'} size={30} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchName} numberOfLines={1}>
              {isLost ? (match.pet_name || 'Unknown') : match.dog_id}
            </Text>
            <Badge
              label={`${match.similarity}%`}
              color="#fff"
              bg={simColor(match.similarity)}
              size="sm"
            />
            {isLost && (
              <Badge label="LOST" color="#fff" bg={colors.danger} size="sm" />
            )}
          </View>
          <Text style={styles.matchBreed}>{match.breed} · {match.color}</Text>
          <View style={styles.matchMeta}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Icon name="pin" size={10} color={colors.textMuted} />
              <Text style={styles.matchMetaText}>{match.area || 'Unknown'}</Text>
            </View>
            {match.distance_km != null && (
              <Badge
                label={`${match.distance_km} km`}
                color={colors.secondary}
                bg={colors.secondary + '15'}
                size="sm"
              />
            )}
          </View>
        </View>
      </View>
      <View style={styles.matchActions}>
        <Pressable
          onPress={onClaim}
          style={({ pressed }) => [styles.claimBtn, pressed && { opacity: 0.85 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="paw" size={13} color={colors.primary} />
            <Text style={styles.claimBtnText}>This is my dog!</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={onView}
          style={({ pressed }) => [styles.viewProfileBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.viewProfileBtnText}>View Profile</Text>
        </Pressable>
      </View>
    </Card>
  )
}

export default function SearchScreen() {
  const navigation = useNavigation()
  const [step, setStep] = useState('upload')
  const [photos, setPhotos] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({ breed: '', color: '', size: '', report_type: '' })
  const [location, setLocation] = useState({ lat: null, lng: null })
  const [locLoading, setLocLoading] = useState(true)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { fetchLocation() }, [])

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 3 - photos.length,
    })
    if (!result.canceled && result.assets) {
      const compressed = await Promise.all(result.assets.map(a => compressAndEncode(a.uri)))
      setPhotos(prev => [...prev, ...compressed].slice(0, 3))
    }
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

  // ── Searching ──
  if (step === 'searching') return (
    <View style={styles.centerWrap}>
      <View style={styles.searchPhotoRow}>
        {photos.map((p, i) => (
          <Image key={i} source={{ uri: p.preview }} style={styles.searchThumb} />
        ))}
      </View>
      <View style={styles.pulseRing}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
      <Text style={styles.searchingTitle}>Searching database...</Text>
      <View style={styles.pipelineSteps}>
        {[
          { icon: 'breed', label: 'Extracting features' },
          { icon: 'stats', label: 'Computing similarity' },
          { icon: 'pin', label: 'Ranking by distance' },
        ].map((s, i) => (
          <View key={i} style={styles.pipelineStep}>
            <Icon name={s.icon} size={14} color={colors.textSecondary} />
            <Text style={styles.pipelineText}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )

  // ── Results ──
  if (step === 'results' && results) return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        title="Search Results"
        subtitle={`${results.matches.length} match${results.matches.length !== 1 ? 'es' : ''} · ${results.candidates_checked} dogs checked`}
        back="Search again"
        onBack={reset}
        variant="teal"
      />

      <View style={styles.content}>
        {results.matches.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCircle}>
              <Icon name="paw" size={48} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>
              {results.photos_processed === 0 ? 'No dog detected' : 'No matches found'}
            </Text>
            <Text style={styles.emptySub}>
              {results.photos_processed === 0
                ? 'Make sure there is a dog clearly visible in the photo.'
                : 'Try different photos or adjust your filters for better results.'}
            </Text>
            <Button title="Search again" onPress={reset} variant="primary" size="lg" />
          </View>
        ) : (
          <>
            {/* Results summary */}
            <Card variant="teal" style={{ marginBottom: spacing.md }}>
              <View style={styles.resultsSummaryRow}>
                <View style={styles.resultsSummaryIcon}>
                  <Icon name="star" size={18} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultsSummaryTitle}>
                    {results.matches.length} potential match{results.matches.length !== 1 ? 'es' : ''}
                  </Text>
                  <Text style={styles.resultsSummarySub}>
                    Sorted by visual similarity
                  </Text>
                </View>
              </View>
            </Card>

            {results.matches.map(match => (
              <MatchCard
                key={match.id || match.dog_id}
                match={match}
                onView={() => navigation.navigate('Dog', { dogId: match.id })}
                onClaim={() => navigation.navigate('Dog', { dogId: match.id })}
              />
            ))}
          </>
        )}

        <View style={{ height: spacing.huge }} />
      </View>
    </ScrollView>
  )

  // ── Upload ──
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Search by Photo" subtitle="AI visual similarity · up to 3 photos" variant="teal" />

      <View style={styles.content}>
        {/* Photo upload card */}
        <Card variant="elevated">
          <Text style={styles.sectionLabel}>PHOTOS OF THE DOG</Text>
          <Text style={styles.uploadHint}>Upload 1-3 clear photos for best results</Text>

          {photos.length > 0 && (
            <View style={styles.photosGrid}>
              {photos.map((p, i) => (
                <View key={i} style={styles.photoWrap}>
                  <Image source={{ uri: p.preview }} style={styles.photoThumb} />
                  <Pressable onPress={() => removePhoto(i)} style={styles.removeBtn}>
                    <Icon name="close" size={11} color="#fff" />
                  </Pressable>
                  <Badge label={`#${i + 1}`} color="#fff" bg="rgba(0,0,0,0.5)" size="xs"
                    style={{ position: 'absolute', bottom: 4, left: 4 }} />
                </View>
              ))}
            </View>
          )}

          {photos.length < 3 && (
            <Pressable
              onPress={pickPhotos}
              style={({ pressed }) => [styles.uploadArea, pressed && { opacity: 0.85 }]}
            >
              <Icon name="camera" size={28} color={colors.secondary} />
              <Text style={styles.uploadAreaText}>
                {photos.length === 0 ? 'Tap to upload photos' : 'Add more photos'}
              </Text>
              <Text style={styles.uploadAreaHint}>
                {photos.length === 0 ? 'Pick from gallery' : `${3 - photos.length} more allowed`}
              </Text>
            </Pressable>
          )}
        </Card>

        {/* Location card */}
        <Card variant={location.lat ? 'success' : 'flat'}>
          <View style={styles.locationRow}>
            <View style={[styles.locationIcon, {
              backgroundColor: location.lat ? colors.success + '20' : colors.textMuted + '15',
            }]}>
              <Icon name="pin" size={18} color={location.lat ? colors.success : colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Location</Text>
              {locLoading ? (
                <Text style={styles.locationStatus}>Getting your location...</Text>
              ) : location.lat ? (
                <Text style={[styles.locationStatus, { color: colors.success }]}>
                  Searching within 10 km radius
                </Text>
              ) : (
                <View>
                  <Text style={styles.locationStatus}>Location unavailable</Text>
                  <Pressable onPress={fetchLocation} style={styles.locationRetryBtn}>
                    <Text style={styles.locationRetryText}>Try again</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Filters card */}
        <Card variant="flat">
          <Pressable
            onPress={() => setFiltersOpen(o => !o)}
            style={styles.filterToggle}
          >
            <View style={styles.filterToggleLeft}>
              <Icon name="filter" size={16} color={colors.textSecondary} />
              <Text style={styles.filterToggleLabel}>Filters</Text>
              <Badge label="optional" color={colors.textMuted} bg={colors.textMuted + '15'} size="xs" />
            </View>
            <Text style={styles.filterChevron}>{filtersOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {filtersOpen && (
            <View style={styles.filtersContent}>
              <ChipSelect
                label="Report type"
                options={[
                  { value: '', label: 'All' },
                  { value: 'stray', label: 'Stray' },
                  { value: 'lost_pet', label: 'Lost' },
                ]}
                value={filters.report_type}
                onChange={v => setFilters(f => ({ ...f, report_type: v }))}
              />
            </View>
          )}
        </Card>

        {/* Error */}
        {error ? (
          <Card variant="danger">
            <Text style={{ color: colors.danger, fontSize: fonts.sm, fontWeight: fonts.medium }}>
              {error}
            </Text>
          </Card>
        ) : null}

        {/* Search button */}
        <Button
          title={photos.length === 0
            ? 'Upload a photo to search'
            : `Search with ${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
          onPress={handleSearch}
          disabled={photos.length === 0}
          variant={photos.length > 0 ? 'secondary' : 'soft'}
          size="lg"
        />

        {/* How it works (when no photos) */}
        {photos.length === 0 && (
          <Card variant="flat" style={{ marginTop: spacing.lg }}>
            <Text style={styles.howTitle}>How search works</Text>
            {[
              { icon: 'camera', title: 'Upload photos', sub: 'Clear, well-lit photos of the dog' },
              { icon: 'breed', title: 'Feature extraction', sub: 'AI extracts visual features for matching' },
              { icon: 'stats', title: 'Find matches', sub: 'Similar dogs ranked by visual similarity' },
            ].map((item, i) => (
              <View key={i} style={styles.howStep}>
                <View style={styles.howIcon}><Icon name={item.icon} size={20} color={colors.secondary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.howStepTitle}>{item.title}</Text>
                  <Text style={styles.howStepSub}>{item.sub}</Text>
                </View>
                {i < 2 && <View style={styles.howConnector} />}
              </View>
            ))}
          </Card>
        )}

        <View style={{ height: spacing.huge }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg },

  // ── Section labels ──
  sectionLabel: {
    fontSize: fonts.xs, fontWeight: fonts.bold, color: colors.textMuted,
    letterSpacing: 1, marginBottom: spacing.xs,
  },
  uploadHint: {
    fontSize: fonts.sm, color: colors.secondary, fontWeight: fonts.medium,
    marginBottom: spacing.lg,
  },

  // ── Photos ──
  photosGrid: {
    flexDirection: 'row', gap: spacing.sm,
    marginBottom: spacing.lg, flexWrap: 'wrap',
  },
  photoWrap: { position: 'relative' },
  photoThumb: { width: 88, height: 88, borderRadius: radius.md },
  removeBtn: {
    position: 'absolute', top: -4, right: -4, width: 22, height: 22,
    borderRadius: 11, backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold },

  // ── Upload area ──
  uploadArea: {
    width: '100%', paddingVertical: spacing.xxl,
    backgroundColor: colors.infoSoft,
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.secondary + '50',
    borderRadius: radius.lg, alignItems: 'center',
  },
  uploadAreaText: {
    fontSize: fonts.base, color: colors.secondary,
    fontWeight: fonts.bold, marginTop: spacing.sm,
  },
  uploadAreaHint: {
    fontSize: fonts.xs, color: colors.textMuted, marginTop: spacing.xs,
  },

  // ── Location ──
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  locationIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  locationLabel: {
    fontSize: fonts.xs, fontWeight: fonts.semibold, color: colors.textMuted,
    letterSpacing: 0.3,
  },
  locationStatus: {
    fontSize: fonts.sm, fontWeight: fonts.semibold, color: colors.textSecondary,
    marginTop: 2,
  },
  locationRetryBtn: {
    backgroundColor: colors.secondary + '10', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: colors.secondary + '25',
    alignSelf: 'flex-start', marginTop: spacing.sm,
  },
  locationRetryText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: colors.secondary },

  // ── Filters ──
  filterToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  filterToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  filterToggleLabel: {
    fontSize: fonts.sm, fontWeight: fonts.bold, color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  filterChevron: { fontSize: fonts.sm, color: colors.textMuted },
  filtersContent: { marginTop: spacing.lg },

  // ── Center (searching) ──
  centerWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xxxl, backgroundColor: colors.bgScreen,
  },
  searchPhotoRow: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
    justifyContent: 'center', marginBottom: spacing.xl,
  },
  searchThumb: { width: 72, height: 72, borderRadius: radius.md, ...shadows.sm },
  pulseRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.infoSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
  },
  searchingTitle: { fontSize: fonts.lg, fontWeight: fonts.bold, color: colors.text },
  pipelineSteps: { marginTop: spacing.xl, gap: spacing.md },
  pipelineStep: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill, ...shadows.sm,
  },
  pipelineText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: fonts.medium },

  // ── Empty results ──
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 3, borderColor: colors.accent + '30',
  },
  emptyTitle: {
    fontSize: fonts.lg, fontWeight: fonts.black, color: colors.text,
    textAlign: 'center', marginBottom: spacing.sm,
  },
  emptySub: {
    fontSize: fonts.base, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 22, maxWidth: 280,
    marginBottom: spacing.xxl,
  },

  // ── Results summary ──
  resultsSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resultsSummaryIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.secondary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  resultsSummaryTitle: { fontWeight: fonts.bold, fontSize: fonts.base, color: colors.secondary },
  resultsSummarySub: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 1 },

  // ── Match card ──
  matchCard: { marginBottom: spacing.md },
  matchRow: { flexDirection: 'row', gap: spacing.md },
  matchThumb: {
    width: 72, height: 72, borderRadius: radius.lg,
    overflow: 'hidden',
  },
  matchImage: { width: '100%', height: '100%' },
  matchPlaceholder: {
    width: '100%', height: '100%', backgroundColor: colors.bgSection,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  matchHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    flexWrap: 'wrap', marginBottom: spacing.xs,
  },
  matchName: { fontWeight: fonts.bold, fontSize: fonts.base, color: colors.text },
  matchBreed: { fontSize: fonts.sm, color: colors.textSecondary },
  matchMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  matchMetaText: { fontSize: fonts.xs, color: colors.textMuted },
  matchActions: {
    flexDirection: 'row', gap: spacing.sm,
    marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  claimBtn: {
    flex: 1, paddingVertical: spacing.sm + 2,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary + '30',
  },
  claimBtnText: { fontSize: fonts.sm, fontWeight: fonts.bold, color: colors.primary },
  viewProfileBtn: {
    flex: 1, paddingVertical: spacing.sm + 2,
    backgroundColor: colors.secondary, borderRadius: radius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  viewProfileBtnText: { fontSize: fonts.sm, fontWeight: fonts.bold, color: '#fff' },

  // ── How it works ──
  howTitle: {
    fontSize: fonts.sm, fontWeight: fonts.bold, color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: spacing.lg,
  },
  howStep: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.lg, position: 'relative',
  },
  howIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.infoSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  howStepTitle: { fontSize: fonts.base, fontWeight: fonts.semibold, color: colors.text },
  howStepSub: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 1 },
  howConnector: {
    position: 'absolute', left: 19, top: 42, width: 2, height: 16,
    backgroundColor: colors.border,
  },
})
