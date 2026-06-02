import React from 'react'
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Share, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'

let QRCode = null
if (Platform.OS !== 'web') {
  try { QRCode = require('react-native-qrcode-svg').default } catch {}
}
import { colors, fonts, spacing, radius, shadows, layout, statusConfig } from '../lib/theme'
import { generatePassportId } from '../lib/helpers'
import Header from '../components/Header'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Icon from '../components/Icon'

export default function DogPassportScreen({ route }) {
  const { dog } = route?.params || {}
  const navigation = useNavigation()

  if (!dog) return (
    <View style={styles.centerWrap}>
      <Icon name="paw" size={56} color={colors.primary} />
      <Text style={styles.emptyTitle}>No dog data</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} variant="primary" size="sm" style={{ width: 160 }} />
    </View>
  )

  const passportId = generatePassportId(dog.dog_id)
  const isLostPet = dog.report_type === 'lost_pet'
  const displayName = isLostPet ? (dog.pet_name || 'Unknown') : dog.dog_id
  const config = statusConfig[dog.status] || statusConfig.sighted
  const confLevel = (dog.confidence || 0) >= 80 ? 'high' : (dog.confidence || 0) >= 60 ? 'mid' : 'low'
  const confColor = confLevel === 'high' ? colors.success : confLevel === 'mid' ? colors.accent : colors.danger

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Dog Passport — ${displayName}\n\n` +
          `ID: ${passportId}\n` +
          `Breed: ${dog.breed || 'Unknown'}\n` +
          `Color: ${dog.color || 'Unknown'}\n` +
          `Location: ${dog.area || ''}, ${dog.city || ''}\n` +
          `Status: ${config.label}\n\n` +
          `— PawTrace India`,
      })
    } catch {}
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Dog Passport" subtitle="Digital Identity Card" back="Back" onBack={() => navigation.goBack()} variant="dark" />

      <View style={styles.content}>
        {/* PASSPORT CARD */}
        <View style={styles.passport}>
          {/* Top banner */}
          <View style={styles.passportBanner}>
            <View style={styles.bannerLeft}>
              <Icon name="paw" size={20} color={colors.accent} />
              <View>
                <Text style={styles.bannerTitle}>PAWTRACE INDIA</Text>
                <Text style={styles.bannerSub}>DIGITAL DOG PASSPORT</Text>
              </View>
            </View>
            <View style={styles.bannerIdWrap}>
              <Text style={styles.bannerId}>{passportId}</Text>
            </View>
          </View>

          {/* Photo + Identity */}
          <View style={styles.identitySection}>
            <View style={styles.photoFrame}>
              {dog.photo_url ? (
                <Image source={{ uri: dog.photo_url }} style={styles.dogPhoto} />
              ) : (
                <View style={styles.dogPhotoPlaceholder}>
                  <Icon name={isLostPet ? 'search' : 'dog'} size={48} color={colors.textMuted} />
                </View>
              )}
              {/* Status overlay */}
              <View style={[styles.statusOverlay, { backgroundColor: config.color }]}>
                <Text style={styles.statusOverlayText}>{config.label.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.identityInfo}>
              <Text style={styles.dogName}>{displayName}</Text>
              <Text style={styles.dogBreed}>{dog.breed || 'Unknown breed'}</Text>

              <View style={styles.miniGrid}>
                <View style={styles.miniItem}>
                  <Text style={styles.miniLabel}>COLOUR</Text>
                  <Text style={styles.miniValue}>{dog.color || '—'}</Text>
                </View>
                <View style={styles.miniItem}>
                  <Text style={styles.miniLabel}>SIZE</Text>
                  <Text style={styles.miniValue}>{dog.size || '—'}</Text>
                </View>
                <View style={styles.miniItem}>
                  <Text style={styles.miniLabel}>SEX</Text>
                  <Text style={styles.miniValue}>{dog.sex || '—'}</Text>
                </View>
                <View style={styles.miniItem}>
                  <Text style={styles.miniLabel}>AGE</Text>
                  <Text style={styles.miniValue} numberOfLines={1}>{dog.age?.split('(')[0]?.trim() || '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Divider with paw prints */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerPawWrap}><Icon name="paw" size={12} color={colors.textMuted} style={{ opacity: 0.4 }} /></View>
            <View style={styles.dividerLine} />
          </View>

          {/* Health & AI Section */}
          <View style={styles.healthSection}>
            <View style={styles.healthGrid}>
              <View style={[styles.healthItem, { backgroundColor: dog.vaccinated ? colors.successSoft : colors.dangerSoft }]}>
                <Icon name="vaccine" size={18} color={dog.vaccinated ? colors.success : colors.danger} />
                <Text style={[styles.healthLabel, { color: dog.vaccinated ? colors.success : colors.danger }]}>
                  {dog.vaccinated ? 'Vaccinated' : 'Not Vaccinated'}
                </Text>
              </View>
              <View style={[styles.healthItem, { backgroundColor: dog.injured ? colors.dangerSoft : colors.successSoft }]}>
                <Icon name={dog.injured ? 'warning' : 'check'} size={18} color={dog.injured ? colors.danger : colors.success} />
                <Text style={[styles.healthLabel, { color: dog.injured ? colors.danger : colors.success }]}>
                  {dog.injured ? 'Injured' : 'Healthy'}
                </Text>
              </View>
              <View style={[styles.healthItem, { backgroundColor: confColor + '15' }]}>
                <Icon name="ai" size={18} color={confColor} />
                <Text style={[styles.healthLabel, { color: confColor }]}>
                  {dog.confidence ? `${dog.confidence}% AI` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Location + QR */}
          <View style={styles.bottomSection}>
            <View style={styles.locationInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Icon name="pin" size={8} color={colors.textMuted} />
                <Text style={styles.sectionLabel}>LOCATION</Text>
              </View>
              <Text style={styles.locationArea}>{dog.area || 'Unknown'}</Text>
              <Text style={styles.locationCity}>{dog.city || 'Unknown'}</Text>
              {dog.lat && (
                <Text style={styles.coords}>{dog.lat.toFixed(4)}°N, {dog.lng.toFixed(4)}°E</Text>
              )}

              <View style={styles.reporterWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Icon name="profile" size={8} color={colors.textMuted} />
                  <Text style={styles.sectionLabel}>REPORTER</Text>
                </View>
                <Text style={styles.reporterName}>{dog.reporter_name || 'Anonymous'}</Text>
              </View>

              {isLostPet && dog.owner_phone && (
                <View style={styles.reporterWrap}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Icon name="call" size={8} color={colors.textMuted} />
                    <Text style={styles.sectionLabel}>OWNER</Text>
                  </View>
                  <Text style={[styles.reporterName, { color: colors.primary }]}>{dog.owner_phone}</Text>
                </View>
              )}
            </View>

            <View style={styles.qrSection}>
              <View style={styles.qrFrame}>
                {QRCode ? (
                  <QRCode
                    value={`pawtrace://dog/${dog.id || dog.dog_id}`}
                    size={100}
                    color={colors.secondary}
                    backgroundColor="#fff"
                  />
                ) : (
                  <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSection, borderRadius: radius.sm }}>
                    <Icon name="qr" size={32} color={colors.textMuted} />
                    <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 4 }}>QR on mobile</Text>
                  </View>
                )}
              </View>
              <Text style={styles.qrLabel}>SCAN TO VIEW</Text>
              <Text style={styles.qrSub}>Dog Profile</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.passportFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="paw" size={9} color={colors.textMuted} />
              <Text style={styles.footerText}>PawTrace India · AI-Powered Dog Finder</Text>
            </View>
            <Text style={styles.footerDate}>Issued {new Date(dog.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
        </View>

        {/* Extra info cards */}
        {dog.vaccinated && dog.vaccination_notes && (
          <Card variant="success">
            <View style={styles.extraRow}>
              <Icon name="vaccine" size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.extraTitle, { color: colors.success }]}>Vaccination Record</Text>
                <Text style={styles.extraText}>{dog.vaccination_notes}</Text>
              </View>
            </View>
          </Card>
        )}

        {dog.injured && dog.injury_notes && (
          <Card variant="danger">
            <View style={styles.extraRow}>
              <Icon name="warning" size={18} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.extraTitle, { color: colors.danger }]}>Injury Notes</Text>
                <Text style={styles.extraText}>{dog.injury_notes}</Text>
              </View>
            </View>
          </Card>
        )}

        {dog.notes && (
          <Card variant="flat">
            <View style={styles.extraRow}>
              <Icon name="notes" size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.extraTitle, { color: colors.textSecondary }]}>Notes</Text>
                <Text style={styles.extraText}>{dog.notes}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <Button title="Share" onPress={handleShare} variant="primary" />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Profile" onPress={() => navigation.navigate('Dog', { dogId: dog.id })} variant="secondary" />
          </View>
        </View>

        <View style={{ height: spacing.huge }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen },
  content: { paddingHorizontal: spacing.lg },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgScreen, gap: spacing.lg },
  emptyTitle: { fontSize: fonts.lg, color: colors.textMuted },

  // Passport
  passport: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.secondary + '15',
    ...shadows.lg,
  },

  // Banner
  passportBanner: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerTitle: { color: colors.accent, fontWeight: fonts.black, fontSize: fonts.sm, letterSpacing: 2 },
  bannerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 8, letterSpacing: 1, marginTop: 1 },
  bannerIdWrap: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  bannerId: { color: colors.accent, fontSize: fonts.xs, fontWeight: fonts.bold, letterSpacing: 1 },

  // Identity
  identitySection: { flexDirection: 'row', padding: spacing.lg, gap: spacing.lg },
  photoFrame: { alignItems: 'center' },
  dogPhoto: {
    width: 110, height: 110, borderRadius: radius.lg,
    borderWidth: 3, borderColor: colors.primary + '30',
  },
  dogPhotoPlaceholder: {
    width: 110, height: 110, borderRadius: radius.lg,
    backgroundColor: colors.bgSection, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.primary + '30',
  },
  statusOverlay: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginTop: spacing.sm,
  },
  statusOverlayText: { color: '#fff', fontSize: 8, fontWeight: fonts.bold, letterSpacing: 0.5 },
  identityInfo: { flex: 1, justifyContent: 'center' },
  dogName: { fontSize: fonts.xl, fontWeight: fonts.black, color: colors.text, marginBottom: 2 },
  dogBreed: { fontSize: fonts.sm, color: colors.primary, fontWeight: fonts.semibold, marginBottom: spacing.md },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  miniItem: { width: '46%' },
  miniLabel: { fontSize: 8, color: colors.textMuted, letterSpacing: 0.5 },
  miniValue: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: colors.text, marginTop: 1 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginVertical: spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerPawWrap: { marginHorizontal: spacing.sm },

  // Health
  healthSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  healthGrid: { flexDirection: 'row', gap: spacing.sm },
  healthItem: {
    flex: 1, borderRadius: radius.md, padding: spacing.sm,
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  healthLabel: { fontSize: 9, fontWeight: fonts.bold, letterSpacing: 0.3, textAlign: 'center' },

  // Bottom
  bottomSection: { flexDirection: 'row', padding: spacing.lg, gap: spacing.lg },
  locationInfo: { flex: 1 },
  sectionLabel: { fontSize: 8, color: colors.textMuted, letterSpacing: 0.5 },
  locationArea: { fontSize: fonts.base, fontWeight: fonts.semibold, color: colors.text },
  locationCity: { fontSize: fonts.sm, color: colors.textSecondary },
  coords: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 2 },
  reporterWrap: { marginTop: spacing.md },
  reporterName: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: colors.text },

  // QR
  qrSection: { alignItems: 'center' },
  qrFrame: {
    padding: spacing.sm, backgroundColor: '#fff', borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.sm,
  },
  qrLabel: { fontSize: 8, color: colors.textMuted, letterSpacing: 0.5, marginTop: spacing.sm },
  qrSub: { fontSize: fonts.xs, color: colors.secondary, fontWeight: fonts.semibold },

  // Footer
  passportFooter: {
    backgroundColor: colors.secondary + '08',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 9, color: colors.textMuted },
  footerDate: { fontSize: 9, color: colors.textMuted },

  // Extra cards
  extraRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  extraTitle: { fontSize: fonts.sm, fontWeight: fonts.bold, marginBottom: 2 },
  extraText: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },

  // Actions
  actionRow: { flexDirection: 'row', gap: spacing.md },
})
