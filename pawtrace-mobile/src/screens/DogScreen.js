import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Alert, Linking, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'

let MapView = null
let Marker = null
if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps')
    MapView = maps.default
    Marker = maps.Marker
  } catch {}
}
import { getDog, deleteDog, updateDog, getDogs } from '../lib/data'
import { useApp } from '../context/AppContext'
import { colors, fonts, spacing, radius, shadows, layout, statusConfig } from '../lib/theme'
import { timeAgo } from '../lib/helpers'
import Header from '../components/Header'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { StatusPill, StatusSelector } from '../components/StatusPill'
import DogCard from '../components/DogCard'
import Icon from '../components/Icon'

export default function DogScreen({ route }) {
  const { dogId } = route?.params || {}
  const navigation = useNavigation()
  const { user } = useApp()
  const [dog, setDog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusSaved, setStatusSaved] = useState(false)
  const [matches, setMatches] = useState([])

  useEffect(() => {
    if (!dogId) { navigation.goBack(); return }
    getDog(dogId).then(({ data }) => {
      setDog(data); setStatus(data?.status || 'sighted'); setLoading(false)
    })
  }, [dogId])

  useEffect(() => {
    if (!dog) return
    const otherType = dog.report_type === 'lost_pet' ? 'stray' : 'lost_pet'
    getDogs({ report_type: otherType, city: dog.city }).then(({ data }) => {
      if (!data) return
      const filtered = data.filter(d => {
        const colorMatch = d.color && dog.color && d.color.toLowerCase().includes(dog.color.toLowerCase().split(' ')[0])
        const breedMatch = d.breed && dog.breed && d.breed.toLowerCase().includes(dog.breed.toLowerCase().split(' ')[0])
        return colorMatch || breedMatch
      })
      setMatches(filtered.slice(0, 5))
    })
  }, [dog])

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus); setStatusSaving(true)
    await updateDog(dog.id, { status: newStatus })
    setStatusSaving(false); setStatusSaved(true)
    setTimeout(() => setStatusSaved(false), 2000)
  }

  const handleDelete = () => {
    Alert.alert('Delete this record?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteDog(dogId); navigation.goBack() } },
    ])
  }

  if (loading) return (
    <View style={styles.centerWrap}><Icon name="paw" size={36} color={colors.primary} /><Text style={styles.loadingText}>Loading...</Text></View>
  )
  if (!dog) return (
    <View style={styles.centerWrap}>
      <Icon name="dog" size={48} color={colors.textMuted} />
      <Text style={styles.loadingText}>Dog not found</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} variant="primary" size="sm" style={{ width: 160 }} />
    </View>
  )

  const isLostPet = dog.report_type === 'lost_pet'
  const config = statusConfig[status] || statusConfig.sighted

  const attrs = [
    { icon: 'paw', k: 'Breed', v: dog.breed || '—' },
    { icon: 'color', k: 'Colour', v: dog.color || '—' },
    { icon: 'size', k: 'Size', v: dog.size || '—' },
    { icon: 'gender', k: 'Sex', v: dog.sex || '—' },
    { icon: 'age', k: 'Age', v: dog.age || '—' },
    { icon: 'vaccine', k: 'Vaccinated', v: dog.vaccinated ? 'Yes' : 'No' },
    ...(dog.confidence ? [{ icon: 'ai', k: 'AI Confidence', v: `${dog.confidence}%` }] : []),
    ...(isLostPet && dog.owner_phone ? [{ icon: 'call', k: 'Phone', v: dog.owner_phone }] : []),
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Dog Profile" back="Back" onBack={() => navigation.goBack()} variant="coral" />

      {/* Hero photo */}
      <View style={[styles.hero, { backgroundColor: isLostPet ? '#FFF0E8' : '#F0EBE6' }]}>
        {dog.photo_url ? (
          <Image source={{ uri: dog.photo_url }} style={styles.heroImg} />
        ) : (
          <Icon name={isLostPet ? 'search' : 'dog'} size={80} color={colors.textMuted} />
        )}
        <View style={styles.heroBadges}>
          <StatusPill status={status} size="md" />
          <Badge label={timeAgo(dog.created_at)} color="#fff" bg="rgba(0,0,0,0.45)" size="sm" />
        </View>
      </View>

      <View style={styles.content}>
        {/* Name + ID */}
        <View style={styles.nameSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dogName}>{isLostPet ? (dog.pet_name || 'Unknown') : dog.dog_id}</Text>
            <Text style={styles.dogId}>ID: {dog.dog_id} · {dog.breed}</Text>
          </View>
          {dog.confidence >= 70 && (
            <View style={styles.aiBadge}>
              <Icon name="ai" size={18} color={colors.success} />
              <Text style={styles.aiBadgeText}>AI Verified</Text>
            </View>
          )}
        </View>

        {/* Passport CTA */}
        <Pressable onPress={() => navigation.navigate('DogPassport', { dog })}
          style={({ pressed }) => [styles.passportCta, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
          <Icon name="passport" size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.passportCtaTitle}>View Dog Passport</Text>
            <Text style={styles.passportCtaSub}>Digital ID card with QR code</Text>
          </View>
          <Icon name="arrow" size={18} color={colors.accent} />
        </Pressable>

        {/* Attributes */}
        <View style={styles.attrsGrid}>
          {attrs.map((attr) => (
            <View key={attr.k} style={styles.attrCard}>
              <Icon name={attr.icon} size={14} color={colors.textSecondary} />
              <View>
                <Text style={styles.attrLabel}>{attr.k}</Text>
                <Text style={styles.attrValue}>{attr.v}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Health banners */}
        {dog.injured && (
          <Card variant="danger">
            <View style={styles.bannerRow}>
              <Icon name="warning" size={18} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: colors.danger }]}>Injuries observed</Text>
                {dog.injury_notes && <Text style={styles.bannerText}>{dog.injury_notes}</Text>}
              </View>
            </View>
          </Card>
        )}

        {dog.vaccinated && dog.vaccination_notes && (
          <Card variant="success">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="vaccine" size={14} color={colors.success} />
              <Text style={{ color: colors.success, fontWeight: fonts.bold, fontSize: fonts.sm }}>{dog.vaccination_notes}</Text>
            </View>
          </Card>
        )}

        {/* Location */}
        <Card variant="accent">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 }}>
            <Icon name="pin" size={14} color={colors.primary} />
            <Text style={styles.locTitle}>{isLostPet ? 'Last Known Location' : 'Last Seen'}</Text>
          </View>
          <Text style={styles.locArea}>{dog.area || 'Unknown'}, {dog.city || 'Unknown'}</Text>
          {dog.lat && <Text style={styles.locCoords}>{dog.lat.toFixed(4)}°N, {dog.lng.toFixed(4)}°E</Text>}
        </Card>

        {/* Map */}
        {dog.lat && dog.lng && MapView && (
          <View style={styles.mapWrap}>
            <MapView style={styles.map} scrollEnabled={false} zoomEnabled={false}
              initialRegion={{ latitude: dog.lat, longitude: dog.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
              <Marker coordinate={{ latitude: dog.lat, longitude: dog.lng }} pinColor={colors.primary} />
            </MapView>
          </View>
        )}
        {dog.lat && dog.lng && !MapView && (
          <Card variant="flat">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="pin" size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: fonts.sm, color: colors.textSecondary }}>
                {dog.lat.toFixed(4)}°N, {dog.lng.toFixed(4)}°E — Map available on mobile
              </Text>
            </View>
          </Card>
        )}

        {/* Notes */}
        {dog.notes && (
          <Card variant="flat">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 }}>
              <Icon name="notes" size={12} color={colors.textMuted} />
              <Text style={styles.notesLabel}>NOTES</Text>
            </View>
            <Text style={styles.notesText}>{dog.notes}</Text>
          </Card>
        )}

        <Text style={styles.reporterText}>
          Reported by {dog.reporter_name || 'Anonymous'} · {timeAgo(dog.created_at)}
        </Text>

        {/* Status update */}
        {!isLostPet && user && (
          <Card variant="elevated">
            <Text style={styles.statusLabel}>UPDATE STATUS</Text>
            <StatusSelector value={status} onChange={handleStatusChange} disabled={statusSaving} />
            {statusSaving && <Text style={styles.statusMsg}>Saving...</Text>}
            {statusSaved && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm }}>
                <Icon name="check" size={14} color={colors.success} />
                <Text style={[styles.statusMsg, { color: colors.success }]}>Updated</Text>
              </View>
            )}
          </Card>
        )}

        {/* Contact */}
        {isLostPet && dog.owner_phone ? (
          <Button title="Contact Owner" onPress={() => Linking.openURL(`tel:${dog.owner_phone}`)} variant="primary" size="lg" />
        ) : (
          <Button title="Contact Reporter" variant="primary" size="lg" />
        )}

        {/* Matches */}
        {matches.length > 0 && (
          <Card variant="elevated" style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <Icon name={isLostPet ? 'dog' : 'search'} size={14} color={colors.textSecondary} />
              <Text style={styles.matchesTitle}>
                {isLostPet ? 'Possible Stray Matches' : 'Owner Looking?'}
              </Text>
            </View>
            {matches.map(m => (
              <DogCard key={m.id} dog={m} variant="compact" onPress={() => navigation.push('Dog', { dogId: m.id })} />
            ))}
          </Card>
        )}

        {/* Delete */}
        {user && (
          <View style={{ marginTop: spacing.lg }}>
            <Button title="Delete record" onPress={handleDelete} variant="danger" />
          </View>
        )}

        <View style={{ height: spacing.huge }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgScreen, gap: spacing.md },
  loadingText: { fontSize: fonts.base, color: colors.textMuted },

  hero: { height: 200, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heroImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroBadges: {
    position: 'absolute', bottom: spacing.md, left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  nameSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  dogName: { fontWeight: fonts.black, fontSize: fonts.xxl, color: colors.text },
  dogId: { color: colors.textSecondary, fontSize: fonts.sm, marginTop: 2 },
  aiBadge: {
    backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.success + '30',
    borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', gap: 2,
  },
  aiBadgeText: { fontSize: 9, fontWeight: fonts.bold, color: colors.success },

  passportCta: {
    backgroundColor: colors.secondary, borderRadius: radius.xl, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.lg, ...shadows.md,
  },
  passportCtaTitle: { color: '#fff', fontWeight: fonts.bold, fontSize: fonts.base },
  passportCtaSub: { color: 'rgba(255,255,255,0.6)', fontSize: fonts.xs, marginTop: 1 },
  passportCtaArrow: { color: colors.accent, fontSize: fonts.xl, fontWeight: fonts.bold },

  attrsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  attrCard: {
    width: '48%', backgroundColor: colors.bgSection, borderRadius: radius.md,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  attrLabel: { fontSize: fonts.xs, color: colors.textMuted },
  attrValue: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: colors.text },

  bannerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bannerTitle: { fontSize: fonts.sm, fontWeight: fonts.bold },
  bannerText: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },

  locTitle: { fontWeight: fonts.bold, fontSize: fonts.sm, color: colors.primary },
  locArea: { fontSize: fonts.base, fontWeight: fonts.semibold, color: colors.text },
  locCoords: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 2 },

  mapWrap: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.md, height: 180, ...shadows.sm },
  map: { width: '100%', height: '100%' },

  notesLabel: { fontSize: fonts.xs, color: colors.textMuted, fontWeight: fonts.semibold, letterSpacing: 0.5 },
  notesText: { fontSize: fonts.base, color: colors.textSecondary, lineHeight: 22 },

  reporterText: { fontSize: fonts.sm, color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' },

  statusLabel: { fontSize: fonts.xs, fontWeight: fonts.bold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.md },
  statusMsg: { fontSize: fonts.sm, color: colors.textMuted },

  matchesTitle: { fontSize: fonts.sm, fontWeight: fonts.bold, color: colors.textSecondary, letterSpacing: 0.5 },
})
