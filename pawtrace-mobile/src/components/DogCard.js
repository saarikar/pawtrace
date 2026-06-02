import React from 'react'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import Badge from './Badge'
import Icon from './Icon'
import { colors, fonts, spacing, radius, shadows } from '../lib/theme'
import { timeAgo } from '../lib/helpers'

export default function DogCard({ dog, onPress, variant = 'compact' }) {
  const isLost = dog.report_type === 'lost_pet'
  const name = isLost ? (dog.pet_name || 'Unknown Pet') : (dog.breed || 'Stray Dog')

  if (variant === 'full') {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.fullCard, pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] }]}>
        <View style={s.photoArea}>
          {dog.photo_url
            ? <Image source={{ uri: dog.photo_url }} style={s.fullPhoto} />
            : <View style={s.photoPlaceholder}><Icon name={isLost ? 'search' : 'dog'} size={44} color={colors.textMuted} /></View>}
          <View style={s.photoBadges}>
            <Badge label={isLost ? 'LOST' : 'FOUND'} color="#fff" bg={isLost ? colors.danger : colors.teal} size="sm" />
            {dog.area && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Badge label={dog.area.split(' ')[0]} color="#fff" bg="rgba(0,0,0,0.4)" size="xs" />
              </View>
            )}
          </View>
        </View>
        <View style={s.fullBody}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={s.fullName} numberOfLines={1}>{name}</Text>
            <Text style={s.timeText}>{timeAgo(dog.created_at)}</Text>
          </View>
          <Text style={s.meta}>{dog.breed} · {dog.color} · {dog.size}</Text>
          {dog.notes && <Text style={s.notes} numberOfLines={2}>{dog.notes}</Text>}
          <View style={s.footer}>
            <Text style={s.reporter}>By {dog.reporter_name || 'Anonymous'}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {dog.injured && <Badge label="Injured" color={colors.danger} size="xs" />}
              {dog.vaccinated && <Badge label="Vacc." color={colors.teal} size="xs" />}
            </View>
          </View>
        </View>
      </Pressable>
    )
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.compactCard, pressed && { opacity: 0.92 }]}>
      <View style={s.compactRow}>
        {dog.photo_url
          ? <Image source={{ uri: dog.photo_url }} style={s.compactPhoto} />
          : <View style={s.compactPlaceholder}><Icon name={isLost ? 'search' : 'dog'} size={22} color={colors.textMuted} /></View>}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={s.compactName} numberOfLines={1}>{name}</Text>
            <Badge label={isLost ? 'LOST' : 'FOUND'} color="#fff" bg={isLost ? colors.danger : colors.teal} size="xs" />
          </View>
          <Text style={s.compactBreed}>{dog.breed}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Icon name="pin" size={10} color={colors.textMuted} />
              <Text style={s.metaSmall}>{dog.area || '?'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Icon name="clock" size={10} color={colors.textMuted} />
              <Text style={s.metaSmall}>{timeAgo(dog.created_at)}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  fullCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, marginBottom: spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight, ...shadows.md },
  photoArea: { height: 170, position: 'relative', backgroundColor: colors.bgSection },
  fullPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoBadges: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  fullBody: { padding: spacing.lg },
  fullName: { fontWeight: fonts.bold, fontSize: fonts.md, color: colors.text, flex: 1, marginRight: 8 },
  timeText: { fontSize: fonts.xs, color: colors.textMuted },
  meta: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  notes: { fontSize: fonts.sm, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reporter: { fontSize: fonts.xs, color: colors.textMuted },

  compactCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  compactRow: { flexDirection: 'row', gap: spacing.md },
  compactPhoto: { width: 56, height: 56, borderRadius: radius.md },
  compactPlaceholder: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.bgSection, alignItems: 'center', justifyContent: 'center' },
  compactName: { fontWeight: fonts.bold, fontSize: fonts.base, color: colors.text, flex: 1, marginRight: 8 },
  compactBreed: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: 4 },
  metaSmall: { fontSize: fonts.xs, color: colors.textMuted },
})
